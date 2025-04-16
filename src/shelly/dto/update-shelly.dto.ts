export class UpdateShellyDto {
  name?: string;
  ipAddress?: string;
  description?: string;
  isOn?: boolean;
  latitude?: number;
  longitude?: number;
  weatherControlEnabled?: boolean;
  turnOnWhenRain?: boolean;
  turnOnWhenTempBelow?: number;
  turnOnWhenTempAbove?: number;

  sunriseSunsetControl?: boolean;
turnOnAtSunrise?: boolean;
turnOffAtSunset?: boolean;

}