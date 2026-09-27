import { existsSync } from 'fs';

export interface AppConfig {
  appPassword: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  dataDir: string;
  port: number;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var ${name} (see .env.example)`);
  }
  return value;
}

export function loadConfig(): AppConfig {
  // Fail fast on boot when secrets are not configured.
  const appPassword = required('APP_PASSWORD');
  const jwtSecret = required('JWT_SECRET');
  const port = Number(process.env['PORT'] ?? 3000);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('PORT must be a positive integer');
  }
  const dataDir = process.env['DATA_DIR'] ?? './data';
  if (existsSync(dataDir) === false) {
    // Created later by SeedService; just validate it is a non-empty string.
  }
  return {
    appPassword,
    jwtSecret,
    jwtExpiresIn: process.env['JWT_EXPIRES_IN'] ?? '365d',
    dataDir,
    port,
  };
}

export const APP_CONFIG = 'APP_CONFIG';
