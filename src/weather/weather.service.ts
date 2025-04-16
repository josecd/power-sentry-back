import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WeatherService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  private getApiKey(): any {
    return this.configService.get<string>('ACCUWEATHER_API_KEY');
  }

  async getLocationKey(lat: number, lon: number): Promise<string> {
    const apiKey = this.getApiKey();
    const url = `http://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${apiKey}&q=${lat},${lon}`;
    
    const response = await firstValueFrom(this.httpService.get(url));
    return response.data.Key;
  }

  async getWeatherConditions(locationKey: string): Promise<any[]> {
    const apiKey = this.getApiKey();
    const url = `http://dataservice.accuweather.com/currentconditions/v1/${locationKey}/historical/24?apikey=${apiKey}&details=true`;
    
    const response = await firstValueFrom(this.httpService.get(url));
    return response.data;
  }

  async shouldTurnOnBasedOnWeather(device: any): Promise<boolean> {
    if (!device.weatherControlEnabled) return false;
    
    const conditions = await this.getWeatherConditions(device.locationKey);
    const currentCondition = conditions[0]; // La más reciente
    
    // Verificar condiciones de lluvia
    if (device.turnOnWhenRain && currentCondition.HasPrecipitation) {
      return true;
    }
    
    // Verificar temperatura por debajo del umbral
    if (device.turnOnWhenTempBelow && currentCondition.Temperature.Metric.Value <= device.turnOnWhenTempBelow) {
      return true;
    }
    
    // Verificar temperatura por encima del umbral
    if (device.turnOnWhenTempAbove && currentCondition.Temperature.Metric.Value >= device.turnOnWhenTempAbove) {
      return true;
    }
    
    return false;
  }
}