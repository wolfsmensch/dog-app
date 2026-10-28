import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Matches, MaxLength, Min, MinLength } from 'class-validator';
import { HEX_COLOR_RE } from '../walkers.constants';

export class UpdateWalkerDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(1)
  @MaxLength(30)
  name?: string;

  @IsOptional()
  @Matches(HEX_COLOR_RE)
  color?: string;

  /** New zero-based position in the queue; other walkers shift accordingly. */
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
