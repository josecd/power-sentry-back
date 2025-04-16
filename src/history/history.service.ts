import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { DeviceHistory } from './entities/history.entity';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(DeviceHistory)
    private historyRepository: Repository<DeviceHistory>,
  ) {}

  async logEvent(
    deviceId: number,
    action: string,
    metadata?: any
  ): Promise<DeviceHistory> {
    const historyEntry = this.historyRepository.create({
      device: { id: deviceId },
      action,
      metadata
    });
    
    return this.historyRepository.save(historyEntry);
  }

  async getDeviceHistory(deviceId: number): Promise<DeviceHistory[]> {
    return this.historyRepository.find({
      where: { device: { id: deviceId } },
      order: { timestamp: 'DESC' }
    });
  }

  async getLastOnEvent(deviceId: number): Promise<DeviceHistory | null> {
    return this.historyRepository.findOne({
      where: { 
        device: { id: deviceId },
        action: 'turn_on'
      },
      order: { timestamp: 'DESC' }
    });
  }
  
  async getEventsInPeriod(
    deviceId: number, 
    start: Date, 
    end: Date
  ): Promise<DeviceHistory[]> {
    return this.historyRepository.find({
      where: {
        device: { id: deviceId },
        timestamp: Between(start, end)
      },
      order: { timestamp: 'DESC' }
    });
  }
}