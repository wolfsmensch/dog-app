import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { ConfigModule } from './config/config.module';
import { loadConfig } from './config/configuration';
import { HealthModule } from './health/health.module';
import { Pet } from './pet/pet.entity';
import { WalkState } from './schedule/walk-state.entity';
import { SeedService } from './seed/seed.service';
import { Walker } from './walkers/walker.entity';
import { Weight } from './weights/weight.entity';

const config = loadConfig();

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: join(config.dataDir, 'app.sqlite'),
      entities: [Walker, WalkState, Weight, Pet],
      // Small single-file app for two users; schema sync is sufficient.
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Walker, WalkState, Weight, Pet]),
    HealthModule,
    AuthModule,
  ],
  providers: [SeedService, { provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
