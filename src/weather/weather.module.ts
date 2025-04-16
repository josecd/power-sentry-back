import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { WeatherService } from './weather.service';
import { SunService } from './sun.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [WeatherService, SunService],
  exports: [WeatherService, SunService],
})
export class WeatherModule {}