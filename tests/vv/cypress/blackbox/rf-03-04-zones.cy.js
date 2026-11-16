import { api, deleteFirstRow, filterGrid, formRejected, loginStep, save, shot, str, successMessage } from './helpers';

const LIST = 'improve/international/zones/';
const NEW = 'improve/international/zones/new';

const fillZone = (name, enabled = true) => {
  cy.get('#zone_name').clear();
  if (name !== '') cy.get('#zone_name').type(name, { delay: 0, parseSpecialCharSequences: false });
  cy.get(enabled ? '#zone_enabled_1' : '#zone_enabled_0').check({ force: true });
};

const newZoneApi = (name) => api('JULIANA', 'POST', '/zones', { name, enabled: true, shopIds: [1] }).then((r) => {
  expect(r.status, `crear zona ${name}`).to.eq(201);
  return r.body.zoneId;
});

describe('RF-03 Crear zona (Juliana)', () => {
  it('CP-03-01 crear zona activa', () => {
    const cp = 'CP-03-01';
    loginStep(cp, LIST);
    cy.visitBO(NEW);
    shot(cp, 2);
    fillZone('VV-03-CP01 Andina');
    save();
    successMessage('Successful creation');
    filterGrid('zone', 'name', 'VV-03-CP01');
    cy.get('table tbody tr').first().should('contain', 'VV-03-CP01 Andina');
    shot(cp, 3);
  });

  it('CP-03-02 zona inactiva con nombre de 64', () => {
    const cp = 'CP-03-02';
    loginStep(cp, LIST);
    cy.visitBO(NEW);
    fillZone(str('VV-03-CP02', 64), false);
    save();
    successMessage('Successful creation');
    filterGrid('zone', 'name', 'VV-03-CP02');
    cy.get('table tbody tr').first().should('contain', str('VV-03-CP02', 64)).find('input[id^="input-false"]').should('be.checked');
    shot(cp, 2);
  });

  it('CP-03-03 nombre repetido', () => {
    const cp = 'CP-03-03';
    loginStep(cp, LIST);
    cy.visitBO(NEW);
    fillZone('Europe');
    save();
    successMessage('Successful creation');
    shot(cp, 2);
  });

  it('CP-03-04 nombre vacío', () => {
    const cp = 'CP-03-04';
    loginStep(cp, LIST);
    cy.visitBO(NEW);
    fillZone('');
    save();
    shot(cp, 2);
    formRejected('/zones/new');
  });

  it('CP-03-05 nombre con script o demasiado largo', () => {
    const cp = 'CP-03-05';
    const accepted = [];
    loginStep(cp, LIST);
    [['<script>alert(1)</script>', 2], [str('VV-03-CP05', 65), 3]].forEach(([name, n]) => {
      cy.visitBO(NEW);
      fillZone(name);
      save();
      shot(cp, n);
      cy.location('pathname').then((p) => {
        if (!p.includes('/zones/new')) accepted.push(name.slice(0, 20));
      });
    });
    cy.then(() => expect(accepted, 'nombres aceptados que debían rechazarse').to.be.empty);
  });
});

describe('RF-04 Eliminar zona (Juliana)', () => {
  it('CP-04-01 eliminar zona sin uso', () => {
    const cp = 'CP-04-01';
    newZoneApi('VV-04 Temporal');
    loginStep(cp, LIST);
    filterGrid('zone', 'name', 'VV-04 Temporal');
    cy.get('table tbody tr').should('have.length', 1);
    shot(cp, 2);
    deleteFirstRow(true);
    successMessage('Successful deletion');
    filterGrid('zone', 'name', 'VV-04 Temporal');
    cy.get('table tbody').should('contain', 'No records found');
    shot(cp, 3);
  });

  it('CP-04-02 cancelar el borrado', () => {
    const cp = 'CP-04-02';
    newZoneApi('VV-04 Cancelar');
    loginStep(cp, LIST);
    filterGrid('zone', 'name', 'VV-04 Cancelar');
    deleteFirstRow(false);
    cy.get('table tbody tr').first().should('contain', 'VV-04 Cancelar');
    shot(cp, 2);
  });

  it('CP-04-03 borrado masivo', () => {
    const cp = 'CP-04-03';
    newZoneApi('VV-04 Masivo A');
    newZoneApi('VV-04 Masivo B');
    loginStep(cp, LIST);
    filterGrid('zone', 'name', 'VV-04 Masivo');
    cy.get('.js-bulk-actions-btn').should('be.disabled');
    shot(cp, 2);
    cy.get('input[name="zone_bulk[]"]').check({ force: true });
    cy.get('.js-bulk-actions-btn').click();
    cy.get('#zone_grid_bulk_action_delete_selection').click();
    cy.get('.modal.show .btn-confirm-submit').click();
    successMessage('deleted');
    filterGrid('zone', 'name', 'VV-04 Masivo');
    cy.get('table tbody').should('contain', 'No records found');
    shot(cp, 3);
  });

  it('CP-04-04 zona con países asignados', () => {
    const cp = 'CP-04-04';
    newZoneApi('VV-04 Con pais').then((zoneId) => {
      api('JULIANA', 'POST', '/countries', {
        names: { 'en-US': 'VV-04 Pais', 'fr-FR': 'VV-04 Pais' }, isoCode: 'XV', callPrefix: 99, defaultCurrencyId: 0, zoneId,
        needZipCode: false, zipCodeFormat: '', addressFormat: 'firstname lastname\naddress1\ncity\nCountry:name', enabled: true,
        containsStates: false, needIdNumber: false, displayTaxLabel: true, shopIds: [1],
      }).then((r) => {
        expect(r.status, 'crear país VV-04').to.eq(201);
        cy.wrap(r.body.countryId).as('countryId');
      });
    });
    loginStep(cp, LIST);
    filterGrid('zone', 'name', 'VV-04 Con pais');
    deleteFirstRow(true);
    shot(cp, 2);
    cy.get('@countryId').then((countryId) => {
      cy.visitBO(`improve/international/countries/${countryId}/edit`);
      cy.get('#country_zone').find('option:selected').invoke('text').as('zoneText');
      shot(cp, 3);
      // Esperado: el borrado se impide (la zona sigue en la lista) o el país conserva una zona válida.
      cy.get('@zoneText').should('contain', 'VV-04 Con pais');
    });
  });

  it('CP-04-05 zona inexistente vía API', () => {
    const cp = 'CP-04-05';
    cy.apiToken('JULIANA').should('be.a', 'string');
    api('JULIANA', 'DELETE', '/zones/999999').then((r) => {
      cy.writeFile(`cypress/screenshots/api/${cp}.json`, { request: 'DELETE /admin-api/zones/999999', status: r.status, body: r.body });
      expect(r.status).to.eq(404);
    });
  });
});
