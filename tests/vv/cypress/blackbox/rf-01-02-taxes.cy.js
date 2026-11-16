import { filterGrid, formRejected, loginStep, save, shot, str, successMessage, api } from './helpers';

const LIST = 'improve/international/taxes/';
const NEW = 'improve/international/taxes/new';

const fillTax = (name, rate, enabled = true) => {
  cy.get('#tax_name_1').clear();
  if (name !== '') cy.get('#tax_name_1').type(name, { delay: 0 });
  cy.get('#tax_rate').clear();
  if (rate !== '') cy.get('#tax_rate').type(String(rate), { delay: 0 });
  cy.get(enabled ? '#tax_is_enabled_1' : '#tax_is_enabled_0').check({ force: true });
};

describe('RF-01 Crear impuesto (Juliana)', () => {
  it('CP-01-01 crear impuesto válido', () => {
    const cp = 'CP-01-01';
    loginStep(cp, LIST);
    cy.visitBO(NEW);
    shot(cp, 2);
    fillTax('VV-01-CP01 IVA', 19);
    save();
    successMessage('Successful creation');
    filterGrid('tax', 'name', 'VV-01-CP01');
    cy.get('table tbody tr').first().should('contain', '19');
    shot(cp, 3);
  });

  it('CP-01-02 nombre de 32 caracteres, tasa 0, inactivo', () => {
    const cp = 'CP-01-02';
    loginStep(cp, LIST);
    cy.visitBO(NEW);
    shot(cp, 2);
    fillTax(str('VV-01-CP02', 32), 0, false);
    save();
    successMessage('Successful creation');
    filterGrid('tax', 'name', 'VV-01-CP02');
    cy.get('table tbody tr').first().should('contain', str('VV-01-CP02', 32));
    shot(cp, 3);
  });

  it('CP-01-03 tasa con 6 caracteres', () => {
    const cp = 'CP-01-03';
    loginStep(cp, LIST);
    cy.visitBO(NEW);
    shot(cp, 2);
    fillTax('VV-01-CP03 Tres dec', '13.925');
    save();
    successMessage('Successful creation');
    filterGrid('tax', 'name', 'VV-01-CP03');
    cy.get('table tbody tr').first().should('contain', '13.925');
    shot(cp, 3);
  });

  it('CP-01-04 nombre inválido', () => {
    const cp = 'CP-01-04';
    loginStep(cp, LIST);
    cy.visitBO(NEW);
    fillTax('', 10);
    save();
    formRejected('/taxes/new');
    shot(cp, 2);
    fillTax('IVA<19>', 10);
    save();
    formRejected('/taxes/new');
    shot(cp, 3);
    fillTax(str('VV-01-CP04', 33), 10);
    save();
    formRejected('/taxes/new');
    shot(cp, 4);
  });

  it('CP-01-05 tasa inválida', () => {
    const cp = 'CP-01-05';
    const accepted = [];
    loginStep(cp, LIST);
    [['abc', 2], ['13.9255', 3], ['-5', 4], ['-0.01', 5]].forEach(([rate, n]) => {
      cy.visitBO(NEW);
      fillTax(`VV-01-CP05 ${rate}`, rate);
      save();
      shot(cp, n);
      cy.location('pathname').then((p) => {
        if (!p.includes('/taxes/new')) accepted.push(rate);
      });
    });
    cy.then(() => expect(accepted, 'tasas aceptadas que debían rechazarse').to.be.empty);
  });
});

describe('RF-02 Editar impuesto (Juliana)', () => {
  let taxId;

  before(() => {
    api('JULIANA', 'POST', '/taxes', { names: { 'en-US': 'VV-02 Base', 'fr-FR': 'VV-02 Base' }, rate: '19', enabled: true }).then((r) => {
      expect(r.status).to.eq(201);
      taxId = r.body.taxId;
    });
  });

  it('CP-02-01 cambiar la tasa', () => {
    const cp = 'CP-02-01';
    loginStep(cp, LIST);
    cy.visitBO(`improve/international/taxes/${taxId}/edit`);
    cy.get('#tax_rate').should('have.value', '19');
    shot(cp, 2);
    cy.get('#tax_rate').clear().type('21');
    save();
    successMessage('Successful update');
    filterGrid('tax', 'name', 'VV-02 Base');
    cy.get('table tbody tr').first().should('contain', '21');
    shot(cp, 3);
  });

  it('CP-02-02 cambiar estado desde la lista', () => {
    const cp = 'CP-02-02';
    loginStep(cp, LIST);
    filterGrid('tax', 'name', 'VV-02 Base');
    cy.get('table tbody tr').first().find('.ps-switch').click();
    successMessage('successfully updated');
    cy.get('table tbody tr').first().find('input[id^="input-false"]').should('be.checked');
    shot(cp, 2);
    cy.get('table tbody tr').first().find('.ps-switch').click();
    successMessage('successfully updated');
    cy.get('table tbody tr').first().find('input[id^="input-true"]').should('be.checked');
    shot(cp, 3);
  });

  it('CP-02-03 nombre de 32 caracteres', () => {
    const cp = 'CP-02-03';
    loginStep(cp, LIST);
    cy.visitBO(`improve/international/taxes/${taxId}/edit`);
    cy.get('#tax_name_1').clear().type(str('VV-02 Base', 32), { delay: 0 });
    save();
    successMessage('Successful update');
    shot(cp, 2);
    cy.visitBO(`improve/international/taxes/${taxId}/edit`);
    cy.get('#tax_name_1').clear().type('VV-02 Base', { delay: 0 });
    save();
  });

  it('CP-02-04 impuesto inexistente', () => {
    const cp = 'CP-02-04';
    loginStep(cp, LIST);
    cy.visitBO('improve/international/taxes/999999/edit');
    shot(cp, 2);
    cy.get('body').should('not.contain', 'Whoops').and('not.contain', 'Internal Server Error');
    cy.get('.alert-danger').should('exist');
  });

  it('CP-02-05 datos editados inválidos', () => {
    const cp = 'CP-02-05';
    loginStep(cp, LIST);
    cy.visitBO(`improve/international/taxes/${taxId}/edit`);
    cy.get('#tax_rate').clear().type('abc');
    save();
    formRejected('/edit');
    shot(cp, 2);
    cy.visitBO(`improve/international/taxes/${taxId}/edit`);
    cy.get('#tax_name_1').clear();
    save();
    formRejected('/edit');
    shot(cp, 3);
    cy.visitBO(LIST);
    filterGrid('tax', 'name', 'VV-02 Base');
    cy.get('table tbody tr').first().should('contain', '21');
    shot(cp, 4);
  });
});
