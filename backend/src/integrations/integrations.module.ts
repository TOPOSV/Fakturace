import { Module } from '@nestjs/common';
import { AresService } from './ares/ares.service';
import { AresController } from './ares/ares.controller';

@Module({
  controllers: [AresController],
  providers: [AresService],
  exports: [AresService],
})
export class IntegrationsModule {}
