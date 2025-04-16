import { ShellyDevice } from 'src/shelly/entities/shelly.entity/shelly.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity()
export class DeviceHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ShellyDevice, device => device.history)
  device: ShellyDevice;

  @Column()
  action: string; // 'turn_on' | 'turn_off' | 'auto_on' | 'auto_off'

  @Column({ type: 'json', nullable: true })
  metadata: {
    reason?: string;
    temperature?: number;
    isRaining?: boolean;
    sunEvent?: 'sunrise' | 'sunset';
  };

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;
}