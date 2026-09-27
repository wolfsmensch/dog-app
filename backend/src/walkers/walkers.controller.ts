import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateWalkerDto } from './dto/create-walker.dto';
import { UpdateWalkerDto } from './dto/update-walker.dto';
import { WalkerDto, WalkersService } from './walkers.service';

@Controller('walkers')
export class WalkersController {
  constructor(private readonly walkers: WalkersService) {}

  @Get()
  list(): Promise<WalkerDto[]> {
    return this.walkers.list();
  }

  @Post()
  create(@Body() dto: CreateWalkerDto): Promise<WalkerDto> {
    return this.walkers.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWalkerDto,
  ): Promise<WalkerDto> {
    return this.walkers.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.walkers.remove(id);
  }
}
