import {afterAll, beforeEach, describe, expect, it, vi} from 'vitest';
import TranslatableField from '@components/translatable-field';
import {perf} from './perf';

const {$} = window;

// Language tabs of the brand description, as rendered by translatable_fields_with_tabs.
function brandForm(navigations: string[]): void {
  document.body.innerHTML = `<form>${navigations.map((active) => `
    <ul class="translationsLocales nav">
      <li class="nav-item"><a href="#" data-locale="en" data-toggle="tab" class="nav-link ${active === 'en' ? 'active' : ''}">en</a></li>
      <li class="nav-item"><a href="#" data-locale="fr" data-toggle="tab" class="nav-link ${active === 'fr' ? 'active' : ''}">fr</a></li>
    </ul>`).join('')}</form>`;
}

describe('RF06FrontPaths: TranslatableField.toggleFields()', () => {
  let shownTabs: string[];

  beforeEach(() => {
    shownTabs = [];
    // Bootstrap tab plugin: records which tab is shown.
    $.fn.tab = vi.fn(function recordTab(this: JQuery) {
      shownTabs.push(this.data('locale'));
      return this;
    }) as never;
  });

  it('testCamino1: without language bars nothing changes', () => {
    brandForm([]);

    new TranslatableField({}).toggleFields({selectedLocale: 'fr'});

    expect(shownTabs).toEqual([]);
  });

  it('testCamino2: a bar already on FR keeps its tab', () => {
    brandForm(['fr']);

    new TranslatableField({}).toggleFields({selectedLocale: 'fr'});

    expect(shownTabs).toEqual([]);
  });

  it('testCamino3: a bar on EN shows its FR tab', () => {
    brandForm(['en']);

    new TranslatableField({}).toggleFields({selectedLocale: 'fr'});

    expect(shownTabs).toEqual(['fr']);
  });

  afterAll(() => {
    brandForm(['en', 'en']);
    const field = new TranslatableField({});
    perf('06', () => field.toggleFields({selectedLocale: 'fr'}));
  });
});
