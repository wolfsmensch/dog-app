import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Weight } from './weight.entity';
import { WeightsController } from './weights.controller';
import { WeightsService } from './weights.service';

@Module({
  imports: [TypeOrmModule.forFeature([Weight])],
  controllers: [WeightsController],
  providers: [WeightsService],
})
export class WeightsModule {}
