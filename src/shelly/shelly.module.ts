import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ShellyController } from './shelly.controller';
import { ShellyService } from './shelly.service';
import { ShellyDevice } from './entities/shelly.entity/shelly.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ShellyDevice]), HttpModule],
  controllers: [ShellyController],
  providers: [ShellyService],
})
export class ShellyModule {}