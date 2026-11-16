const admin = () => `/${Cypress.env('ADMIN_PATH') || 'admin-dev'}`;

// BO login, cached per spec run with cy.session.
Cypress.Commands.add('loginBO', () => {
  cy.session('bo-admin', () => {
    cy.visit(`${admin()}/`);
    cy.get('input[name="email"]:visible').clear().type(Cypress.env('BO_EMAIL'));
    cy.get('input[name="passwd"]:visible').clear().type(Cypress.env('BO_PASSWORD'), { log: false });
    cy.get('[name="submit_login"]:visible').click();
    cy.location('href', { timeout: 180000 }).should('match', /_token=|dashboard|AdminDashboard/i);
  });
});

// Symfony BO routes need the employee CSRF token in the URL: read it once from any tokenized link.
Cypress.Commands.add('boToken', () => {
  return cy.window({ log: false }).then((win) => {
    const cached = win.sessionStorage.getItem('vv-bo-token');
    if (cached) return cached;
    return cy.visit(`${admin()}/index.php?controller=AdminDashboard`).then(() =>
      cy.get('a[href*="_token="]').first().invoke('attr', 'href').then((href) => {
        const token = new URL(href, Cypress.config('baseUrl')).searchParams.get('_token');
        win.sessionStorage.setItem('vv-bo-token', token);
        return token;
      }),
    );
  });
});

// Visit a Symfony BO route such as 'improve/international/taxes/new'.
Cypress.Commands.add('visitBO', (route) => {
  cy.loginBO();
  cy.boToken().then((token) => {
    const sep = route.includes('?') ? '&' : '?';
    cy.visit(`${admin()}/index.php/${route}${sep}_token=${token}`);
  });
});

// Admin API (HTTPS only outside debug mode): client credentials token per integrante ('JULIANA' | 'TOMAS').
const apiUrl = () => Cypress.env('API_URL') || 'https://localhost:8002';
const tokens = {};

Cypress.Commands.add('apiToken', (who) => {
  if (tokens[who]) return cy.wrap(tokens[who], { log: false });
  return cy
    .request({
      method: 'POST',
      url: `${apiUrl()}/admin-api/access_token`,
      form: true,
      body: {
        grant_type: 'client_credentials',
        client_id: Cypress.env(`API_${who}_ID`),
        client_secret: Cypress.env(`API_${who}_SECRET`),
        scope: Cypress.env(`API_${who}_SCOPES`),
      },
      log: false,
    })
    .its('body.access_token')
    .then((token) => {
      tokens[who] = token;
      return token;
    });
});

Cypress.Commands.add('api', (who, method, url, body) => {
  return cy.apiToken(who).then((token) =>
    cy.request({
      method,
      url: `${apiUrl()}/admin-api${url}`,
      body,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    }),
  );
});

// Evidence screenshot with the black-box naming convention CP-XX-YY-pN.
Cypress.Commands.add('evidence', (name) => {
  cy.screenshot(name, { capture: 'viewport', overwrite: true });
});
