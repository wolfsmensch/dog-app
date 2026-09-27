import { IsNumber, IsOptional, Matches, Max, Min } from 'class-validator';

export class UpsertWeightDto {
  /** 'YYYY-MM-DD'. Defaults to today when omitted. */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;

  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(1)
  @Max(150)
  kg!: number;
}

export class WeightListQuery {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;
}

export interface WeightDto {
  id: number;
  date: string;
  kg: number;
}
