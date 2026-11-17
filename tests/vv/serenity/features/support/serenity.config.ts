import { AfterAll, BeforeAll, setDefaultTimeout } from '@cucumber/cucumber';
import { Cast, configure } from '@serenity-js/core';
import { BrowseTheWebWithPlaywright } from '@serenity-js/playwright';
import { CallAnApi } from '@serenity-js/rest';
import axios from 'axios';
import { readFileSync } from 'node:fs';
import https from 'node:https';
import { join } from 'node:path';
import { Browser, chromium } from 'playwright';

// tests/vv/.env holds the local credentials (never versioned).
export const env: Record<string, string> = Object.fromEntries(
  readFileSync(join(__dirname, '../../../.env'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.includes('='))
    .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]),
);

export const BASE_URL = env.BASE_URL ?? 'http://localhost:8001';
const API_URL = `${env.API_URL ?? 'https://localhost:8002'}/admin-api`;
// Request paths are resolved like URLs: with a trailing slash here and none on the path, /admin-api is kept.
const API_BASE = `${API_URL}/`;
// The local Admin API uses a self-signed certificate.
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

let browser: Browser;
const apiTokens: Record<string, string> = {};

/** Each actor is an integrante: Juliana and Tomás call the Admin API with their own OAuth client and scopes. */
const API_CLIENT: Record<string, string> = { Juliana: 'JULIANA', Tomás: 'TOMAS' };

async function tokenFor(client: string): Promise<string> {
  const response = await axios.post(
    `${API_URL}/access_token`,
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env[`API_${client}_ID`],
      client_secret: env[`API_${client}_SECRET`],
      scope: env[`API_${client}_SCOPES`],
    }),
    { httpsAgent },
  );
  return response.data.access_token;
}

setDefaultTimeout(120_000);

BeforeAll(async () => {
  for (const client of Object.values(API_CLIENT)) apiTokens[client] = await tokenFor(client);
  browser = await chromium.launch({ headless: process.env.HEADLESS !== 'false' });

  configure({
    actors: Cast.where((actor) => {
      const client = API_CLIENT[actor.name];
      return actor.whoCan(
        BrowseTheWebWithPlaywright.using(browser, {}, { defaultNavigationTimeout: 120_000, defaultTimeout: 30_000 }),
        CallAnApi.using(axios.create({
          baseURL: API_BASE,
          httpsAgent,
          headers: client ? { Authorization: `Bearer ${apiTokens[client]}` } : {},
          validateStatus: () => true,
        })),
      );
    }),
    crew: [
      '@serenity-js/console-reporter',
      ['@serenity-js/html-reporter', { specDirectory: './features' }],
    ],
  });
});

AfterAll(async () => {
  await browser?.close();
});
