import { Given, When, Then, Before } from '@badeball/cypress-cucumber-preprocessor';

// Selectors by field id (never by visible text: labels change, ids are the form contract).
const FORMS = {
  impuesto: { route: 'improve/international/taxes/new', list: 'improve/international/taxes/', grid: 'tax' },
  zona: { route: 'improve/international/zones/new', list: 'improve/international/zones/', grid: 'zone' },
  'país': { route: 'improve/international/countries/new', list: 'improve/international/countries/', grid: 'country' },
  marca: { route: 'sell/catalog/brands/new', list: 'sell/catalog/brands/', grid: 'manufacturer' },
  proveedor: { list: 'sell/catalog/suppliers/', grid: 'supplier' },
  'valor de característica': { route: 'sell/catalog/features/new-value', list: 'sell/catalog/features/', grid: 'feature' },
};

const FIELDS = {
  nombre: { impuesto: '#tax_name_1', zona: '#zone_name', 'país': '#country_name_1', marca: '#manufacturer_name' },
  tasa: { impuesto: '#tax_rate' },
  'código ISO': { 'país': '#country_iso_code' },
  prefijo: { 'país': '#country_call_prefix' },
  'formato postal': { 'país': '#country_zip_code_format' },
  valor: { 'valor de característica': '#feature_value_value_1' },
};

const VALIDATION = /is required|required at least|is invalid|must contain|cannot be longer|longer than|not valid|should be|This value|is not allowed/i;

let form;

Before(() => {
  form = undefined;
});

// The ISO code is unique: remove the countries a previous run created so the scenarios stay repeatable.
Before({ tags: '@rf-05' }, () => {
  cy.task('sql', "DELETE c, cl, cs, af FROM ps_country c LEFT JOIN ps_country_lang cl ON cl.id_country = c.id_country "
    + "LEFT JOIN ps_country_shop cs ON cs.id_country = c.id_country LEFT JOIN ps_address_format af ON af.id_country = c.id_country "
    + "WHERE c.iso_code IN ('QB', 'QBZ')");
});

Given('que la administradora inició sesión en el back office', () => {
  cy.loginBO();
});

When('abre el formulario de {string}', (name) => {
  form = name;
  cy.visitBO(FORMS[name].route);
});

When('abre el listado de {string}', (name) => {
  form = name;
  cy.visitBO(FORMS[name].list);
});

When('escribe {string} en el campo {string}', (value, field) => {
  const selector = FIELDS[field][form];
  cy.get(selector).clear();
  if (value !== '') cy.get(selector).type(value, { delay: 0, parseSpecialCharSequences: false });
});

When('escribe un texto de {int} caracteres en el campo {string}', (length, field) => {
  const value = `VV-BDD ${'abcdefghijklmnopqrstuvwxyz'.repeat(20)}`.slice(0, length);
  cy.get(FIELDS[field][form]).clear().type(value, { delay: 0 });
});

When('elige {string} en la zona', (zone) => {
  cy.get('#country_zone').select(zone);
});

When('exige código postal', () => {
  cy.get('#country_need_zip_code_1').check({ force: true });
});

When('elige la característica {string}', (feature) => {
  cy.get('#feature_value_feature_id').select(feature, { force: true });
});

When('marca el estado como {string}', (estado) => {
  const prefix = { impuesto: 'tax_is_enabled', zona: 'zone_enabled', marca: 'manufacturer_is_enabled' }[form];
  cy.get(`#${prefix}_${estado === 'activo' ? 1 : 0}`).check({ force: true });
});

When('guarda el formulario', () => {
  cy.get('#save-button, form[name="manufacturer"] button.btn-primary').filter(':visible').last().click();
});

When('filtra la columna {string} por {string}', (column, value) => {
  const grid = FORMS[form].grid;
  cy.get(`#${grid}_grid_table thead input[type="text"]`).each(($i) => cy.wrap($i).clear({ force: true }));
  cy.get(`#${grid}_grid_table thead select`).each(($s) => cy.wrap($s).select(0, { force: true }));
  cy.get(`#${grid}_${column}`).clear().type(value, { delay: 0, parseSpecialCharSequences: false });
  cy.get(`button[name="${grid}[actions][search]"]`).first().click();
});

When('cambia el estado de la primera fila', () => {
  cy.get('table tbody tr').first().find('.ps-switch').click();
});

Then('ve el mensaje {string}', (text) => {
  cy.get('.alert-success', { timeout: 60000 }).should('contain', text);
});

Then('el formulario se rechaza con un error de validación', () => {
  cy.location('pathname').should('match', /\/new|\/edit|new-value/);
  cy.get('.alert-success:visible').should('not.exist');
  cy.contains(VALIDATION).should('exist');
});

Then('el listado muestra {int} fila(s)', (count) => {
  cy.get(`#${FORMS[form].grid}_grid_table tbody tr`).should('have.length', count);
});

Then('el listado no tiene resultados', () => {
  cy.get(`#${FORMS[form].grid}_grid_table tbody`).should('contain', 'No records found');
});

Then('la primera fila contiene {string}', (text) => {
  cy.get(`#${FORMS[form].grid}_grid_table tbody tr`).first().should('contain', text);
});

// --- Admin API -----------------------------------------------------------------------------------
let response;

Given('existe una marca {string} creada por la API', (name) => {
  cy.api('TOMAS', 'POST', '/manufacturers', { name, enabled: true, shopIds: [1], shortDescriptions: { 'en-US': '' }, descriptions: { 'en-US': '' }, metaTitles: { 'en-US': '' }, metaDescriptions: { 'en-US': '' }, metaKeywords: { 'en-US': '' } }).its('status').should('eq', 201);
});

Given('existe un proveedor {string} creado por la API', (name) => {
  cy.api('TOMAS', 'POST', '/suppliers', { name, address: 'Calle 1', city: 'Medellin', countryId: 8, enabled: true, shopIds: [1], descriptions: { 'en-US': 'VV' }, metaTitles: { 'en-US': 'VV' }, metaDescriptions: { 'en-US': 'VV' } }).its('status').should('eq', 201);
});

Given('existe una zona {string} creada por la API', (name) => {
  cy.api('JULIANA', 'POST', '/zones', { name, enabled: true, shopIds: [1] }).its('status').should('eq', 201);
});

let createdTaxId;

Given('existe un impuesto {string} creado por la API', (name) => {
  cy.api('JULIANA', 'POST', '/taxes', { names: { 'en-US': name, 'fr-FR': name }, rate: '19', enabled: true }).then((r) => {
    expect(r.status).to.eq(201);
    createdTaxId = r.body.taxId;
  });
});

When('la integración de {string} modifica el impuesto creado con el cuerpo:', (who, body) => {
  cy.api(who.toUpperCase(), 'PATCH', `/taxes/${createdTaxId}`, JSON.parse(body)).then((r) => {
    response = r;
  });
});

When('la integración de {string} envía {word} a {string}', (who, method, url) => {
  cy.api(who.toUpperCase(), method, url).then((r) => {
    response = r;
  });
});

When('la integración de {string} envía {word} a {string} con el cuerpo:', (who, method, url, body) => {
  cy.api(who.toUpperCase(), method, url, JSON.parse(body)).then((r) => {
    response = r;
  });
});

Then('la respuesta tiene el código {int}', (status) => {
  expect(response.status).to.eq(status);
});
