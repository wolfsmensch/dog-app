import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { APP_CONFIG, loadConfig } from './config/configuration';
import { HealthModule } from './health/health.module';
import { Pet } from './pet/pet.entity';
import { WalkState } from './schedule/walk-state.entity';
import { SeedService } from './seed/seed.service';
import { Walker } from './walkers/walker.entity';
import { Weight } from './weights/weight.entity';

const config = loadConfig();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: join(config.dataDir, 'app.sqlite'),
      entities: [Walker, WalkState, Weight, Pet],
      // Small single-file app for two users; schema sync is sufficient.
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Walker, WalkState, Weight, Pet]),
    HealthModule,
  ],
  providers: [{ provide: APP_CONFIG, useValue: config }, SeedService],
})
export class AppModule {}
