import { EnergyRecord } from "../entities/energy-record.entity/energy-record.entity";

export interface IEnergyService {
  createEnergyRecord(
    deviceId: number,
    data: {
      power: number;
      energy: number;
      voltage?: number;
      current?: number;
      pf?: number;
    },
    interval?: 'minute' | 'hour' | 'day'
  ): Promise<EnergyRecord>;

  getConsumptionHistory(
    deviceId: number,
    period?: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'
  ): Promise<EnergyRecord[]>;

  getEnergySummary(deviceId: number): Promise<{
    totalEnergy: number;
    avgPower: number;
    maxPower: number;
  }>;

  getDailyConsumption(
    deviceId: number,
    days?: number
  ): Promise<{ date: string; energy: number }[]>;

  getHourlyConsumption(
    deviceId: number,
    day?: Date
  ): Promise<{ hour: number; power: number }[]>;
}