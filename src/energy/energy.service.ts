// energy.service.ts
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { ShellyService } from '../shelly/shelly.service';
import { EnergyRecord } from './entities/energy-record.entity/energy-record.entity';

@Injectable()
export class EnergyService {
  private readonly logger = new Logger(EnergyService.name);

  constructor(
    @InjectRepository(EnergyRecord)
    private energyRepository: Repository<EnergyRecord>,
    @Inject(forwardRef(() => ShellyService))
    private shellyService: ShellyService,
  ) {}

  async createEnergyRecord(
    deviceId: number,
    data: {
      power: number;
      energy: number;
      voltage?: number;
      current?: number;
      pf?: number;
      frequency?: number;
      temperature?: number;
      output?: boolean;
      energyByMinute?: number[];
      ret_aenergy?: { total: number; by_minute: number[] };
      rawData?: any;
    },
    interval: 'minute' | 'hour' | 'day' = 'minute'
  ): Promise<EnergyRecord> {
    // Validación de datos críticos
    if (data.voltage && (data.voltage < 100 || data.voltage > 250)) {
      this.logger.warn(`Voltaje inusual: ${data.voltage}V para dispositivo ${deviceId}`);
    }
  
    if (data.temperature && data.temperature > 70) {
      this.logger.error(`¡Alerta de temperatura! ${data.temperature}°C en dispositivo ${deviceId}`);
    }
  
    const now = new Date();
    now.setSeconds(0, 0);
  
    try {
      // Obtener último registro para posibles cálculos incrementales
      const lastRecord = await this.energyRepository.findOne({
        where: { device: { id: deviceId } },
        order: { timestamp: 'DESC' },
      });
  
      // Crear registro completo
      const record = this.energyRepository.create({
        device: { id: deviceId },
        timestamp: now,
        interval,
        power: data.power,
        energy: data.energy,
        voltage: data.voltage,
        current: data.current,
        pf: data.pf,
        frequency: data.frequency,
        temperature: data.temperature,
        output: data.output,
        energyByMinute: data.energyByMinute || [],
        ret_aenergy: data.ret_aenergy || { total: 0, by_minute: [] },
        rawData: data.rawData || null, // Guardamos el payload completo
      });
  
      // Manejo de duplicados
      return await this.energyRepository.save(record);
    } catch (err) {
      if (err.code === '23505') { // Violación de unique constraint
        this.logger.warn(`Registro duplicado para ${deviceId} en ${now}, actualizando...`);
        const existing = await this.energyRepository.findOne({
          where: {
            device: { id: deviceId },
            timestamp: now,
            interval,
          },
        });
        if (existing) {
          return this.energyRepository.save({ 
            ...existing,
            ...data,
            // Actualizamos campos específicos manteniendo los existentes
            energyByMinute: data.energyByMinute || existing.energyByMinute,
            ret_aenergy: data.ret_aenergy || existing.ret_aenergy,
            rawData: data.rawData || existing.rawData
          });
        }
      }
      this.logger.error(`Error guardando registro: ${err.message}`, err.stack);
      throw err;
    }
  }

  async getConsumptionHistory(
    deviceId: number,
    interval: 'minute' | 'hour' | 'day',
    startTime?: number,
    endTime?: number,
  ): Promise<EnergyRecord[]> {
    const where: any = {
      device: { id: deviceId },
      interval,
    };

    if (startTime) {
      where.timestamp = Between(
        new Date(startTime),
        new Date(endTime || Date.now()),
      );
    }

    return this.energyRepository.find({
      where,
      order: { timestamp: 'ASC' },
    });
  }

  async getEnergySummary(deviceId: number): Promise<{
    totalEnergy: number;
    avgPower: number;
    maxPower: number;
    avgVoltage?: number;
  }> {
    const result = await this.energyRepository
      .createQueryBuilder('record')
      .select('SUM(record.energy)', 'totalEnergy')
      .addSelect('AVG(record.power)', 'avgPower')
      .addSelect('MAX(record.power)', 'maxPower')
      .addSelect('AVG(record.voltage)', 'avgVoltage')
      .where('record.deviceId = :deviceId', { deviceId })
      .getRawOne();

    return {
      totalEnergy: parseFloat(result.totalEnergy) || 0,
      avgPower: parseFloat(result.avgPower) || 0,
      maxPower: parseFloat(result.maxPower) || 0,
      avgVoltage: parseFloat(result.avgVoltage) || undefined,
    };
  }

  async getEnergyCost(deviceId: number, ratePerKwh: number): Promise<number> {
    const { totalEnergy } = await this.getEnergySummary(deviceId);
    return totalEnergy * ratePerKwh;
  }

  async getDailyConsumption(
    deviceId: number,
    days: number = 7,
  ): Promise<{ date: string; energy: number }[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);

    return this.energyRepository
      .createQueryBuilder('record')
      .select(`DATE(record.timestamp)`, 'date')
      .addSelect('SUM(record.energy)', 'energy')
      .where('record.deviceId = :deviceId', { deviceId })
      .andWhere('record.timestamp >= :date', { date })
      .groupBy('DATE(record.timestamp)')
      .orderBy('DATE(record.timestamp)', 'ASC')
      .getRawMany();
  }

  async getHourlyConsumption(
    deviceId: number,
    day: Date = new Date(),
  ): Promise<{ hour: number; power: number }[]> {
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(day);
    end.setHours(23, 59, 59, 999);

    return this.energyRepository
      .createQueryBuilder('record')
      .select('EXTRACT(HOUR FROM record.timestamp)', 'hour')
      .addSelect('AVG(record.power)', 'power')
      .where('record.deviceId = :deviceId', { deviceId })
      .andWhere('record.timestamp BETWEEN :start AND :end', { start, end })
      .groupBy('EXTRACT(HOUR FROM record.timestamp)')
      .orderBy('hour', 'ASC')
      .getRawMany();
  }
}