// energy-tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EnergyService } from '../energy.service';
import { ShellyService } from 'src/shelly/shelly.service';

@Injectable()
export class EnergyTasks {
  private readonly logger = new Logger(EnergyTasks.name);
  private hourlyLock = false;
  private dailyLock = false;
  private minuteLock: { timestamp: number; minute: number } | null = null;
  private readonly MINUTE_LOCK_TIMEOUT = 55000; // 55 segundos

  constructor(
    private energyService: EnergyService,
    private shellyService: ShellyService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async recordMinuteMetrics() {
    const now = new Date();
    const currentMinute = now.getMinutes();
    const currentTimestamp = Date.now();

    if (this.isMinuteLocked(currentMinute, currentTimestamp)) {
      return;
    }

    this.acquireMinuteLock(currentMinute, currentTimestamp);

    try {
      const devices = await this.shellyService.findAll();
      this.logger.log(`Procesando ${devices.length} dispositivos para minuto ${currentMinute}`);

      for (const device of devices) {
        await this.processDevice(device, currentMinute);
      }
    } catch (error) {
      this.logger.error(`Error en procesamiento minuto ${currentMinute}: ${error.message}`);
    } finally {
      this.releaseMinuteLock(currentMinute);
    }
  }

  private async processDevice(device: any, minute: number, retries = 2): Promise<void> {
    try {
      const metrics = await this.shellyService.fetchDeviceMetrics(device.ipAddress);
      
      await this.energyService.createEnergyRecord(device.id, {
        power: metrics.data.apower,
        energy: metrics.data.aenergy.total,
        voltage: metrics.data.voltage,
        current: metrics.data.current,
        pf: metrics.data.pf,
        frequency: metrics.data.freq,
        temperature: metrics.data.temperature.tC,
        output: metrics.data.output,
        energyByMinute: metrics.data.aenergy.by_minute,
        ret_aenergy: metrics.data.ret_aenergy,
        rawData: metrics.data,
      });
    
      this.logger.debug(`Datos de ${device.id} registrados para minuto ${minute}`);
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        await this.processDevice(device, minute, retries - 1);
      } else {
        throw error;
      }
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async aggregateHourlyData() {
    if (this.hourlyLock) return;
    this.hourlyLock = true;

    try {
      const now = new Date();
      if (now.getMinutes() === 0) {
        const devices = await this.shellyService.findAll();
        
        await Promise.all(devices.map(async (device) => {
          const lastHourRecords = await this.energyService.getConsumptionHistory(
            device.id,
            'minute',
            now.getTime() - 3600000,
            now.getTime(),
          );

          if (lastHourRecords.length > 0) {
            const stats = {
              power: lastHourRecords.reduce((sum, r) => sum + r.power, 0) / lastHourRecords.length,
              energy: lastHourRecords.reduce((sum, r) => sum + r.energy, 0),
              voltage: lastHourRecords[0]?.voltage,
            };

            await this.energyService.createEnergyRecord(
              device.id,
              stats,
              'hour',
            );

            this.logger.log(`Consumo horario ${device.id}: ${stats.energy.toFixed(3)} kWh`);
          }
        }));
      }
    } finally {
      this.hourlyLock = false;
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'America/Cancun' })
  async aggregateDailyData() {
    if (this.dailyLock) return;
    this.dailyLock = true;

    try {
      const devices = await this.shellyService.findAll();
      
      await Promise.all(devices.map(async (device) => {
        const summary = await this.energyService.getEnergySummary(device.id);
        
        await this.energyService.createEnergyRecord(
          device.id,
          {
            power: summary.avgPower,
            energy: summary.totalEnergy,
          },
          'day',
        );

        this.logger.log(`Resumen diario ${device.id}: ${summary.totalEnergy.toFixed(3)} kWh`);
      }));
    } finally {
      this.dailyLock = false;
    }
  }

  // Helpers para manejo de locks
  private isMinuteLocked(currentMinute: number, currentTimestamp: number): boolean {
    if (!this.minuteLock) return false;
    return currentTimestamp - this.minuteLock.timestamp < this.MINUTE_LOCK_TIMEOUT;
  }

  private acquireMinuteLock(minute: number, timestamp: number): void {
    this.minuteLock = { minute, timestamp };
  }

  private releaseMinuteLock(expectedMinute: number): void {
    if (this.minuteLock?.minute === expectedMinute) {
      this.minuteLock = null;
    }
  }
}