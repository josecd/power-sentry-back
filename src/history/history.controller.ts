import { Controller, Get, Param, Query } from '@nestjs/common';
import { HistoryService } from './history.service';
import { DeviceHistory } from './entities/history.entity';
import { Between } from 'typeorm';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get(':deviceId')
  async getHistory(@Param('deviceId') deviceId: string): Promise<DeviceHistory[]> {
    return this.historyService.getDeviceHistory(parseInt(deviceId));
  }

  @Get(':deviceId/last-on')
  async getLastOnEvent(@Param('deviceId') deviceId: string): Promise<DeviceHistory | null> {
    return this.historyService.getLastOnEvent(parseInt(deviceId));
  }

  @Get(':deviceId/period')
  async getEventsInPeriod(
    @Param('deviceId') deviceId: string,
    @Query('start') start: string,
    @Query('end') end: string
  ): Promise<DeviceHistory[]> {
    return this.historyService.getEventsInPeriod(
      parseInt(deviceId),
      new Date(start),
      new Date(end)
    );
  }
}