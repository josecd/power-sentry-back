import { Test, TestingModule } from '@nestjs/testing';
import { ShellyService } from './shelly.service';

describe('ShellyService', () => {
  let service: ShellyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShellyService],
    }).compile();

    service = module.get<ShellyService>(ShellyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
