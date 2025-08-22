import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
