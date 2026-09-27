import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PetDto, UpdatePetDto } from './dto/pet.dto';
import { MAX_PHOTO_BYTES, PetService } from './pet.service';

@Controller('pet')
export class PetController {
  constructor(private readonly pet: PetService) {}

  @Get()
  get(): Promise<PetDto> {
    return this.pet.get();
  }

  @Put()
  update(@Body() dto: UpdatePetDto): Promise<PetDto> {
    return this.pet.update(dto);
  }

  @Post('photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_PHOTO_BYTES },
    }),
  )
  setPhoto(@UploadedFile() file: Express.Multer.File | undefined): Promise<PetDto> {
    return this.pet.setPhoto(file);
  }

  @Delete('photo')
  @HttpCode(HttpStatus.OK)
  removePhoto(): Promise<PetDto> {
    return this.pet.removePhoto();
  }
}
