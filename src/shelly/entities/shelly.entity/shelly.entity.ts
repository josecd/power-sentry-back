import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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
}