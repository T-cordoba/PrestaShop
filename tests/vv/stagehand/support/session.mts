import { Stagehand, localBrowser, type Page } from '@browserbasehq/stagehand';
import type { z } from 'zod';
import { ADMIN } from './env.mjs';
import { appendJsonl } from './evidence.mjs';
import { createOllamaClient } from './ollama-client.mjs';
import { runPath } from './env.mjs';

export type Session = { stagehand: Stagehand; page: Page; close: () => Promise<void>; token: string };

/**
 * Opens a local Chrome driven by Stagehand with the local Ollama model, and signs in to the BO deterministically
 * (the login is set-up, not a scenario). The AI is used for the scenario steps only.
 */
export async function openSession(spec: string): Promise<Session> {
  const browser = await localBrowser.launch({ headless: process.env.HEADLESS !== 'false', viewport: { width: 1440, height: 1000 } });
  const stagehand = await Stagehand.create({
    browser,
    model: createOllamaClient(),
    logging: { level: 'info', format: 'json', onLog: (entry) => appendJsonl(`stagehand-${spec}.log.jsonl`, entry) },
  });
  const [page] = await browser.context.pages();
  if (!page) throw new Error('Stagehand no abrió ninguna pestaña.');

  await page.goto(`${ADMIN}/`);
  await waitFor('el formulario de login', () => page.evaluate(() => !!document.querySelector('input[name="passwd"]')));
  await page.evaluate(
    ([email, password]) => {
      const pass = document.querySelector<HTMLInputElement>('input[name="passwd"]')!;
      const form = pass.form!;
      form.querySelector<HTMLInputElement>('input[name="email"]')!.value = email;
      pass.value = password;
      form.querySelector<HTMLButtonElement>('[name="submit_login"]')!.click();
    },
    [process.env.BO_EMAIL!, process.env.BO_PASSWORD!],
  );
  const token = await waitFor('el token del BO tras el login', () =>
    page.evaluate(() => {
      const a = document.querySelector<HTMLAnchorElement>('a[href*="_token="]');
      return a ? new URL(a.href).searchParams.get('_token') : null;
    }));
  return { stagehand, page, token, close: () => browser.close() };
}

/** Polls `read` until it returns a truthy value (Stagehand pages have no auto-waiting assertions). */
export async function waitFor<T>(what: string, read: () => Promise<T | null | undefined>, timeoutMs = 120_000): Promise<T> {
  const until = Date.now() + timeoutMs;
  for (;;) {
    try {
      const value = await read();
      if (value) return value;
    } catch {
      // page navigating: retry
    }
    if (Date.now() > until) throw new Error(`Tiempo agotado esperando ${what}`);
    await new Promise((r) => setTimeout(r, 500));
  }
}

export const route = (s: Session, path: string) => `${ADMIN}/index.php/${path}${path.includes('?') ? '&' : '?'}_token=${s.token}`;

/** One AI action; a reported failure throws so the scenario never continues on a wrong page. */
export async function act(s: Session, instruction: string, variables?: Record<string, string>) {
  const result = await s.stagehand.act(instruction, { page: s.page, ...(variables ? { variables } : {}) });
  appendJsonl('ai-calls.jsonl', { kind: 'act', instruction, success: result.data.success, message: result.data.message });
  if (!result.data.success) throw new Error(`act no pudo «${instruction}»: ${result.data.message}`);
}

/** Structured read validated by zod; the assertion that follows is deterministic. */
export async function extract<S extends z.ZodType>(s: Session, instruction: string, schema: S): Promise<z.output<S>> {
  const result = await s.stagehand.extract(instruction, schema, { page: s.page });
  appendJsonl('ai-calls.jsonl', { kind: 'extract', instruction, data: result.data });
  return result.data as z.output<S>;
}

export async function screenshot(s: Session, id: string) {
  await s.page.screenshot({ path: runPath(`${id}.png`) });
}
