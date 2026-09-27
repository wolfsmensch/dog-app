import { Type } from 'class-transformer';
import { IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

export class SetTodayDto {
  @IsInt()
  walkerId!: number;
}

export class WeekQuery {
  /** Monday of the week, 'YYYY-MM-DD'. Defaults to the current week. */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  start?: string;
}

export class MonthQuery {
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;
}

export interface DayAssignment {
  date: string;
  walkerId: number | null;
}
