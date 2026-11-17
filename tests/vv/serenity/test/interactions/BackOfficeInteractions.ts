import { Answerable, d, Interaction, the, UsesAbilities } from '@serenity-js/core';
import { BrowseTheWebWithPlaywright, PlaywrightPage } from '@serenity-js/playwright';

import { BASE_URL } from '../../features/support/serenity.config';

const ADMIN = `${BASE_URL}/admin-dev`;

export async function nativePage(actor: UsesAbilities) {
  const page = (await BrowseTheWebWithPlaywright.as(actor).currentPage()) as PlaywrightPage;
  return page.nativePage();
}

/**
 * Own interaction: open a Symfony BO route. The BO only accepts these URLs with the employee CSRF token, so it is read
 * from a tokenized link of the current page first.
 */
export const NavigateInTheBackOffice = {
  to: (route: string) => Interaction.where(d`#actor abre ${route} del back office`, async (actor) => {
    const page = await nativePage(actor);
    await page.waitForLoadState('load');
    const token = new URL(page.url()).searchParams.get('_token') ?? await page.evaluate(() => {
      const link = document.querySelector<HTMLAnchorElement>('a[href*="_token="]');
      return link ? new URL(link.href).searchParams.get('_token') : null;
    });
    if (!token) throw new Error('No hay sesión del BO: no se encontró el token en la página actual');
    await page.goto(`${ADMIN}/index.php/${route}${route.includes('?') ? '&' : '?'}_token=${token}`, { waitUntil: 'load' });
  }),
};

/**
 * Own interaction: filter a BO grid by one column. Grid filters are stored per employee, so every other filter of the
 * grid is cleared first; otherwise a previous scenario could narrow this search.
 */
export const FilterTheList = {
  of: (grid: string) => ({
    byColumn: (column: string, value: Answerable<string>) =>
      Interaction.where(the`#actor filtra el listado ${grid} por ${column} = ${value}`, async (actor) => {
        const text = await actor.answer(value);
        const page = await nativePage(actor);
        const header = page.locator(`#${grid}_grid_table thead`);
        for (const input of await header.locator('input[type="text"]').all()) await input.fill('');
        for (const select of await header.locator('select').all()) await select.selectOption({ index: 0 });
        await page.locator(`#${grid}_${column}`).fill(text);
        await Promise.all([page.waitForLoadState('load'), page.locator(`button[name="${grid}[actions][search]"]`).first().click()]);
        await page.waitForLoadState('load');
      }),
  }),
};

/** Own interaction: wait until the BO shows a success notification (they appear after a redirect). */
export const WaitForNotification = {
  containing: (text: string) => Interaction.where(d`#actor espera la notificación "${text}"`, async (actor) => {
    const page = await nativePage(actor);
    await page.locator('.alert-success:visible', { hasText: text }).first().waitFor({ timeout: 60_000 });
  }),
};

/** Own interaction: set a BO on/off switch. Its radios are hidden behind the ps-switch widget, so they are checked directly. */
export const SetTheSwitch = {
  named: (prefix: string) => ({
    to: (enabled: boolean) => Interaction.where(d`#actor deja ${prefix} en ${enabled ? 'activo' : 'inactivo'}`, async (actor) => {
      const page = await nativePage(actor);
      await page.locator(`#${prefix}_${enabled ? 1 : 0}`).check({ force: true });
    }),
  }),
};
