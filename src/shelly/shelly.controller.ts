import { Controller, Get, Post, Body, Param, Put, Delete, NotFoundException } from '@nestjs/common';
import { ShellyService } from './shelly.service';
import { CreateShellyDto } from './dto/create-shelly.dto';
import { UpdateShellyDto } from './dto/update-shelly.dto';
import { ShellyDevice } from './entities/shelly.entity/shelly.entity';

@Controller('shelly')
export class ShellyController {
  constructor(private readonly shellyService: ShellyService) { }

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

  @Post(':id/setup-weather-control')
  async setupWeatherControl(@Param('id') id: string) {
    return this.shellyService.setupWeatherControl(+id);
  }

  @Post(':id/check-weather')
  async checkWeather(@Param('id') id: string) {
    return this.shellyService.checkAndUpdateBasedOnWeather(+id);
  }

  @Post('check-all-weather')
  async checkAllWeather() {
    const devices = await this.shellyService.findAll();
    const results = [];

    /* for (const device of devices) {
      if (device.weatherControlEnabled) {
        results.push(await this.shellyService.checkAndUpdateBasedOnWeather(device.id));
      }
    } */

    return results;
  }

  @Post(':id/enable-sun-control')
  async enableSunControl(
    @Param('id') id: string,
    @Body() body: { turnOnAtSunrise: boolean, turnOffAtSunset: boolean }
  ) {
    const device = await this.shellyService.findOne(+id);
    if (!device) throw new NotFoundException('Dispositivo no encontrado');

    device.sunriseSunsetControl = true;
    device.turnOnAtSunrise = body.turnOnAtSunrise;
    device.turnOffAtSunset = body.turnOffAtSunset;

    await this.shellyService.updateSunTimes(device.id);
    return this.shellyService.update(device.id, device);
  }

  @Get(':id/sun-times')
  async getSunTimes(@Param('id') id: string) {
    const device = await this.shellyService.findOne(+id);
    if (!device) throw new NotFoundException('Dispositivo no encontrado');

    return {
      sunrise: device.sunriseTime,
      sunset: device.sunsetTime
    };
  }

  @Get(':id/checkSunTimes')
  async checkSunTimes(@Param('id') id: string) {
    const device = await this.shellyService.checkSunTimes();
    console.log(device);
    
    return true
  }

}