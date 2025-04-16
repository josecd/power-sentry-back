import { EnergyRecord } from 'src/energy/entities/energy-record.entity/energy-record.entity';
import { DeviceHistory } from 'src/history/entities/history.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity()
export class ShellyDevice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  ipAddress: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: false })
  isOn: boolean;

  @Column({ type: 'float', nullable: true })
  power: number;

  @Column({ type: 'float', nullable: true })
  energy: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastUpdated: Date;

  // Nuevos campos para control climático
  @Column({ nullable: true })
  locationKey: string;

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @Column({ default: false })
  weatherControlEnabled: boolean;

  @Column({ nullable: true })
  turnOnWhenRain: boolean;

  @Column({ nullable: true })
  turnOnWhenTempBelow: number;

  @Column({ nullable: true })
  turnOnWhenTempAbove: number;

  //

  @Column({ default: false })
  sunriseSunsetControl: boolean;

  @Column({ nullable: true })
  turnOnAtSunrise: boolean;

  @Column({ nullable: true })
  turnOffAtSunset: boolean;

  @Column({ nullable: true })
  sunriseTime: string;  // Formato "HH:MM"

  @Column({ nullable: true })
  sunsetTime: string;   // Formato "HH:MM"

  @OneToMany(() => DeviceHistory, history => history.device)
  history: DeviceHistory[];

  @OneToMany(() => EnergyRecord, record => record.device)
  energyRecords: EnergyRecord[];

}