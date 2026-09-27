import { Transform } from 'class-transformer';
import { IsHexColor, IsInt, IsOptional, MaxLength, Min, MinLength } from 'class-validator';

export class UpdateWalkerDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(1)
  @MaxLength(30)
  name?: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  /** New zero-based position in the queue; other walkers shift accordingly. */
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
