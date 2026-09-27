import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, timingSafeEqual } from 'crypto';
import { APP_CONFIG, AppConfig } from '../config/configuration';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  /** Timing-safe compare via SHA-256 digests (handles different lengths). */
  private matches(candidate: string): boolean {
    const a = createHash('sha256').update(candidate, 'utf8').digest();
    const b = createHash('sha256').update(this.config.appPassword, 'utf8').digest();
    return timingSafeEqual(a, b);
  }

  async login(password: string): Promise<{ accessToken: string }> {
    if (!this.matches(password)) {
      throw new UnauthorizedException('Invalid password');
    }
    const accessToken = await this.jwt.signAsync({ sub: 'shared' });
    return { accessToken };
  }
}
