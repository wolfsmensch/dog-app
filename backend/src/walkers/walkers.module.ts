import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalkState } from '../schedule/walk-state.entity';
import { Walker } from './walker.entity';
import { WalkersController } from './walkers.controller';
import { WalkersService } from './walkers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Walker, WalkState])],
  controllers: [WalkersController],
  providers: [WalkersService],
  exports: [WalkersService],
})
export class WalkersModule {}
