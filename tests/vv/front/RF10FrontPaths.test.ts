import {afterAll, beforeEach, describe, expect, it} from 'vitest';
import {EventEmitter} from '@components/event-emitter';
import TranslatableInput from '@components/translatable-input';
import {perf} from './perf';

const DEFAULTS = {localeItemSelector: '.js-locale-item', localeButtonSelector: '.js-locale-btn', localeInputSelector: '.js-locale-input'};

function selectors(input: TranslatableInput) {
  const {localeItemSelector, localeButtonSelector, localeInputSelector} = input;

  return {localeItemSelector, localeButtonSelector, localeInputSelector};
}

describe('RF10FrontPaths: TranslatableInput constructor', () => {
  beforeEach(() => {
    // Feature value form: default language item EN, plus a custom item in FR.
    document.body.innerHTML = `
      <form>
        <span class="js-locale-item" data-locale="en"></span>
        <span class="x-item" data-locale="fr"></span>
      </form>`;
    EventEmitter.removeAllListeners('languageSelected');
  });

  it('testCamino1: null options fall back to an empty object and the default selectors', () => {
    const input = new TranslatableInput(null as never);

    expect(selectors(input)).toEqual(DEFAULTS);
    expect(input.selectedLocale).toBe('en');
  });

  it('testCamino2: no arguments (as initComponents does) uses the default selectors', () => {
    const input = new TranslatableInput();

    expect(selectors(input)).toEqual(DEFAULTS);
    expect(EventEmitter.listenerCount('languageSelected')).toBe(1);
  });

  it('testCamino3: a custom localeItemSelector is used and read for the initial language', () => {
    const input = new TranslatableInput({localeItemSelector: '.x-item'});

    expect(selectors(input)).toEqual({...DEFAULTS, localeItemSelector: '.x-item'});
    expect(input.selectedLocale).toBe('fr');
  });

  it('testCamino4: a custom localeButtonSelector is used', () => {
    expect(selectors(new TranslatableInput({localeButtonSelector: '.x-btn'}))).toEqual({...DEFAULTS, localeButtonSelector: '.x-btn'});
  });

  it('testCamino5: a custom localeInputSelector is used', () => {
    expect(selectors(new TranslatableInput({localeInputSelector: '.x-input'}))).toEqual({...DEFAULTS, localeInputSelector: '.x-input'});
  });

  afterAll(() => {
    perf('10', () => new TranslatableInput(), 200);
    EventEmitter.removeAllListeners('languageSelected');
  });
});
