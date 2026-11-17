import { Then, When } from '@cucumber/cucumber';
import { Ensure, equals, isGreaterThan } from '@serenity-js/assertions';
import { Actor } from '@serenity-js/core';
import { LastResponse } from '@serenity-js/rest';

import { BackOfficeQuestions } from '../../test/questions/BackOfficeQuestions';
import { UseTheAdminApi } from '../../test/tasks/ApiTasks';

When('{actor} consulta {string} en la Admin API', async (actor: Actor, path: string) => {
  await actor.attemptsTo(UseTheAdminApi.get(path));
});

When('{actor} elimina {string} con la Admin API', async (actor: Actor, path: string) => {
  await actor.attemptsTo(UseTheAdminApi.delete(path));
});

When('{actor} cambia el estado de {string} con la Admin API', async (actor: Actor, path: string) => {
  await actor.attemptsTo(UseTheAdminApi.put(path));
});

When('{actor} modifica {string} con la Admin API:', async (actor: Actor, path: string, body: string) => {
  await actor.attemptsTo(UseTheAdminApi.patch(path, JSON.parse(body)));
});

When('{actor} crea {string} con la Admin API:', async (actor: Actor, path: string, body: string) => {
  await actor.attemptsTo(UseTheAdminApi.post(path, JSON.parse(body)));
});

Then('{pronoun} recibe el código {int}', async (actor: Actor, status: number) => {
  await actor.attemptsTo(Ensure.that(BackOfficeQuestions.lastResponseStatus(), equals(status)));
});

Then('{pronoun} recibe una lista con al menos un elemento', async (actor: Actor) => {
  await actor.attemptsTo(Ensure.that(LastResponse.body<{ items: unknown[] }>().items.length, isGreaterThan(0)));
});

