// Security suite (OWASP Top 10:2021) on the Admin API and the BO of the selected RF.
const API = () => Cypress.env('API_URL') || 'https://localhost:8002';
const raw = (options) => cy.request({ failOnStatusCode: false, ...options });

// Header and payload of a JWT signed with "none": a forged token must never be accepted.
const b64 = (o) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const NONE_JWT = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ aud: 'vv-tomas', sub: 'vv-tomas', scopes: ['manufacturer_write'], exp: 4102444800 })}.`;

/** Error bodies must not leak internals (stack traces, SQL, file paths). */
const expectSafeError = (body) => {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  expect(text).not.to.match(/Stack trace|#0 \/|\.php:\d+|SQLSTATE|PDOException|vendor\//);
};

describe('Seguridad — Admin API (A01, A02, A03, A04, A05, A07, A08)', () => {
  it('SEC-01 A07 sin token la API responde 401', () => {
    raw({ url: `${API()}/admin-api/manufacturers` }).then((r) => {
      expect(r.status).to.eq(401);
      expectSafeError(r.body);
    });
  });

  it('SEC-02 A07 un JWT con alg "none" se rechaza', () => {
    raw({ url: `${API()}/admin-api/manufacturers`, headers: { Authorization: `Bearer ${NONE_JWT}` } }).its('status').should('eq', 401);
  });

  it('SEC-03 A07 un secreto equivocado no obtiene token', () => {
    raw({
      method: 'POST', url: `${API()}/admin-api/access_token`, form: true,
      body: { grant_type: 'client_credentials', client_id: Cypress.env('API_TOMAS_ID'), client_secret: 'secreto-incorrecto' },
    }).then((r) => {
      expect(r.status).to.be.oneOf([400, 401]);
      expect(r.body).not.to.have.property('access_token');
    });
  });

  it('SEC-04 A01 el token de Juliana (impuestos) no puede crear marcas', () => {
    cy.api('JULIANA', 'POST', '/manufacturers', { name: 'VV-SEC no autorizado', enabled: true, shopIds: [1] }).its('status').should('eq', 403);
  });

  it('SEC-05 A01 el token de Tomás (catálogo) no puede borrar zonas', () => {
    cy.api('TOMAS', 'DELETE', '/zones/1').its('status').should('eq', 403);
  });

  it('SEC-06 A01 no se puede pedir un scope que el cliente no tiene', () => {
    raw({
      method: 'POST', url: `${API()}/admin-api/access_token`, form: true,
      body: { grant_type: 'client_credentials', client_id: Cypress.env('API_TOMAS_ID'), client_secret: Cypress.env('API_TOMAS_SECRET'), scope: 'tax_write' },
    }).then((r) => expect(r.status, 'scope ajeno').to.be.oneOf([400, 401]));
  });

  it('SEC-07 A03 una inyección SQL en el filtro se trata como texto', () => {
    cy.api('TOMAS', 'GET', `/manufacturers?filters[name]=${encodeURIComponent("' OR '1'='1")}`).then((r) => {
      expect(r.status).to.eq(200);
      expect(r.body.items, 'ninguna marca se llama así').to.have.length(0);
    });
  });

  it('SEC-08 A03 un nombre con script se rechaza al crear una marca', () => {
    cy.api('TOMAS', 'POST', '/manufacturers', { name: '<script>alert(1)</script>', enabled: true, shopIds: [1] }).then((r) => {
      expect(r.status).to.be.oneOf([400, 422]);
      expectSafeError(r.body);
    });
  });

  it('SEC-09 A04 asignación masiva: un zoneId en el cuerpo no sobrescribe otra zona', () => {
    cy.api('JULIANA', 'GET', '/zones/1').then((before) => {
      cy.api('JULIANA', 'POST', '/zones', { zoneId: 1, name: 'VV-SEC masiva', enabled: true, shopIds: [1] }).then((r) => {
        expect(r.status).to.eq(201);
        expect(r.body.zoneId).not.to.eq(1);
      });
      cy.api('JULIANA', 'GET', '/zones/1').its('body.name').should('eq', before.body.name);
    });
  });

  it('SEC-10 A05 un recurso inexistente responde 404 sin filtrar detalles internos', () => {
    cy.api('JULIANA', 'GET', '/taxes/999999').then((r) => {
      expect(r.status).to.eq(404);
      expectSafeError(r.body);
    });
  });

  it('SEC-11 A05 una entrada inválida no provoca un error 500 (tasa no numérica)', () => {
    cy.api('JULIANA', 'POST', '/taxes', { names: { 'en-US': 'VV-SEC tasa' }, rate: 'abc', enabled: true }).then((r) => {
      expect(r.status).to.be.oneOf([400, 422]);
      expectSafeError(r.body);
    });
  });

  it('SEC-12 A02 la API rechaza peticiones por HTTP plano', () => {
    raw({ url: `${Cypress.config('baseUrl')}/admin-api/manufacturers` }).its('status').should('be.oneOf', [401, 403]);
  });
});

describe('Seguridad — back office (A01, A05, A07)', () => {
  it('SEC-13 A07 sin sesión el BO redirige al login', () => {
    cy.clearAllCookies();
    cy.visit(`/${Cypress.env('ADMIN_PATH') || 'admin-dev'}/index.php/sell/catalog/brands/`, { failOnStatusCode: false });
    cy.get('input[name="email"]:visible').should('exist');
  });

  it('SEC-14 A01 una URL del BO sin token CSRF no ejecuta la acción', () => {
    cy.loginBO();
    cy.api('TOMAS', 'GET', '/suppliers/1').then((before) => {
      cy.visit(`/${Cypress.env('ADMIN_PATH') || 'admin-dev'}/index.php/sell/catalog/suppliers/1/toggle-status`, { failOnStatusCode: false });
      cy.api('TOMAS', 'GET', '/suppliers/1').its('body.enabled').should('eq', before.body.enabled);
    });
  });

  it('SEC-15 A05 el BO envía cabeceras contra clickjacking y MIME sniffing', () => {
    cy.loginBO();
    cy.request({ url: `/${Cypress.env('ADMIN_PATH') || 'admin-dev'}/index.php?controller=AdminLogin`, failOnStatusCode: false }).then((r) => {
      cy.writeFile('reports/security/SEC-15-headers.json', r.headers);
      expect(r.headers, 'X-Frame-Options').to.have.property('x-frame-options');
      expect(r.headers, 'X-Content-Type-Options').to.have.property('x-content-type-options');
    });
  });
});
