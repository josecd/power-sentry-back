import { Test, TestingModule } from '@nestjs/testing';
import { ShellyController } from './shelly.controller';

describe('ShellyController', () => {
  let controller: ShellyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShellyController],
    }).compile();

    controller = module.get<ShellyController>(ShellyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
