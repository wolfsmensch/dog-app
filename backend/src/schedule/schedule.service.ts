import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { addDays, diffDays, isDateString, todayLocal } from '../common/dates';
import { Walker } from '../walkers/walker.entity';
import { DayAssignment } from './dto/schedule.dto';
import { WalkState } from './walk-state.entity';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Walker) private readonly walkers: Repository<Walker>,
    @InjectRepository(WalkState) private readonly states: Repository<WalkState>,
  ) {}

  private async ordered(): Promise<Walker[]> {
    return this.walkers.find({ order: { position: 'ASC' } });
  }

  /**
   * Rolls the anchor forward when days passed without opening the app,
   * and anchors the queue at the first walker when unset.
   */
  private async rolled(): Promise<{ walkers: Walker[]; anchorId: number | null; anchorDate: string }> {
    const walkers = await this.ordered();
    let state = await this.states.findOneBy({ id: 1 });
    if (!state) {
      state = this.states.create({ id: 1, todayWalkerId: null, todayDate: todayLocal() });
    }
    const today = todayLocal();
    if (walkers.length === 0) {
      state.todayWalkerId = null;
      state.todayDate = today;
      await this.states.save(state);
      return { walkers, anchorId: null, anchorDate: today };
    }
    if (state.todayWalkerId === null || !walkers.some((w) => w.id === state!.todayWalkerId)) {
      state.todayWalkerId = walkers[0].id;
      state.todayDate = today;
      await this.states.save(state);
      return { walkers, anchorId: state.todayWalkerId, anchorDate: today };
    }
    if (state.todayDate !== today) {
      const idx = walkers.findIndex((w) => w.id === state!.todayWalkerId);
      const steps = diffDays(state.todayDate, today);
      const next = steps > 0 ? walkers[((idx + steps) % walkers.length + walkers.length) % walkers.length] : walkers[idx];
      state.todayWalkerId = next.id;
      state.todayDate = today;
      await this.states.save(state);
    }
    return { walkers, anchorId: state.todayWalkerId, anchorDate: state.todayDate };
  }

  walkerFor(walkers: Walker[], anchorId: number, anchorDate: string, date: string): number {
    const idx = walkers.findIndex((w) => w.id === anchorId);
    const n = walkers.length;
    return walkers[(((idx + diffDays(anchorDate, date)) % n) + n) % n].id;
  }

  async getToday(): Promise<{ date: string; walkerId: number | null }> {
    const { anchorId, anchorDate } = await this.rolled();
    return { date: anchorDate, walkerId: anchorId };
  }

  async setToday(walkerId: number): Promise<{ date: string; walkerId: number }> {
    const walker = await this.walkers.findOneBy({ id: walkerId });
    if (!walker) throw new NotFoundException('Walker not found');
    const today = todayLocal();
    let state = await this.states.findOneBy({ id: 1 });
    if (!state) state = this.states.create({ id: 1 });
    state.todayWalkerId = walkerId;
    state.todayDate = today;
    await this.states.save(state);
    return { date: today, walkerId };
  }

  async week(start?: string): Promise<DayAssignment[]> {
    const { walkers, anchorId, anchorDate } = await this.rolled();
    let monday = start ?? mondayOf(todayLocal());
    if (!isDateString(monday)) throw new BadRequestException('Invalid start date');
    const days: DayAssignment[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(monday, i);
      days.push({
        date,
        walkerId: anchorId === null ? null : this.walkerFor(walkers, anchorId, anchorDate, date),
      });
    }
    return days;
  }

  async month(year: number, month: number): Promise<DayAssignment[]> {
    const { walkers, anchorId, anchorDate } = await this.rolled();
    const dim = new Date(year, month, 0).getDate();
    const days: DayAssignment[] = [];
    for (let d = 1; d <= dim; d++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        date,
        walkerId: anchorId === null ? null : this.walkerFor(walkers, anchorId, anchorDate, date),
      });
    }
    return days;
  }
}

function mondayOf(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = (dt.getUTCDay() + 6) % 7; // Monday = 0
  return addDays(date, -dow);
}
