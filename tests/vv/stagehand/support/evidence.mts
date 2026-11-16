import { appendFileSync, writeFileSync } from 'node:fs';
import { runPath, secrets } from './env.mjs';

const JWT = /eyJ[\w-]+\.[\w-]+\.[\w-]+/g;

/** Masks the password, API secrets and anything shaped like a token. */
export function redact(text: string): string {
  let safe = text.replace(JWT, '<jwt>');
  for (const secret of secrets()) safe = safe.split(secret).join('<secreto>');
  return safe;
}

export function appendJsonl(file: string, entry: object): void {
  appendFileSync(runPath(file), `${redact(JSON.stringify(entry))}\n`);
}

export function writeJson(file: string, value: unknown): void {
  writeFileSync(runPath(file), `${redact(JSON.stringify(value, null, 2))}\n`);
}
