import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ShellyController } from './shelly.controller';
import { ShellyService } from './shelly.service';
import { ShellyDevice } from './entities/shelly.entity/shelly.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { WeatherModule } from 'src/weather/weather.module';
import { HistoryModule } from 'src/history/history.module';
import { EnergyModule } from 'src/energy/energy.module';

@Module({
  imports: [
  TypeOrmModule.forFeature([ShellyDevice]), 
  forwardRef(() => EnergyModule),
  HttpModule, 
  ScheduleModule.forRoot(),
  WeatherModule,
  HistoryModule
],
  controllers: [ShellyController],
  providers: [ShellyService],
  exports: [ShellyService]
})
export class ShellyModule {}