import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnergyService } from './energy.service';
import { EnergyController } from './energy.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { ShellyModule } from '../shelly/shelly.module';
import { EnergyTasks } from './energy.tasks/energy.tasks';
import { EnergyRecord } from './entities/energy-record.entity/energy-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EnergyRecord]),
    ScheduleModule.forRoot(),
    forwardRef(() => ShellyModule) 
  ],
  providers: [EnergyService, EnergyTasks],
  controllers: [EnergyController],
  exports: [EnergyService]
})
export class EnergyModule {}