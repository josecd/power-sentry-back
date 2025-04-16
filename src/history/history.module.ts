import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceHistory } from './entities/history.entity';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceHistory])],
  providers: [HistoryService],
  controllers: [HistoryController],
  exports: [HistoryService]
})
export class HistoryModule {}