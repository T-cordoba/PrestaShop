// Automated WCAG check (axe-core) of one BO view per RF. Violations are recorded, not asserted, so every view is
// measured; the report is built from reports/a11y/*.json.
const VIEWS = [
  ['A11Y-01-01', 'RF-01', 'Juliana', 'improve/international/taxes/new'],
  ['A11Y-02-01', 'RF-02', 'Juliana', 'improve/international/taxes/'],
  ['A11Y-03-01', 'RF-03', 'Juliana', 'improve/international/zones/new'],
  ['A11Y-04-01', 'RF-04', 'Juliana', 'improve/international/zones/'],
  ['A11Y-05-01', 'RF-05', 'Juliana', 'improve/international/countries/new'],
  ['A11Y-06-01', 'RF-06', 'Tomás', 'sell/catalog/brands/new'],
  ['A11Y-07-01', 'RF-07', 'Tomás', 'sell/catalog/brands/'],
  ['A11Y-08-01', 'RF-08', 'Tomás', 'sell/catalog/suppliers/'],
  ['A11Y-09-01', 'RF-09', 'Tomás', 'sell/catalog/suppliers/'],
  ['A11Y-10-01', 'RF-10', 'Tomás', 'sell/catalog/features/new-value'],
];

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

describe('Accesibilidad WCAG 2.2 (axe-core)', () => {
  VIEWS.forEach(([id, rf, who, route]) => {
    it(`${id} ${rf} ${route}`, () => {
      cy.visitBO(route);
      cy.injectAxe();
      cy.checkA11y(null, { runOnly: { type: 'tag', values: TAGS } }, (violations) => {
        const summary = violations.map((v) => ({
          id: v.id, impact: v.impact, help: v.help, helpUrl: v.helpUrl, tags: v.tags.filter((t) => t.startsWith('wcag')),
          nodes: v.nodes.length, sample: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
        }));
        cy.writeFile(`reports/a11y/${id}.json`, { id, rf, who, route, violations: summary });
      }, true);
      cy.screenshot(id, { capture: 'viewport', overwrite: true });
      cy.writeFile(`reports/a11y/${id}.done`, 'ok');
    });
  });
});
