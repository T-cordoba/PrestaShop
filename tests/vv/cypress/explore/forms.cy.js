// Records the real field ids/names of each RF page so the suites use verified selectors.
const pages = {
  'RF-01 tax new': 'improve/international/taxes/new',
  'RF-03 zone new': 'improve/international/zones/new',
  'RF-05 country new': 'improve/international/countries/new',
  'RF-06 manufacturer new': 'sell/catalog/brands/new',
  'RF-07 manufacturers': 'sell/catalog/brands/',
  'RF-08 suppliers': 'sell/catalog/suppliers/',
  'RF-10 feature value new': 'sell/catalog/features/new-value',
  'RF-10 features': 'sell/catalog/features/',
};

describe('explore BO forms', () => {
  Object.entries(pages).forEach(([name, route]) => {
    it(name, () => {
      cy.visitBO(route);
      cy.document().then((doc) => {
        const fields = [...doc.querySelectorAll('form input, form select, form textarea, form button')]
          .filter((el) => el.type !== 'hidden' || /token/.test(el.name))
          .map((el) => ({ tag: el.tagName.toLowerCase(), type: el.type, id: el.id, name: el.name, label: doc.querySelector(`label[for="${el.id}"]`)?.innerText?.trim() }));
        const links = [...doc.querySelectorAll('a.btn, a[id^="page-header-desc"], .grid-bulk-action-delete-selection, [data-role]')]
          .map((a) => ({ id: a.id, cls: a.className, text: a.innerText.trim().slice(0, 40), href: (a.getAttribute('href') || '').replace(/_token=[^&]+/, '_token=…') }));
        cy.writeFile(`reports/explore/${name.replace(/\W+/g, '-')}.json`, { url: doc.location.pathname, title: doc.title, fields, links });
      });
    });
  });
});
