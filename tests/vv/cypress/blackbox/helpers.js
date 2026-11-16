// Black-box execution helpers: evidence named CP-XX-YY-pN, exact-length strings, shared assertions.

export const ADMIN = () => `/${Cypress.env('ADMIN_PATH') || 'admin-dev'}`;

/** String of exactly `len` characters that starts with `prefix`. */
export const str = (prefix, len) => (prefix + ' ' + 'abcdefghijklmnopqrstuvwxyz'.repeat(20)).slice(0, len);

export const shot = (cp, n) => cy.evidence(`${cp}-p${n}`);

/** Step 1 of every BO case: logged in, the RF's BO page is open. */
export const loginStep = (cp, route) => {
  cy.visitBO(route);
  cy.get('#main-div, #content, .main-header', { timeout: 60000 }).should('exist');
  shot(cp, 1);
};

export const successMessage = (text) => cy.get('.alert-success', { timeout: 60000 }).should('contain', text);

// Validation messages of the BO forms (the help texts such as "Invalid characters: <>={}" do not match).
const VALIDATION = /is required|required at least|is invalid|must contain|cannot be longer|longer than|not valid|should be|This value|is not allowed|does not exist|Syntax error|has already been used/i;

/** The form was rejected (server message, or the browser's HTML5 validation blocked the submit) and nothing was saved. */
export const formRejected = (urlPart) => {
  cy.location('pathname').should('contain', urlPart);
  cy.get('.alert-success:visible').should('not.exist');
  cy.get('body').then(($body) => {
    if ($body.find('input:invalid, textarea:invalid, select:invalid').length === 0) {
      cy.contains(VALIDATION).should('exist');
    }
  });
};

export const save = () => cy.get('#save-button, form[name="manufacturer"] button.btn-primary').filter(':visible').last().click();

// Grid filters are persisted per employee: clear the other columns so a previous case cannot narrow this search.
export const clearGridFilters = (grid) => {
  cy.get(`#${grid}_grid_table thead input[type="text"]`).each(($i) => cy.wrap($i).clear({ force: true }));
  cy.get(`#${grid}_grid_table thead select`).each(($s) => cy.wrap($s).select(0, { force: true }));
};

export const filterGrid = (grid, column, value) => {
  clearGridFilters(grid);
  cy.get(`#${grid}_${column}`).clear().type(value);
  cy.get(`button[name="${grid}[actions][search]"]`).first().click();
};

export const resetGridFilters = (grid) => {
  cy.get('body').then(($b) => {
    const reset = $b.find(`.js-reset-search, button[name="${grid}[actions][reset]"]`);
    if (reset.length) cy.wrap(reset.first()).click({ force: true });
  });
};

/** Opens the row dropdown and clicks Delete, then confirms or cancels the modal. */
export const deleteFirstRow = (confirm = true) => {
  cy.get('table tbody tr').first().within(() => {
    cy.get('.dropdown-toggle').click();
    cy.get('.grid-delete-row-link').click();
  });
  cy.get('.modal.show', { timeout: 20000 }).should('be.visible');
  cy.wait(600); // Bootstrap ignores clicks during the fade-in transition.
  cy.get('.modal.show').within(() => {
    if (confirm) cy.get('.btn-confirm-submit').click();
    else cy.get('.btn-outline-secondary[data-dismiss="modal"]').click();
  });
  cy.get('.modal.show').should('not.exist');
};

export const api = (who, method, url, body) => cy.api(who, method, url, body);

/** Runs SQL on the local MySQL container (precondition data only). */
export const sql = (query) => cy.task('sql', query);
