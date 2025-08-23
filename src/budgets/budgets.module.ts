
import { Module } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { BudgetsController } from './budgets.controller';
import { MetricsModule } from '../metrics/metrics.module';
import { ProjectionsModule } from '../projections/projections.module';

@Module({
  imports: [MetricsModule, ProjectionsModule],
  controllers: [BudgetsController],
  providers: [BudgetsService],
  exports: [BudgetsService],
})
export class BudgetsModule {}
