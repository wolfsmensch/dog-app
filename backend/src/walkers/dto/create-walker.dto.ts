import { Transform } from 'class-transformer';
import { IsHexColor, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateWalkerDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(1)
  @MaxLength(30)
  name!: string;

  @IsOptional()
  @IsHexColor()
  color?: string;
}
