import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { addDays, isDateString, todayLocal } from '../common/dates';
import { WeightDto } from './dto/weight.dto';
import { Weight } from './weight.entity';

function toDto(w: Weight): WeightDto {
  return { id: w.id, date: w.date, kg: w.kg };
}

@Injectable()
export class WeightsService {
  constructor(@InjectRepository(Weight) private readonly weights: Repository<Weight>) {}

  async list(from?: string, to?: string): Promise<WeightDto[]> {
    if (from !== undefined && !isDateString(from)) {
      throw new BadRequestException('Invalid from date');
    }
    if (to !== undefined && !isDateString(to)) {
      throw new BadRequestException('Invalid to date');
    }
    const qb = this.weights.createQueryBuilder('w').orderBy('w.date', 'DESC');
    if (from !== undefined) qb.andWhere('w.date >= :from', { from });
    if (to !== undefined) qb.andWhere('w.date <= :to', { to });
    return (await qb.getMany()).map(toDto);
  }

  async upsert(date: string | undefined, kg: number): Promise<WeightDto> {
    const target = date ?? todayLocal();
    if (!isDateString(target)) {
      throw new BadRequestException('Invalid date');
    }
    if (target > addDays(todayLocal(), 1)) {
      throw new BadRequestException('Date cannot be in the future');
    }
    const rounded = Math.round(kg * 10) / 10;
    const existing = await this.weights.findOneBy({ date: target });
    if (existing) {
      existing.kg = rounded;
      return toDto(await this.weights.save(existing));
    }
    return toDto(await this.weights.save(this.weights.create({ date: target, kg: rounded })));
  }

  async remove(id: number): Promise<void> {
    const entry = await this.weights.findOneBy({ id });
    if (!entry) throw new NotFoundException('Weight entry not found');
    await this.weights.remove(entry);
  }
}
