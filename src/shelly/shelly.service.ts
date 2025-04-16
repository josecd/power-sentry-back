import { Injectable, Logger,  } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateShellyDto } from './dto/create-shelly.dto';
import { UpdateShellyDto } from './dto/update-shelly.dto';
import { ShellyResponse, ShellyStatus } from './interfaces/shelly.interface';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ShellyDevice } from './entities/shelly.entity/shelly.entity';
import { Cron } from '@nestjs/schedule';
import { WeatherService } from 'src/weather/weather.service';
import { SunService } from 'src/weather/sun.service';
import { HistoryService } from 'src/history/history.service';
import { EnergyService } from 'src/energy/energy.service';

@Injectable()
export class ShellyService {
    private readonly logger = new Logger(ShellyService.name);
  
  constructor(
    @InjectRepository(ShellyDevice)
    private shellyRepository: Repository<ShellyDevice>,
    private httpService: HttpService,
    private weatherService: WeatherService,
    private sunService: SunService,
    private historyService: HistoryService,
    private energyService: EnergyService,
  ) {}

  async create(createShellyDto: CreateShellyDto): Promise<ShellyDevice> {
    const device = this.shellyRepository.create(createShellyDto);
    return this.shellyRepository.save(device);
  }

  async findAll(): Promise<ShellyDevice[]> {
    return this.shellyRepository.find();
  }

  async findOne(id: number): Promise<any> {
    return this.shellyRepository.findOne({ where: { id } });
  }

  async update(id: number, updateShellyDto: UpdateShellyDto): Promise<any> {
    await this.shellyRepository.update(id, updateShellyDto);
    return this.shellyRepository.findOne({ where: { id } });
  }

  async remove(id: number): Promise<void> {
    await this.shellyRepository.delete(id);
  }

  async getDeviceStatus(ipAddress: string): Promise<ShellyResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<ShellyStatus>(`http://${ipAddress}/rpc/Switch.GetStatus?id=0`),
      );
      return { isok: true, data: response.data };
    } catch (error) {
      return { isok: false, error: error.message };
    }
  }

  async toggleDevice(ipAddress: string, turnOn: boolean, reason?: string): Promise<ShellyResponse> {
    try {
      const action = turnOn ? 'Switch.Set?id=0&on=true' : 'Switch.Set?id=0&on=false';
      const response = await firstValueFrom(
        this.httpService.get(`http://${ipAddress}/rpc/${action}`),
      );
      
      // Actualizar estado en la base de datos
      const device = await this.shellyRepository.findOne({ where: { ipAddress } });
      if (device) {
        device.isOn = turnOn;
        device.lastUpdated = new Date();
        await this.shellyRepository.save(device);
        
        // Registrar en el histórico
        await this.historyService.logEvent(
          device.id, 
          turnOn ? 'turn_on' : 'turn_off',
          { reason }
        );
      }
      
      return { isok: true, data: response.data };
    } catch (error) {
      return { isok: false, error: error.message };
    }
  }

  async updateDeviceMetrics(ipAddress: string): Promise<ShellyResponse> {
    try {
      const statusResponse = await this.getDeviceStatus(ipAddress);
      if (!statusResponse.isok) {
        return statusResponse;
      }
  
      const status = statusResponse.data;
      const device = await this.shellyRepository.findOne({ where: { ipAddress } });
      
      if (device) {
        // Registrar métricas de energía
        await this.energyService.createEnergyRecord(device.id, {
          power: status.apower,
          energy: status.aenergy.total,
          voltage: status.voltage,
          current: status.current,
          pf: status.pf
        }, 'minute');
  
        // Actualizar dispositivo
        device.isOn = status.ison;
        device.power = status.apower;
        device.energy = status.aenergy.total;
        device.lastUpdated = new Date();
        await this.shellyRepository.save(device);
      }
  
      return { isok: true, data: device };
    } catch (error) {
      return { isok: false, error: error.message };
    }
  }
  


  async setupWeatherControl(id: number): Promise<ShellyDevice> {
    const device = await this.shellyRepository.findOne({ where: { id } });
    
    if (!device) throw new Error('Device not found');
    if (!device.latitude || !device.longitude) throw new Error('Coordinates not set');
    
    device.locationKey = await this.weatherService.getLocationKey(
      device.latitude,
      device.longitude
    );
    
    return this.shellyRepository.save(device);
  }

  async checkAndUpdateBasedOnWeather(id: any): Promise<any> {
    const device = await this.shellyRepository.findOne({ where: { id } });
    console.log("device",device);
    
    if (!device) return { isok: false, error: 'Device not found' };
    if (!device.weatherControlEnabled) return { isok: false, error: 'Weather control not enabled', device };
    
    const shouldTurnOn = await this.weatherService.shouldTurnOnBasedOnWeather(device);
    
    if (shouldTurnOn !== device.isOn) {
      const reason = this.getWeatherReason(status);
      return this.toggleDevice(device.ipAddress, shouldTurnOn);
    }
    
    return { isok: true, data: { action: 'no_change_needed', currentState: device.isOn } };
  }

  private getWeatherReason(status: any): string {
    if (status.HasPrecipitation) return 'rain_detected';
    if (status.Temperature?.Metric?.Value <= 10) return 'low_temperature';
    if (status.Temperature?.Metric?.Value >= 30) return 'high_temperature';
    return 'weather_condition';
  }

  // Programar chequeos periódicos (ejemplo cada hora)
  @Cron('0 * * * *') // Cada hora en el minuto 0
  async scheduledWeatherCheck() {
    console.log("Activate scheduledWeatherCheck ");
    
    const devices = await this.shellyRepository.find({ 
      where: { weatherControlEnabled: true } 
    });
    
    for (const device of devices) {
      await this.checkAndUpdateBasedOnWeather(device.id);
    }
  }
  async updateSunTimes(deviceId: number): Promise<ShellyDevice> {
    const device = await this.shellyRepository.findOne({ where: { id: deviceId } });
    if (!device || !device.locationKey) {
      throw new Error('Dispositivo o locationKey no configurado');
    }

    const { sunrise, sunset } = await this.sunService.getSunTimes(device.locationKey);
    device.sunriseTime = sunrise;
    device.sunsetTime = sunset;
    
    return this.shellyRepository.save(device);
  }

  @Cron('0 5 * * *') // Todos los días a las 5 AM
  async dailySunTimeUpdate() {
    console.log("Activate dailySunTimeUpdate ");
    const devices = await this.shellyRepository.find({ 
      where: { sunriseSunsetControl: true } 
    });
    
    for (const device of devices) {
      await this.updateSunTimes(device.id);
    }
  }

  @Cron('*/5 * * * *') // Cada 30 minutos
  async checkSunTimes() {
    console.log("Activate checkSunTimes ");
    const devices = await this.shellyRepository.find({ 
      where: { sunriseSunsetControl: true } 
    });
    
    const now = new Date();
    
    for (const device of devices) {
      if (!device.sunriseTime || !device.sunsetTime) continue;
      console.log("sunriseTime",device.sunriseTime);
      console.log("sunsetTime",device.sunsetTime);

      
      const shouldBeOn = this.sunService.shouldActivateBasedOnSunTime(
        now,
        device.sunriseTime,
        device.sunsetTime
      );
      
      // Solo cambiar estado si es necesario
      if ((shouldBeOn && !device.isOn && device.turnOnAtSunrise) || 
          (!shouldBeOn && device.isOn && device.turnOffAtSunset)) {
        await this.toggleDevice(device.ipAddress, shouldBeOn);
      }
    }
  }


async fetchDeviceMetrics(ipAddress: string): Promise<{
  data: {
    // --- Datos principales ---
    apower: number;
    aenergy: { total: number; by_minute: number[] };
    voltage: number;
    current: number;
    pf?: number;
    freq?: number;
    temperature: { tC: number; tF?: number };
    output: boolean;
    
    // --- Datos adicionales ---
    ret_aenergy?: { total: number; by_minute: number[] };
    errors?: Record<string, boolean>;
  };
}> {
  const response = await firstValueFrom(
    this.httpService.get(`http://${ipAddress}/rpc/Switch.GetStatus?id=0`, { 
      timeout: 5000 
    })
  );

  return {
    data: {
      ...response.data,
      // Forzar estructura consistente
      aenergy: {
        total: response.data.aenergy?.total || 0,
        by_minute: response.data.aenergy?.by_minute || [],
      },
      temperature: {
        tC: response.data.temperature?.tC || 0,
        tF: response.data.temperature?.tF || 0,
      },
    },
  };
}
}