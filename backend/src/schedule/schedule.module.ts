import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Walker } from '../walkers/walker.entity';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';
import { WalkState } from './walk-state.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Walker, WalkState])],
  controllers: [ScheduleController],
  providers: [ScheduleService],
})
export class ScheduleModule {}
