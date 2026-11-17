import {afterAll, describe, expect, it, vi} from 'vitest';
import TranslatableInput from '@components/translatable-input';
import {perf} from './perf';

const {$} = window;

function taxForm(changeLanguageUrl = ''): JQuery {
  const urlAttribute = changeLanguageUrl ? `data-change-language-url="${changeLanguageUrl}"` : '';
  document.body.innerHTML = `
    <form>
      <button class="js-locale-btn" ${urlAttribute}>EN</button>
      <span class="js-locale-item" data-locale="en"></span>
      <input class="js-locale-input js-locale-en" name="tax[name][1]">
      <input class="js-locale-input js-locale-fr d-none" name="tax[name][2]">
    </form>`;

  return $('form');
}

describe('RF01FrontPaths: TranslatableInput.toggleInputs()', () => {
  it('testCamino1: without change-language URL only the FR name is shown and nothing is posted', () => {
    const form = taxForm();
    const post = vi.spyOn($, 'post').mockImplementation(() => ({}) as JQuery.jqXHR);

    new TranslatableInput().toggleInputs({form, selectedLocale: 'fr'});

    expect(form.find('.js-locale-btn').text()).toBe('FR');
    expect(form.find('.js-locale-fr').hasClass('d-none')).toBe(false);
    expect(form.find('.js-locale-en').hasClass('d-none')).toBe(true);
    expect(post).not.toHaveBeenCalled();
  });

  it('testCamino2: with change-language URL the FR name is shown and the language is posted', () => {
    const form = taxForm('/change-language');
    const post = vi.spyOn($, 'post').mockImplementation(() => ({}) as JQuery.jqXHR);

    new TranslatableInput().toggleInputs({form, selectedLocale: 'fr'});

    expect(form.find('.js-locale-fr').hasClass('d-none')).toBe(false);
    expect(post).toHaveBeenCalledWith({url: '/change-language', data: {language_iso_code: 'fr'}});
  });

  afterAll(() => {
    const form = taxForm();
    const input = new TranslatableInput();
    perf('01', () => input.toggleInputs({form, selectedLocale: 'fr'}));
  });
});
