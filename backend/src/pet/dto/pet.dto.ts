import { Transform } from 'class-transformer';
import { IsOptional, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdatePetDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(1)
  @MaxLength(50)
  name?: string;

  /** 'YYYY-MM-DD'. Must be a real past-or-today date (checked in service). */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  birthDate?: string;
}

export interface PetDto {
  name: string;
  birthDate: string | null;
  photoUrl: string | null;
}
