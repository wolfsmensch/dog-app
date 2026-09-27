import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { todayLocal } from '../common/dates';
import { APP_CONFIG, AppConfig } from '../config/configuration';
import { Pet } from '../pet/pet.entity';
import { WalkState } from '../schedule/walk-state.entity';

/** Creates DATA_DIR, enables WAL, seeds neutral single-row tables. */
@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async onModuleInit(): Promise<void> {
    mkdirSync(this.config.dataDir, { recursive: true });
    mkdirSync(join(this.config.dataDir, 'uploads'), { recursive: true });
    await this.dataSource.query('PRAGMA journal_mode=WAL');

    const petRepo = this.dataSource.getRepository(Pet);
    if (!(await petRepo.findOneBy({ id: 1 }))) {
      await petRepo.save(
        petRepo.create({
          id: 1,
          name: 'Pet',
          birthDate: null,
          photoPath: null,
          updatedAt: new Date().toISOString(),
        }),
      );
    }

    const stateRepo = this.dataSource.getRepository(WalkState);
    if (!(await stateRepo.findOneBy({ id: 1 }))) {
      await stateRepo.save(
        stateRepo.create({ id: 1, todayWalkerId: null, todayDate: todayLocal() }),
      );
    }
  }
}
