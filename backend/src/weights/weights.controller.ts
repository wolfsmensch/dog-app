import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UpdateWeightDto, UpsertWeightDto, WeightDto, WeightListQuery } from './dto/weight.dto';
import { WeightsService } from './weights.service';

@Controller('weights')
export class WeightsController {
  constructor(private readonly weights: WeightsService) {}

  @Get()
  list(@Query() q: WeightListQuery): Promise<WeightDto[]> {
    return this.weights.list(q.from, q.to);
  }

  @Post()
  upsert(@Body() dto: UpsertWeightDto): Promise<WeightDto> {
    return this.weights.upsert(dto.date, dto.kg);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWeightDto): Promise<WeightDto> {
    return this.weights.update(id, dto.date, dto.kg);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.weights.remove(id);
  }
}
