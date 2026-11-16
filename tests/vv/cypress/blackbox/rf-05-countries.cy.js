import { filterGrid, loginStep, save, shot, successMessage } from './helpers';

const LIST = 'improve/international/countries/';
const NEW = 'improve/international/countries/new';

const fillCountry = ({ name, iso, prefix = '57', zone = 'South America', zip = '', addressFormat }) => {
  cy.get('#country_name_1').clear();
  if (name) cy.get('#country_name_1').type(name, { delay: 0 });
  cy.get('#country_iso_code').clear();
  if (iso) cy.get('#country_iso_code').type(iso, { delay: 0 });
  // call_prefix is an <input type="number">: text such as "abc" can only reach the server through the value.
  cy.get('#country_call_prefix').invoke('val', prefix).trigger('input');
  cy.get('#country_zone').select(zone);
  if (zip) {
    cy.get('#country_need_zip_code_1').check({ force: true });
    cy.get('#country_zip_code_format').clear().type(zip, { delay: 0 });
  }
  if (addressFormat) cy.get('#country_address_format').invoke('val', addressFormat);
};

/** Submits each variant and returns the ones the BO accepted. */
const rejectAll = (cp, variants) => {
  const accepted = [];
  variants.forEach(([label, data, n]) => {
    cy.visitBO(NEW);
    fillCountry(data);
    save();
    shot(cp, n);
    cy.location('pathname').then((p) => {
      if (!p.includes('/countries/new')) accepted.push(label);
    });
  });
  cy.then(() => expect(accepted, 'variantes aceptadas que debían rechazarse').to.be.empty);
};

describe('RF-05 Crear país (Juliana)', () => {
  it('CP-05-01 crear país válido', () => {
    const cp = 'CP-05-01';
    loginStep(cp, LIST);
    cy.visitBO(NEW);
    shot(cp, 2);
    fillCountry({ name: 'VV-05-CP01 Patria', iso: 'XQ', zip: 'NNNNNN' });
    save();
    successMessage('Successful creation');
    filterGrid('country', 'name', 'VV-05-CP01');
    cy.get('table tbody tr').first().should('contain', 'South America');
    shot(cp, 3);
  });

  it('CP-05-02 ISO de 3 letras y formato postal de 12', () => {
    const cp = 'CP-05-02';
    loginStep(cp, LIST);
    cy.visitBO(NEW);
    fillCountry({ name: 'VV-05-CP02 Tres', iso: 'XQZ', prefix: '58', zip: 'NNNNN-LLLLLL' });
    save();
    successMessage('Successful creation');
    shot(cp, 2);
  });

  it('CP-05-03 formato de dirección personalizado', () => {
    const cp = 'CP-05-03';
    const format = 'firstname lastname\naddress1\ncity\nCountry:name';
    loginStep(cp, LIST);
    cy.visitBO(NEW);
    fillCountry({ name: 'VV-05-CP03 Formato', iso: 'XR', addressFormat: format });
    save();
    successMessage('Successful creation');
    filterGrid('country', 'name', 'VV-05-CP03');
    cy.get('table tbody tr').first().find('a[href*="/edit"]').first().click({ force: true });
    cy.get('#country_address_format').should('have.value', format);
    shot(cp, 2);
  });

  it('CP-05-04 ISO, prefijo o nombre inválidos', () => {
    const cp = 'CP-05-04';
    loginStep(cp, LIST);
    rejectAll(cp, [
      ['ISO X1', { name: 'VV-05-CP04 a', iso: 'X1' }, 2],
      ['ISO X', { name: 'VV-05-CP04 b', iso: 'X' }, 3],
      ['ISO XQZW', { name: 'VV-05-CP04 c', iso: 'XQZW' }, 4],
      ['prefijo abc y nombre vacío', { name: '', iso: 'XS', prefix: 'abc' }, 5],
    ]);
  });

  it('CP-05-05 formatos inválidos', () => {
    const cp = 'CP-05-05';
    loginStep(cp, LIST);
    rejectAll(cp, [
      ['postal 99#99', { name: 'VV-05-CP05 a', iso: 'XT', zip: '99#99' }, 2],
      ['postal de 13', { name: 'VV-05-CP05 b', iso: 'XU', zip: 'NNNNNNNNNNNNN' }, 3],
      ['dirección con campo inexistente', { name: 'VV-05-CP05 c', iso: 'XW', addressFormat: 'firstname lastname\naddress1\ncity\nAddress:campoFalso' }, 4],
    ]);
  });
});
