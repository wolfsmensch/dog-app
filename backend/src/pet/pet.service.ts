import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { Repository } from 'typeorm';
import { isDateString, todayLocal } from '../common/dates';
import { APP_CONFIG, AppConfig } from '../config/configuration';
import { PetDto, UpdatePetDto } from './dto/pet.dto';
import { Pet } from './pet.entity';

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

@Injectable()
export class PetService {
  constructor(
    @InjectRepository(Pet) private readonly pets: Repository<Pet>,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  private uploadsDir(): string {
    return join(this.config.dataDir, 'uploads');
  }

  private async row(): Promise<Pet> {
    const pet = await this.pets.findOneBy({ id: 1 });
    if (!pet) throw new NotFoundException('Pet not found');
    return pet;
  }

  async get(): Promise<PetDto> {
    const pet = await this.row();
    return {
      name: pet.name,
      birthDate: pet.birthDate,
      photoUrl: pet.photoPath ? `/uploads/${pet.photoPath}` : null,
    };
  }

  async update(dto: UpdatePetDto): Promise<PetDto> {
    if (dto.birthDate !== undefined) {
      if (!isDateString(dto.birthDate) || dto.birthDate > todayLocal()) {
        throw new BadRequestException('birthDate must be a real date not in the future');
      }
    }
    const pet = await this.row();
    if (dto.name !== undefined) pet.name = dto.name;
    if (dto.birthDate !== undefined) pet.birthDate = dto.birthDate;
    pet.updatedAt = new Date().toISOString();
    await this.pets.save(pet);
    return this.get();
  }

  async setPhoto(file: Express.Multer.File | undefined): Promise<PetDto> {
    if (!file) throw new BadRequestException('Photo file is required');
    const ext = ALLOWED_MIME[file.mimetype];
    if (!ext) {
      throw new BadRequestException('Only JPEG, PNG and WebP photos are allowed');
    }
    const pet = await this.row();
    const filename = `pet-${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;
    await this.writeFile(filename, file.buffer);
    await this.removeFile(pet.photoPath);
    pet.photoPath = filename;
    pet.updatedAt = new Date().toISOString();
    await this.pets.save(pet);
    return this.get();
  }

  async removePhoto(): Promise<PetDto> {
    const pet = await this.row();
    await this.removeFile(pet.photoPath);
    pet.photoPath = null;
    pet.updatedAt = new Date().toISOString();
    await this.pets.save(pet);
    return this.get();
  }

  private async writeFile(filename: string, buffer: Buffer): Promise<void> {
    const { writeFile } = await import('fs/promises');
    await writeFile(join(this.uploadsDir(), filename), buffer);
  }

  private async removeFile(photoPath: string | null): Promise<void> {
    if (!photoPath) return;
    try {
      await unlink(join(this.uploadsDir(), photoPath));
    } catch {
      // Best effort: file may already be gone.
    }
  }
}
