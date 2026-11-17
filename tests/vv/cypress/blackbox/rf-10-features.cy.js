import { api, loginStep, save, shot, str, successMessage } from './helpers';

const LIST = 'sell/catalog/features/';
const NEW_VALUE = 'sell/catalog/features/new-value';
const COMPOSITION = 1;

const fillValue = (value, feature = 'Composition') => {
  cy.get('#feature_value_feature_id').select(feature, { force: true });
  cy.get('#feature_value_value_1').clear();
  if (value) cy.get('#feature_value_value_1').type(value, { delay: 0, parseSpecialCharSequences: false });
};

describe('RF-10 Agregar valor a característica (Tomás)', () => {
  it('CP-10-01 agregar valor válido', () => {
    const cp = 'CP-10-01';
    loginStep(cp, LIST);
    cy.visitBO(NEW_VALUE);
    fillValue('VV-10-CP01 Algodón');
    shot(cp, 2);
    save();
    successMessage('Successful creation');
    cy.visitBO(`sell/catalog/features/${COMPOSITION}/values`);
    cy.get('table tbody').should('contain', 'VV-10-CP01 Algodón');
    shot(cp, 3);
  });

  it('CP-10-02 valor de 255 caracteres', () => {
    const cp = 'CP-10-02';
    loginStep(cp, LIST);
    cy.visitBO(NEW_VALUE);
    fillValue(str('VV-10-CP02', 255));
    save();
    successMessage('Successful creation');
    shot(cp, 2);
  });

  it('CP-10-03 desde la página de la característica', () => {
    const cp = 'CP-10-03';
    loginStep(cp, LIST);
    cy.visitBO(`sell/catalog/features/${COMPOSITION}/values`);
    shot(cp, 2);
    cy.get('a[href*="new-value"]').filter(':visible').first().click();
    cy.get('#feature_value_feature_id').find('option:selected').should('contain', 'Composition');
    cy.get('#feature_value_value_1').type('VV-10-CP03 Lino', { delay: 0 });
    save();
    successMessage('Successful creation');
    shot(cp, 3);
  });

  it('CP-10-04 valor inválido', () => {
    const cp = 'CP-10-04';
    const accepted = [];
    loginStep(cp, LIST);
    [['', 2], ['Lana<b>', 3], [str('VV-10-CP04', 256), 4]].forEach(([value, n]) => {
      cy.visitBO(NEW_VALUE);
      fillValue(value);
      save();
      shot(cp, n);
      cy.location('pathname').then((p) => {
        if (!p.includes('/new-value')) accepted.push(value.slice(0, 12) || '(vacío)');
      });
    });
    cy.then(() => expect(accepted, 'valores aceptados que debían rechazarse').to.be.empty);
  });

  it('CP-10-05 característica inexistente vía API', () => {
    const cp = 'CP-10-05';
    cy.apiToken('TOMAS').should('be.a', 'string');
    api('TOMAS', 'POST', '/features/values', { featureId: 999999, values: { 'en-US': 'VV-10-CP05' } }).then((r) => {
      // The evidence is written before asserting: a failing expect would otherwise abort the queued writeFile.
      cy.writeFile(`cypress/screenshots/api/${cp}.json`, { request: 'POST /admin-api/features/values {featureId: 999999}', status: r.status, body: r.body })
        .then(() => expect(r.status, 'código HTTP para característica inexistente').to.be.oneOf([404, 422]));
    });
  });
});
