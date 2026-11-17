import {afterAll, describe, expect, it, vi} from 'vitest';
import FormFieldToggler, {InputFormFieldTogglerParams, ToggleType} from '@components/form/form-field-toggler';
import CountryMap from '@pages/country/country-map';
import {perf} from './perf';

// Same parameters as ZipCodeManager; the selector matches nothing so the constructor does not run the unit itself.
const ZIP_CODE_MANAGER: InputFormFieldTogglerParams = {
  disablingInputSelector: '#not-in-the-page',
  targetSelector: CountryMap.zipCodeFormatInput,
  toggleType: ToggleType.availability,
};

function countryForm(checked: '0' | '1' | null, dataAttributes = ''): HTMLInputElement {
  const radio = (value: string) => `<input type="radio" name="country[need_zip_code]" value="${value}"
    ${checked === value ? 'checked' : ''} ${dataAttributes}>`;
  document.body.innerHTML = `
    <form>
      ${radio('0')} ${radio('1')}
      <input id="country_zip_code_format" type="text">
      <input id="otro" type="text">
    </form>`;

  return document.querySelector<HTMLInputElement>('input[name="country[need_zip_code]"]')!;
}

type Unit = {updateTargetState(input: HTMLInputElement): void};

const toggler = (params: Partial<InputFormFieldTogglerParams> = {}) => new FormFieldToggler({...ZIP_CODE_MANAGER, ...params}) as never as Unit;

function updateTargetState(params: Partial<InputFormFieldTogglerParams>, input: HTMLInputElement): void {
  toggler(params).updateTargetState(input);
}

const zipFormatDisabled = () => document.querySelector('#country_zip_code_format')!.hasAttribute('disabled');

describe('RF05FrontPaths: FormFieldToggler.updateTargetState()', () => {
  it('testCamino1: with no radio checked nothing changes', () => {
    const input = countryForm(null);

    updateTargetState({}, input);

    expect(zipFormatDisabled()).toBe(false);
  });

  it('testCamino2: zip code not needed (0) disables the zip code format', () => {
    updateTargetState({}, countryForm('0'));

    expect(zipFormatDisabled()).toBe(true);
  });

  it('testCamino3: zip code needed (1) enables the zip code format', () => {
    const input = countryForm('1');
    document.querySelector('#country_zip_code_format')!.setAttribute('disabled', '');

    updateTargetState({}, input);

    expect(zipFormatDisabled()).toBe(false);
  });

  it('testCamino4: data-matching-value="1" makes value 1 disable the field', () => {
    updateTargetState({}, countryForm('1', 'data-matching-value="1"'));

    expect(zipFormatDisabled()).toBe(true);
  });

  it('testCamino5: data-target-selector disables that target instead of the zip code format', () => {
    updateTargetState({}, countryForm('0', 'data-target-selector="#otro"'));

    expect(document.querySelector('#otro')!.hasAttribute('disabled')).toBe(true);
    expect(zipFormatDisabled()).toBe(false);
  });

  it('testCamino6: data-switch-event emits the event and disables the field', () => {
    const emit = vi.fn();
    Object.assign(window, {prestashop: {instance: {eventEmitter: {emit}}}});

    updateTargetState({}, countryForm('0', 'data-switch-event="zipSwitch"'));

    expect(emit).toHaveBeenCalledWith('zipSwitch', {targetSelector: CountryMap.zipCodeFormatInput, disable: true});
    expect(zipFormatDisabled()).toBe(true);
  });

  it('testCamino7: data-disable-on-match="0" inverts the logic and keeps the field enabled', () => {
    updateTargetState({}, countryForm('0', 'data-disable-on-match="0"'));

    expect(zipFormatDisabled()).toBe(false);
  });

  it('testCamino8: without matching value it logs an error and changes nothing', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    updateTargetState({matchingValue: null}, countryForm('0'));

    expect(error).toHaveBeenCalledWith('No matching value defined for inputElement', expect.anything());
    expect(zipFormatDisabled()).toBe(false);
  });

  it('testCamino9: without target selector it logs an error and changes nothing', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    updateTargetState({targetSelector: null}, countryForm('0'));

    expect(error).toHaveBeenCalledWith('No target selector defined for inputElement', expect.anything());
    expect(zipFormatDisabled()).toBe(false);
  });

  // Unreachable: with dataset undefined the ?? lines (nodes 5, 8, 11) throw before the guard of node 15.
  it.skip('testCamino10: dataset undefined (dead code)', () => undefined);

  afterAll(() => {
    const input = countryForm('0');
    const unit = toggler();
    perf('05', () => unit.updateTargetState(input));
  });
});
