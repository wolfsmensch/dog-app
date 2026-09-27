import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalkState } from '../schedule/walk-state.entity';
import { CreateWalkerDto } from './dto/create-walker.dto';
import { UpdateWalkerDto } from './dto/update-walker.dto';
import { Walker } from './walker.entity';
import { MAX_WALKERS, WALKER_PALETTE } from './walkers.constants';

export interface WalkerDto {
  id: number;
  name: string;
  color: string;
  position: number;
}

function toDto(w: Walker): WalkerDto {
  return { id: w.id, name: w.name, color: w.color, position: w.position };
}

@Injectable()
export class WalkersService {
  constructor(
    @InjectRepository(Walker) private readonly walkers: Repository<Walker>,
    @InjectRepository(WalkState) private readonly states: Repository<WalkState>,
  ) {}

  async list(): Promise<WalkerDto[]> {
    const all = await this.walkers.find({ order: { position: 'ASC' } });
    return all.map(toDto);
  }

  async create(dto: CreateWalkerDto): Promise<WalkerDto> {
    const count = await this.walkers.count();
    if (count >= MAX_WALKERS) {
      throw new BadRequestException(`Walker limit reached (${MAX_WALKERS})`);
    }
    const used = new Set((await this.walkers.find()).map((w) => w.color.toLowerCase()));
    const color =
      dto.color ?? WALKER_PALETTE.find((c) => !used.has(c.toLowerCase())) ?? WALKER_PALETTE[0];
    const maxPosition = await this.walkers
      .createQueryBuilder('w')
      .select('MAX(w.position)', 'max')
      .getRawOne<{ max: number | null }>()
      .then((r) => r?.max ?? -1);
    const walker = await this.walkers.save(
      this.walkers.create({ name: dto.name, color, position: maxPosition + 1 }),
    );
    return toDto(walker);
  }

  async update(id: number, dto: UpdateWalkerDto): Promise<WalkerDto> {
    const walker = await this.walkers.findOneBy({ id });
    if (!walker) throw new NotFoundException('Walker not found');
    if (dto.name !== undefined) walker.name = dto.name;
    if (dto.color !== undefined) walker.color = dto.color;
    if (dto.position !== undefined) {
      const all = await this.walkers.find({ order: { position: 'ASC' } });
      const rest = all.filter((w) => w.id !== id);
      const pos = Math.min(dto.position, rest.length);
      rest.splice(pos, 0, walker);
      for (let i = 0; i < rest.length; i++) rest[i].position = i;
      await this.walkers.save(rest);
      return toDto({ ...walker, position: pos });
    }
    return toDto(await this.walkers.save(walker));
  }

  async remove(id: number): Promise<void> {
    const all = await this.walkers.find({ order: { position: 'ASC' } });
    const walker = all.find((w) => w.id === id);
    if (!walker) throw new NotFoundException('Walker not found');
    if (all.length <= 1) {
      throw new BadRequestException('Cannot delete the last walker');
    }
    const rest = all.filter((w) => w.id !== id);
    for (let i = 0; i < rest.length; i++) rest[i].position = i;
    await this.walkers.remove(walker);
    await this.walkers.save(rest);

    const state = await this.states.findOneBy({ id: 1 });
    if (state && state.todayWalkerId === id) {
      state.todayWalkerId = rest[0].id;
      await this.states.save(state);
    }
  }
}
