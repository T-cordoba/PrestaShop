import { ADMIN, api, deleteFirstRow, filterGrid, loginStep, shot, sql, successMessage } from './helpers';

const LIST = 'sell/catalog/suppliers/';
const FRANCE = 8;

const newSupplierApi = (name, enabled = true) =>
  api('TOMAS', 'POST', '/suppliers', { name, address: 'Calle 1', city: 'Medellin', countryId: FRANCE, enabled, shopIds: [1], descriptions: { 'en-US': 'VV' }, metaTitles: { 'en-US': 'VV' }, metaDescriptions: { 'en-US': 'VV' } }).then((r) => {
    expect(r.status, `crear proveedor ${name}`).to.eq(201);
    return r.body.supplierId;
  });

const enabledOf = (id) => api('TOMAS', 'GET', `/suppliers/${id}`).its('body.enabled');

const apiEvidence = (cp, request, r) => cy.writeFile(`cypress/screenshots/api/${cp}.json`, { request, status: r.status, body: r.body });

// Data left by a previous run would duplicate the rows the filters expect.
before(() => sql("DELETE s, sl, ss FROM ps_supplier s LEFT JOIN ps_supplier_lang sl ON sl.id_supplier = s.id_supplier LEFT JOIN ps_supplier_shop ss ON ss.id_supplier = s.id_supplier WHERE s.name LIKE 'VV-0%'"));

describe('RF-08 Activar/desactivar proveedor (Tomás)', () => {
  let activo;

  before(() => {
    newSupplierApi('VV-08 Activo').then((id) => {
      activo = id;
    });
  });

  it('CP-08-01 desactivar desde la lista', () => {
    const cp = 'CP-08-01';
    loginStep(cp, LIST);
    filterGrid('supplier', 'name', 'VV-08 Activo');
    cy.get('table tbody tr').first().find('input[id^="input-true"]').should('be.checked');
    shot(cp, 2);
    cy.get('table tbody tr').first().find('.ps-switch').click();
    successMessage('successfully updated');
    cy.get('table tbody tr').first().find('input[id^="input-false"]').should('be.checked');
    shot(cp, 3);
  });

  it('CP-08-02 reactivar y comprobar el estado', () => {
    const cp = 'CP-08-02';
    loginStep(cp, LIST);
    filterGrid('supplier', 'name', 'VV-08 Activo');
    cy.get('table tbody tr').first().find('.ps-switch').click();
    successMessage('successfully updated');
    cy.get('table tbody tr').first().find('input[id^="input-true"]').should('be.checked');
    shot(cp, 2);
    enabledOf(activo).then((enabled) => {
      apiEvidence(cp, `GET /admin-api/suppliers/${activo}`, { status: 200, body: { enabled } });
      expect(enabled).to.eq(true);
    });
  });

  it('CP-08-03 cambio masivo', () => {
    const cp = 'CP-08-03';
    newSupplierApi('VV-08 Masivo A');
    newSupplierApi('VV-08 Masivo B');
    loginStep(cp, LIST);
    filterGrid('supplier', 'name', 'VV-08 Masivo');
    cy.get('input[name="supplier_bulk[]"]').check({ force: true });
    cy.get('.js-bulk-actions-btn').click();
    cy.get('#supplier_grid_bulk_action_suppliers_disable_selection').click();
    successMessage('successfully updated');
    filterGrid('supplier', 'name', 'VV-08 Masivo');
    cy.get('table tbody tr input[id^="input-false"]:checked').should('have.length', 2);
    shot(cp, 2);
    cy.get('input[name="supplier_bulk[]"]').check({ force: true });
    cy.get('.js-bulk-actions-btn').click();
    cy.get('#supplier_grid_bulk_action_suppliers_enable_selection').click();
    successMessage('successfully updated');
    filterGrid('supplier', 'name', 'VV-08 Masivo');
    cy.get('table tbody tr input[id^="input-true"]:checked').should('have.length', 2);
    shot(cp, 3);
  });

  it('CP-08-04 proveedor inexistente vía API', () => {
    const cp = 'CP-08-04';
    cy.apiToken('TOMAS').should('be.a', 'string');
    api('TOMAS', 'PUT', '/suppliers/999999/toggle-status').then((r) => {
      apiEvidence(cp, 'PUT /admin-api/suppliers/999999/toggle-status', r);
      expect(r.status).to.eq(404);
    });
  });

  it('CP-08-05 petición sin token CSRF', () => {
    const cp = 'CP-08-05';
    loginStep(cp, LIST);
    enabledOf(activo).then((before) => {
      cy.visit(`${ADMIN()}/index.php/sell/catalog/suppliers/${activo}/toggle-status`, { failOnStatusCode: false });
      shot(cp, 2);
      enabledOf(activo).should('eq', before);
    });
  });
});

describe('RF-09 Eliminar proveedor (Tomás)', () => {
  it('CP-09-01 eliminar proveedor sin productos', () => {
    const cp = 'CP-09-01';
    newSupplierApi('VV-09 Solo');
    loginStep(cp, LIST);
    filterGrid('supplier', 'name', 'VV-09 Solo');
    deleteFirstRow(false);
    cy.get('table tbody tr').first().should('contain', 'VV-09 Solo');
    shot(cp, 2);
    deleteFirstRow(true);
    successMessage('Successful deletion');
    filterGrid('supplier', 'name', 'VV-09 Solo');
    cy.get('table tbody').should('contain', 'No records found');
    shot(cp, 3);
  });

  it('CP-09-02 eliminar proveedor con producto', () => {
    const cp = 'CP-09-02';
    newSupplierApi('VV-09 Con producto').then((supplierId) => {
      // Precondición: el producto demo 1 pasa a tener este proveedor (por defecto y en product_supplier).
      sql(`UPDATE ps_product SET id_supplier=${supplierId} WHERE id_product=1;` +
        ` INSERT INTO ps_product_supplier (id_product, id_product_attribute, id_supplier, id_currency) VALUES (1, 0, ${supplierId}, 1)`);
      sql(`SELECT COUNT(*) FROM ps_product_supplier WHERE id_supplier=${supplierId}`).then((rows) => {
        cy.writeFile(`cypress/screenshots/api/${cp}-antes.json`, { relaciones: rows[0] });
        expect(Number(rows[0])).to.be.greaterThan(0);
      });
      loginStep(cp, LIST);
      filterGrid('supplier', 'name', 'VV-09 Con producto');
      cy.get('table tbody tr').first().should('contain', '1');
      shot(cp, 2);
      deleteFirstRow(true);
      successMessage('Successful deletion');
      shot(cp, 3);
      sql(`SELECT p.id_product, p.id_supplier, (SELECT COUNT(*) FROM ps_product_supplier ps WHERE ps.id_supplier=${supplierId}) FROM ps_product p WHERE p.id_product=1`).then((rows) => {
        const [idProduct, idSupplier, relations] = rows[0].split('\t');
        cy.writeFile(`cypress/screenshots/api/${cp}-despues.json`, { idProduct, idSupplier, relations });
        expect(idProduct, 'el producto sigue existiendo').to.eq('1');
        expect(Number(relations), 'relaciones restantes con el proveedor').to.eq(0);
        expect(Number(idSupplier), 'proveedor por defecto del producto').not.to.eq(supplierId);
      });
    });
  });

  it('CP-09-03 borrado masivo', () => {
    const cp = 'CP-09-03';
    newSupplierApi('VV-09 Masivo A');
    newSupplierApi('VV-09 Masivo B');
    loginStep(cp, LIST);
    filterGrid('supplier', 'name', 'VV-09 Masivo');
    cy.get('input[name="supplier_bulk[]"]').check({ force: true });
    cy.get('.js-bulk-actions-btn').click();
    cy.get('#supplier_grid_bulk_action_delete_selection').click();
    cy.get('.modal.show .btn-confirm-submit').click();
    successMessage('deleted');
    filterGrid('supplier', 'name', 'VV-09 Masivo');
    cy.get('table tbody').should('contain', 'No records found');
    shot(cp, 2);
  });

  it('CP-09-04 proveedor inexistente vía API', () => {
    const cp = 'CP-09-04';
    cy.apiToken('TOMAS').should('be.a', 'string');
    api('TOMAS', 'DELETE', '/suppliers/999999').then((r) => {
      apiEvidence(cp, 'DELETE /admin-api/suppliers/999999', r);
      expect(r.status).to.eq(404);
    });
  });

  it('CP-09-05 eliminar dos veces', () => {
    const cp = 'CP-09-05';
    newSupplierApi('VV-09 Doble').then((id) => {
      api('TOMAS', 'DELETE', `/suppliers/${id}`).then((first) => {
        apiEvidence(`${cp}-p2`, `DELETE /admin-api/suppliers/${id}`, first);
        expect(first.status).to.eq(204);
      });
      api('TOMAS', 'DELETE', `/suppliers/${id}`).then((second) => {
        apiEvidence(`${cp}-p3`, `DELETE /admin-api/suppliers/${id} (repetido)`, second);
        expect(second.status).to.eq(404);
      });
    });
  });
});
