import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Credentials come from tests/vv/.env (local only, never versioned).
const envFile = join(ROOT, '..', '.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const i = line.indexOf('=');
    if (i > 0 && !(line.slice(0, i) in process.env)) process.env[line.slice(0, i)] = line.slice(i + 1);
  }
}

export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8001';
export const ADMIN = `${BASE_URL}/${process.env.ADMIN_PATH ?? 'admin-dev'}`;

/** Stagehand only runs against the local shop: it types and clicks on its own. */
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE_URL)) {
  throw new Error(`Stagehand se niega a correr fuera de localhost (BASE_URL=${BASE_URL}).`);
}

export function ollamaSettings() {
  return {
    baseUrl: (process.env.OLLAMA_BASE_URL?.trim() || 'http://localhost:11434/v1').replace(/\/$/, ''),
    apiKey: 'ollama',
    model: process.env.OLLAMA_MODEL?.trim() || 'qwen2.5:latest',
  };
}

export function secrets(): string[] {
  return [process.env.BO_PASSWORD, process.env.API_JULIANA_SECRET, process.env.API_TOMAS_SECRET].filter((s): s is string => !!s);
}

const RUN_DIR = join(ROOT, 'reports', new Date().toISOString().replace(/[:.]/g, '-'));
export function runPath(file: string): string {
  mkdirSync(RUN_DIR, { recursive: true });
  return join(RUN_DIR, file);
}
