import { Injectable,  } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateShellyDto } from './dto/create-shelly.dto';
import { UpdateShellyDto } from './dto/update-shelly.dto';
import { ShellyResponse, ShellyStatus } from './interfaces/shelly.interface';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ShellyDevice } from './entities/shelly.entity/shelly.entity';

@Injectable()
export class ShellyService {
  constructor(
    @InjectRepository(ShellyDevice)
    private shellyRepository: Repository<ShellyDevice>,
    private httpService: HttpService,
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

  async toggleDevice(ipAddress: string, turnOn: boolean): Promise<ShellyResponse> {
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
}