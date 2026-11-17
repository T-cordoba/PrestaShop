import {afterAll, describe, expect, it, vi} from 'vitest';
import {EventEmitter} from '@components/event-emitter';
import TranslatableInput from '@components/translatable-input';
import {perf} from './perf';

const {$} = window;

function editTaxForm(): JQuery {
  document.body.innerHTML = `
    <form>
      <button class="js-locale-btn">FR</button>
      <input class="js-locale-input js-locale-en d-none">
      <input class="js-locale-input js-locale-fr">
    </form>`;

  return $('form');
}

describe('RF02FrontPaths: TranslatableInput.refreshInputs()', () => {
  it('testCamino1: without a selected language no event is emitted', () => {
    const form = editTaxForm();
    const input = new TranslatableInput();
    input.selectedLocale = '';
    const emit = vi.spyOn(EventEmitter, 'emit');

    input.refreshInputs(form);

    expect(emit).not.toHaveBeenCalled();
    expect(form.find('.js-locale-fr').hasClass('d-none')).toBe(false);
  });

  it('testCamino2: with a selected language languageSelected is emitted and the inputs switch to EN', () => {
    const form = editTaxForm();
    const input = new TranslatableInput();
    input.selectedLocale = 'en';
    const emit = vi.spyOn(EventEmitter, 'emit');

    input.refreshInputs(form);

    expect(emit).toHaveBeenCalledWith('languageSelected', {selectedLocale: 'en', form});
    expect(form.find('.js-locale-en').hasClass('d-none')).toBe(false);
    expect(form.find('.js-locale-fr').hasClass('d-none')).toBe(true);
  });

  afterAll(() => {
    EventEmitter.removeAllListeners('languageSelected');
    const form = editTaxForm();
    const input = new TranslatableInput();
    input.selectedLocale = 'en';
    perf('02', () => input.refreshInputs(form));
  });
});
