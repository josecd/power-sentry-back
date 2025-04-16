import { Controller, Get, Param, Query } from '@nestjs/common';
import { EnergyService } from './energy.service';
import { EnergyRecord } from './entities/energy-record.entity/energy-record.entity';

@Controller('energy')
export class EnergyController {
  constructor(private readonly energyService: EnergyService) {}

  @Get(':deviceId/history')
  async getHistory(
    @Param('deviceId') deviceId: string,
    @Query('period') period: string = 'week'
  ): Promise<EnergyRecord[]> {
    return this.energyService.getConsumptionHistory(
      parseInt(deviceId),
      'day'
    );
  }

  @Get(':deviceId/summary')
  async getSummary(
    @Param('deviceId') deviceId: string
  ): Promise<any> {
    return this.energyService.getEnergySummary(parseInt(deviceId));
  }

  @Get(':deviceId/daily')
  async getDailyConsumption(
    @Param('deviceId') deviceId: string,
    @Query('days') days: number = 7
  ): Promise<any[]> {
    return this.energyService.getDailyConsumption(
      parseInt(deviceId),
      days
    );
  }
}