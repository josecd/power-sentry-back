import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ShellyService } from './shelly.service';
import { CreateShellyDto } from './dto/create-shelly.dto';
import { UpdateShellyDto } from './dto/update-shelly.dto';
import { ShellyDevice } from './entities/shelly.entity/shelly.entity';

@Controller('shelly')
export class ShellyController {
  constructor(private readonly shellyService: ShellyService) {}

  @Post()
  create(@Body() createShellyDto: CreateShellyDto): Promise<ShellyDevice> {
    return this.shellyService.create(createShellyDto);
  }

  @Get()
  findAll(): Promise<ShellyDevice[]> {
    return this.shellyService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ShellyDevice> {
    return this.shellyService.findOne(+id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateShellyDto: UpdateShellyDto,
  ): Promise<ShellyDevice> {
    return this.shellyService.update(+id, updateShellyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.shellyService.remove(+id);
  }

  @Get(':id/status')
  async getStatus(@Param('id') id: string) {
    const device = await this.shellyService.findOne(+id);
    return this.shellyService.getDeviceStatus(device.ipAddress);
  }

  @Post(':id/toggle/:action')
  async toggle(
    @Param('id') id: string,
    @Param('action') action: string,
  ) {
    const device = await this.shellyService.findOne(+id);
    const turnOn = action === 'on';
    return this.shellyService.toggleDevice(device.ipAddress, turnOn);
  }

  @Post(':id/update-metrics')
  async updateMetrics(@Param('id') id: string) {
    const device = await this.shellyService.findOne(+id);
    return this.shellyService.updateDeviceMetrics(device.ipAddress);
  }
}