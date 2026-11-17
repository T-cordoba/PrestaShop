import { Question } from '@serenity-js/core';
import { LastResponse } from '@serenity-js/rest';
import { Text } from '@serenity-js/web';

import { nativePage } from '../interactions/BackOfficeInteractions';
import { Grid } from '../ui/BackOffice';

const VALIDATION = /is required|required at least|is invalid|must contain|cannot be longer|longer than|not valid|should be|This value|is not allowed/i;

export const BackOfficeQuestions = {
  /** Rows of a BO grid, as text ("No records found" counts as zero rows). */
  rowsOf: (grid: string) => Text.ofAll(Grid.rows(grid)).describedAs(`las filas del listado ${grid}`),

  rowCountOf: (grid: string) => Question.about<number>(`el número de filas del listado ${grid}`, async (actor) => {
    const rows = await actor.answer(Text.ofAll(Grid.rows(grid)));
    return rows.filter((row) => !/No records found/i.test(row)).length;
  }),

  /** True when the form was rejected: HTML5 validation blocked the submit or the BO shows a validation message. */
  formWasRejected: () => Question.about<boolean>('si el formulario fue rechazado', async (actor) => {
    const page = await nativePage(actor);
    await page.waitForLoadState('load');
    const blockedByBrowser = await page.locator('input:invalid, select:invalid, textarea:invalid').count();
    const successShown = await page.locator('.alert-success:visible').count();
    const text = await page.locator('body').innerText();
    return successShown === 0 && (blockedByBrowser > 0 || VALIDATION.test(text));
  }),

  lastResponseStatus: () => LastResponse.status().describedAs('el código HTTP de la última respuesta'),
};
