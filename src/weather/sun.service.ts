import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SunService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  private getApiKey(): any {
    return this.configService.get<string>('ACCUWEATHER_API_KEY');
  }

  async getSunTimes(locationKey: string): Promise<{ sunrise: string, sunset: string }> {
    const apiKey = this.getApiKey();
    const url = `http://dataservice.accuweather.com/forecasts/v1/daily/1day/${locationKey}?apikey=${apiKey}&details=true`

    try {
      const response = await firstValueFrom(this.httpService.get(url));
      const data = response.data["DailyForecasts"][0];
        console.log("sun", data.Sun.Rise.split('T')[1].substring(0, 5));
        console.log("rise", data.Sun.Set.split('T')[1].substring(0, 5) );
      return {
        sunrise: data.Sun.Rise.split('T')[1].substring(0, 5), // Extrae "HH:MM"
        sunset: data.Sun.Set.split('T')[1].substring(0, 5)    // Extrae "HH:MM"
      };
    } catch (error) {
      console.error('Error fetching sun times:', error);
      // Valores por defecto como fallback
      return {
        sunrise: '06:00',
        sunset: '18:00'
      };
    }
  }

  shouldActivateBasedOnSunTime(currentTime: Date, sunrise: string, sunset: string): boolean {
    const now = currentTime;
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    
    const [sunriseHours, sunriseMinutes] = sunrise.split(':').map(Number);
    const [sunsetHours, sunsetMinutes] = sunset.split(':').map(Number);
    
    // Crear objetos Date para comparación
    const sunriseTime = new Date();
    sunriseTime.setHours(sunriseHours, sunriseMinutes, 0, 0);
    
    const sunsetTime = new Date();
    sunsetTime.setHours(sunsetHours, sunsetMinutes, 0, 0);
    
    return now < sunriseTime || now > sunsetTime;
  }
}