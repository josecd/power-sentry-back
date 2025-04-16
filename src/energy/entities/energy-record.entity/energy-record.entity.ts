// energy-record.entity.ts
import { ShellyDevice } from 'src/shelly/entities/shelly.entity/shelly.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';

@Entity()
@Index(['device', 'timestamp', 'interval'], { unique: true })
export class EnergyRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ShellyDevice, (device) => device.energyRecords)
  device: ShellyDevice;

  // --- Datos principales ---
  @Column({ type: 'float' })
  power: number; // Watts (apower)

  @Column({ type: 'float' })
  energy: number; // kWh (aenergy.total)

  @Column({ type: 'float', nullable: true })
  voltage: number; // V

  @Column({ type: 'float', nullable: true })
  current: number; // A

  @Column({ type: 'float', nullable: true })
  pf: number; // Factor de potencia

  @Column({ type: 'float', nullable: true })
  frequency: number; // Hz (freq)

  @Column({ type: 'float', nullable: true })
  temperature: number; // °C (temperature.tC)

  @Column({ type: 'boolean', nullable: true })
  output: boolean; // Estado (output)

  // --- Datos históricos detallados ---
  @Column({ type: 'json', nullable: true })
  energyByMinute: number[]; // aenergy.by_minute (últimos 3 minutos en Wh)

  @Column({ type: 'json', nullable: true })
  ret_aenergy: { total: number; by_minute: number[] }; // Energía devuelta (solar)

  @Column({ type: 'json', nullable: true })
  rawData: Record<string, any>; // ¡Guarda el JSON completo por si acaso!

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'varchar', length: 10 })
  interval: 'minute' | 'hour' | 'day';
}