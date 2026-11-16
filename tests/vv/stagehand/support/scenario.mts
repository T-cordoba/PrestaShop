import { strict as assert } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { z } from 'zod';
import { writeJson } from './evidence.mjs';
import { act, extract, openSession, route, screenshot, waitFor, type Session } from './session.mjs';

export { assert, z, act, extract, route, screenshot, waitFor };
export type { Session };

export type Scenario = { id: string; name: string; run: (s: Session) => Promise<void> };

const RUN = Date.now().toString(36).slice(-4);
/** Unique suffix per run so data from previous runs never matches a filter. */
export const tag = (text: string) => `${text} ${RUN}`;

/** Runs the scenarios of one integrante in a single browser session, in order. */
export function defineSuite(spec: string, title: string, scenarios: Scenario[]) {
  describe(title, () => {
    let s: Session;
    const results: object[] = [];
    before(async () => {
      s = await openSession(spec);
    });
    after(async () => {
      writeJson(`results-${spec}.json`, results);
      await s?.close();
    });
    for (const sc of scenarios) {
      it(`${sc.id} ${sc.name}`, async () => {
        const started = Date.now();
        try {
          await sc.run(s);
          results.push({ id: sc.id, status: 'Pass', ms: Date.now() - started });
        } catch (error) {
          results.push({ id: sc.id, status: 'Fail', ms: Date.now() - started, error: String(error).slice(0, 300) });
          throw error;
        } finally {
          await screenshot(s, sc.id).catch(() => undefined);
        }
      });
    }
  });
}

export async function goto(s: Session, path: string) {
  await s.page.goto(route(s, path), { waitUntil: 'load' });
}

export const pathOf = async (s: Session) => new URL(await s.page.url()).pathname;

export const successFlash = (s: Session) =>
  waitFor('el mensaje de éxito', () => s.page.evaluate(() => [...document.querySelectorAll('.alert-success')].map((e) => (e as HTMLElement).innerText).find((t) => t.trim()) ?? null), 60_000);

export const VALIDATION = /is required|required at least|is invalid|must contain|cannot be longer|longer than|not valid|should be|This value|is not allowed|does not exist/i;

export async function rejected(s: Session, urlPart: string) {
  await new Promise((r) => setTimeout(r, 1500));
  assert.ok((await pathOf(s)).includes(urlPart), `debía quedarse en ${urlPart}`);
  const html5Invalid = await s.page.evaluate(() => document.querySelectorAll('input:invalid').length);
  const text = await s.page.evaluate(() => document.body.innerText);
  assert.ok(html5Invalid > 0 || VALIDATION.test(text), 'no se ve ningún error de validación');
}

export const gridRows = (s: Session, grid: string) =>
  s.page.evaluate((g) => [...document.querySelectorAll(`#${g}_grid_table tbody tr`)].map((tr) => (tr as HTMLElement).innerText.replace(/\s+/g, ' ').trim()), grid);
