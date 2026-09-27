import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import { DayAssignment, MonthQuery, SetTodayDto, WeekQuery } from './dto/schedule.dto';
import { ScheduleService } from './schedule.service';

@Controller('schedule')
export class ScheduleController {
  constructor(private readonly schedule: ScheduleService) {}

  @Get('today')
  getToday(): Promise<{ date: string; walkerId: number | null }> {
    return this.schedule.getToday();
  }

  @Put('today')
  setToday(@Body() dto: SetTodayDto): Promise<{ date: string; walkerId: number }> {
    return this.schedule.setToday(dto.walkerId);
  }

  @Get('week')
  week(@Query() q: WeekQuery): Promise<DayAssignment[]> {
    return this.schedule.week(q.start);
  }

  @Get('month')
  month(@Query() q: MonthQuery): Promise<DayAssignment[]> {
    return this.schedule.month(q.year, q.month);
  }
}
