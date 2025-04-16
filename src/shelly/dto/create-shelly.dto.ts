export class CreateShellyDto {
  name: string;
  ipAddress: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  weatherControlEnabled?: boolean;
  turnOnWhenRain?: boolean;
  turnOnWhenTempBelow?: number;
  turnOnWhenTempAbove?: number;
}