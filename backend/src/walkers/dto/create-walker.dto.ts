import { Transform } from 'class-transformer';
import { IsOptional, Matches, MaxLength, MinLength } from 'class-validator';
import { HEX_COLOR_RE } from '../walkers.constants';

export class CreateWalkerDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(1)
  @MaxLength(30)
  name!: string;

  @IsOptional()
  @Matches(HEX_COLOR_RE)
  color?: string;
}
