import { Then, When, Given } from '@cucumber/cucumber';
import { Ensure, equals, includes, isGreaterThan, isTrue } from '@serenity-js/assertions';
import { Actor } from '@serenity-js/core';
import { Click } from '@serenity-js/web';

import { FilterTheList, NavigateInTheBackOffice, WaitForNotification } from '../../test/interactions/BackOfficeInteractions';
import { BackOfficeQuestions } from '../../test/questions/BackOfficeQuestions';
import { AddFeatureValue, CreateBrand, CreateCountry, CreateTax, CreateZone, SignInToTheBackOffice } from '../../test/tasks/BackOfficeTasks';
import { Grid } from '../../test/ui/BackOffice';

/** "#" in a name becomes a suffix unique to this run, so the scenarios can be repeated. */
const RUN = Date.now().toString(36).slice(-5);
const unique = (name: string) => name.replace('#', RUN);
// An ISO code is letters only and unique in the shop: "#" becomes two random letters (QXK-style codes are unassigned).
const uniqueIso = (iso: string) => iso.replace('#', () => String.fromCharCode(...[0, 0].map(() => 65 + Math.floor(Math.random() * 26))));

const LISTS: Record<string, { route: string; grid: string }> = {
  impuestos: { route: 'improve/international/taxes/', grid: 'tax' },
  zonas: { route: 'improve/international/zones/', grid: 'zone' },
  marcas: { route: 'sell/catalog/brands/', grid: 'manufacturer' },
  proveedores: { route: 'sell/catalog/suppliers/', grid: 'supplier' },
};

Given('que {actor} inició sesión en el back office', async (actor: Actor) => {
  await actor.attemptsTo(SignInToTheBackOffice());
});

When('{pronoun} crea el impuesto {string} con tasa {string}', async (actor: Actor, name: string, rate: string) => {
  await actor.attemptsTo(CreateTax.named(unique(name)).withRate(rate));
});

When('{pronoun} crea el impuesto inactivo {string} con tasa {string}', async (actor: Actor, name: string, rate: string) => {
  await actor.attemptsTo(CreateTax.named(unique(name)).withRate(rate, false));
});

When('{pronoun} crea la zona {string}', async (actor: Actor, name: string) => {
  await actor.attemptsTo(CreateZone.named(unique(name)));
});

When('{pronoun} crea la zona inactiva {string}', async (actor: Actor, name: string) => {
  await actor.attemptsTo(CreateZone.named(unique(name), false));
});

When('{pronoun} crea el país {string} con código ISO {string}', async (actor: Actor, name: string, iso: string) => {
  await actor.attemptsTo(CreateCountry.named(unique(name)).withIso(uniqueIso(iso)));
});

When('{pronoun} crea la marca {string}', async (actor: Actor, name: string) => {
  await actor.attemptsTo(CreateBrand.named(unique(name)));
});

When('{pronoun} crea la marca inactiva {string}', async (actor: Actor, name: string) => {
  await actor.attemptsTo(CreateBrand.named(unique(name), false));
});

When('{pronoun} agrega el valor {string} a la característica {string}', async (actor: Actor, value: string, feature: string) => {
  await actor.attemptsTo(AddFeatureValue.of(feature, unique(value)));
});

When('{pronoun} filtra el listado de {word} por {word} = {string}', async (actor: Actor, list: string, column: string, value: string) => {
  const { route, grid } = LISTS[list];
  await actor.attemptsTo(
    NavigateInTheBackOffice.to(route),
    FilterTheList.of(grid).byColumn(column, unique(value)),
  );
});

When('{pronoun} cambia el estado de la primera fila del listado de {word}', async (actor: Actor, list: string) => {
  await actor.attemptsTo(Click.on(Grid.firstRowSwitch(LISTS[list].grid)));
});

Then('{pronoun} ve la notificación {string}', async (actor: Actor, text: string) => {
  await actor.attemptsTo(WaitForNotification.containing(text));
});

Then('{pronoun} ve que el formulario fue rechazado', async (actor: Actor) => {
  await actor.attemptsTo(Ensure.that(BackOfficeQuestions.formWasRejected(), isTrue()));
});

Then('{pronoun} ve {int} fila(s) en el listado de {word}', async (actor: Actor, count: number, list: string) => {
  await actor.attemptsTo(Ensure.that(BackOfficeQuestions.rowCountOf(LISTS[list].grid), equals(count)));
});

Then('{pronoun} ve al menos una fila en el listado de {word}', async (actor: Actor, list: string) => {
  await actor.attemptsTo(Ensure.that(BackOfficeQuestions.rowCountOf(LISTS[list].grid), isGreaterThan(0)));
});

Then('{pronoun} ve que el listado de {word} incluye {string}', async (actor: Actor, list: string, text: string) => {
  const rows = await actor.answer(BackOfficeQuestions.rowsOf(LISTS[list].grid));
  await actor.attemptsTo(Ensure.that(rows.join(' | '), includes(unique(text))));
});
