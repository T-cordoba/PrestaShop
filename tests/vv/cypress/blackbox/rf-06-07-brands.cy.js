import { api, filterGrid, formRejected, loginStep, save, shot, sql, str, successMessage } from './helpers';

const LIST = 'sell/catalog/brands/';
const NEW = 'sell/catalog/brands/new';

const setRich = (id, html) =>
  cy.window().then((win) => {
    const editor = win.tinymce && win.tinymce.get(id);
    if (editor) editor.setContent(html);
    else cy.get(`#${id}`).invoke('val', html);
  });

const fillBrand = ({ name, description, metaTitle, enabled = true, logo }) => {
  cy.get('#manufacturer_name').clear();
  if (name) cy.get('#manufacturer_name').type(name, { delay: 0, parseSpecialCharSequences: false });
  if (description !== undefined) setRich('manufacturer_description_1', description);
  if (metaTitle) cy.get('#manufacturer_meta_title_1').clear().type(metaTitle, { delay: 0 });
  if (logo) cy.get('#manufacturer_logo').selectFile(`cypress/fixtures/${logo}`, { force: true });
  cy.get(enabled ? '#manufacturer_is_enabled_1' : '#manufacturer_is_enabled_0').check({ force: true });
};

const newBrandApi = (name, enabled = true) =>
  api('TOMAS', 'POST', '/manufacturers', { name, enabled, shopIds: [1], shortDescriptions: { 'en-US': '' }, descriptions: { 'en-US': '' }, metaTitles: { 'en-US': '' }, metaDescriptions: { 'en-US': '' }, metaKeywords: { 'en-US': '' } }).then((r) => {
    expect(r.status, `crear marca ${name}`).to.eq(201);
    return r.body.manufacturerId;
  });

// Data left by a previous run would duplicate the rows the filters expect.
before(() => sql("DELETE m, ml, ms FROM ps_manufacturer m LEFT JOIN ps_manufacturer_lang ml ON ml.id_manufacturer = m.id_manufacturer LEFT JOIN ps_manufacturer_shop ms ON ms.id_manufacturer = m.id_manufacturer WHERE m.name LIKE 'VV-0%'"));

describe('RF-06 Crear marca (Tomás)', () => {
  it('CP-06-01 crear marca válida', () => {
    const cp = 'CP-06-01';
    loginStep(cp, LIST);
    cy.visitBO(NEW);
    shot(cp, 2);
    fillBrand({ name: 'VV-06-CP01 Andes', description: '<p><b>Café</b> de origen</p>' });
    save();
    successMessage('Successful creation');
    filterGrid('manufacturer', 'name', 'VV-06-CP01');
    cy.get('#manufacturer_grid_table tbody tr').first().should('contain', 'VV-06-CP01 Andes');
    shot(cp, 3);
  });

  it('CP-06-02 inactiva con valores límite', () => {
    const cp = 'CP-06-02';
    loginStep(cp, LIST);
    cy.visitBO(NEW);
    fillBrand({ name: str('VV-06-CP02', 64), metaTitle: str('VV-06-CP02 meta', 255), enabled: false });
    save();
    successMessage('Successful creation');
    filterGrid('manufacturer', 'name', 'VV-06-CP02');
    cy.get('#manufacturer_grid_table tbody tr').first().should('contain', str('VV-06-CP02', 64)).find('input[id^="input-false"]').should('be.checked');
    shot(cp, 2);
  });

  it('CP-06-03 marca con logo', () => {
    const cp = 'CP-06-03';
    loginStep(cp, LIST);
    cy.visitBO(NEW);
    fillBrand({ name: 'VV-06-CP03 Logo', logo: 'logo.jpg' });
    save();
    successMessage('Successful creation');
    filterGrid('manufacturer', 'name', 'VV-06-CP03');
    cy.get('#manufacturer_grid_table tbody tr').first().find('img').should('have.attr', 'src').and('not.contain', 'en-default');
    shot(cp, 2);
  });

  it('CP-06-04 nombre inválido', () => {
    const cp = 'CP-06-04';
    const accepted = [];
    loginStep(cp, LIST);
    [['', 2], ['Marca<>', 3], [str('VV-06-CP04', 65), 4]].forEach(([name, n]) => {
      cy.visitBO(NEW);
      fillBrand({ name });
      save();
      shot(cp, n);
      cy.location('pathname').then((p) => {
        if (!p.includes('/brands/new')) accepted.push(name || '(vacío)');
      });
    });
    cy.then(() => expect(accepted, 'nombres aceptados que debían rechazarse').to.be.empty);
  });

  it('CP-06-05 HTML peligroso, archivo no imagen, meta título largo', () => {
    const cp = 'CP-06-05';
    const accepted = [];
    loginStep(cp, LIST);
    // Paso 2: con script en la descripción se espera rechazo o HTML depurado sin <script>.
    cy.visitBO(NEW);
    fillBrand({ name: 'VV-06-CP05 Script', description: '<p>ok</p><script>window.vvXss = 1</script><a href="javascript:void(0)" data-vv="1">x</a>' });
    save();
    shot(cp, 2);
    cy.location('pathname').then((p) => {
      if (!p.includes('/brands/new')) {
        api('TOMAS', 'GET', '/manufacturers?filters[name]=VV-06-CP05 Script').then((r) => {
          const id = r.body.items?.[0]?.manufacturerId;
          if (id) api('TOMAS', 'GET', `/manufacturers/${id}`).then((m) => {
            const html = JSON.stringify(m.body.descriptions || {});
            cy.writeFile(`cypress/screenshots/api/${cp}-descripcion.json`, m.body);
            if (/<script|javascript:/i.test(html)) accepted.push('script guardado sin depurar');
          });
        });
      }
    });
    [['notas.txt', { name: 'VV-06-CP05 Txt', logo: 'notas.txt' }, 3], ['meta 256', { name: 'VV-06-CP05 Meta', metaTitle: str('VV-06-CP05 meta', 256) }, 4]].forEach(([label, data, n]) => {
      cy.visitBO(NEW);
      fillBrand(data);
      save();
      shot(cp, n);
      cy.location('pathname').then((p) => {
        if (!p.includes('/brands/new')) accepted.push(label);
      });
    });
    cy.then(() => expect(accepted, 'entradas peligrosas o inválidas aceptadas').to.be.empty);
  });
});

describe('RF-07 Listar y filtrar marcas (Tomás)', () => {
  before(() => {
    newBrandApi('VV-07L A', true);
    newBrandApi('VV-07L B', false);
    for (let i = 1; i <= 10; i += 1) newBrandApi(`VV-07P ${String(i).padStart(2, '0')}`);
  });

  it('CP-07-01 filtrar por nombre', () => {
    const cp = 'CP-07-01';
    loginStep(cp, LIST);
    shot(cp, 2);
    filterGrid('manufacturer', 'name', 'VV-07L');
    cy.get('#manufacturer_grid_table tbody tr').should('have.length', 2);
    shot(cp, 3);
    filterGrid('manufacturer', 'name', 'zzzz-no-existe');
    cy.get('#manufacturer_grid_table tbody').should('contain', 'No records found');
    shot(cp, 4);
  });

  it('CP-07-02 filtrar por id y estado, ordenar', () => {
    const cp = 'CP-07-02';
    loginStep(cp, LIST);
    filterGrid('manufacturer', 'name', 'VV-07L');
    cy.get('#manufacturer_active').select('No');
    cy.get('button[name="manufacturer[actions][search]"]').first().click();
    cy.get('#manufacturer_grid_table tbody tr').should('have.length', 1).and('contain', 'VV-07L B');
    shot(cp, 2);
    api('TOMAS', 'GET', '/manufacturers?filters[name]=VV-07L A').then((r) => {
      const id = String(r.body.items[0].manufacturerId);
      cy.get('#manufacturer_active').select('');
      cy.get('#manufacturer_name').clear();
      filterGrid('manufacturer', 'id_manufacturer', id);
      cy.get('#manufacturer_grid_table tbody tr').should('have.length', 1).and('contain', 'VV-07L A');
    });
    shot(cp, 3);
    cy.get('#manufacturer_id_manufacturer').clear();
    filterGrid('manufacturer', 'name', 'VV-07P');
    cy.get('#manufacturer_grid_table [data-sort-col-name="name"]').click();
    cy.location('search').should('contain', 'orderBy%5D=name');
    cy.get('#manufacturer_grid_table tbody tr').then(($rows) => {
      const names = [...$rows].map((r) => r.innerText.match(/VV-07P \d+/)?.[0]).filter(Boolean);
      expect(names, 'orden alfabético por nombre').to.deep.equal([...names].sort());
    });
    shot(cp, 4);
  });

  it('CP-07-03 paginación en el límite', () => {
    const cp = 'CP-07-03';
    loginStep(cp, LIST);
    cy.visitBO('sell/catalog/brands/?manufacturer[limit]=10&manufacturer[offset]=0&manufacturer[filters][name]=VV-07P');
    cy.get('#manufacturer_grid_table tbody tr').should('have.length', 10);
    cy.get('#manufacturer_grid .page-item a[data-page="2"], #manufacturer_grid .pagination .page-link:contains("2")').should('not.exist');
    shot(cp, 2);
    newBrandApi('VV-07P 11');
    cy.reload();
    cy.get('#manufacturer_grid .pagination').should('contain', '2');
    shot(cp, 3);
  });

  it('CP-07-04 comodines en el filtro de nombre', () => {
    const cp = 'CP-07-04';
    const counts = {};
    loginStep(cp, LIST);
    [['%', 2], ['_', 3]].forEach(([value, n]) => {
      filterGrid('manufacturer', 'name', value);
      shot(cp, n);
      cy.get('#manufacturer_grid_table tbody tr').then(($rows) => {
        counts[value] = $rows.filter(':not(:contains("No records found"))').length;
      });
    });
    cy.then(() => expect(counts, 'filas devueltas por un comodín literal').to.deep.equal({ '%': 0, _: 0 }));
  });

  it('CP-07-05 id inválido y sin sesión', () => {
    const cp = 'CP-07-05';
    loginStep(cp, LIST);
    ['abc', '-1', '0'].forEach((value) => filterGrid('manufacturer', 'id_manufacturer', value));
    cy.get('body').should('not.contain', 'Internal Server Error').and('not.contain', 'Whoops');
    shot(cp, 2);
    cy.url().then((url) => {
      cy.clearAllCookies();
      cy.visit(url, { failOnStatusCode: false });
      cy.get('input[name="email"]:visible').should('exist');
      shot(cp, 3);
    });
  });
});
