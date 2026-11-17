import {afterAll, beforeEach, describe, expect, it} from 'vitest';
import SubmitRowActionExtension from '@components/grid/extension/action/row/submit-row-action-extension';
import {perf} from './perf';

const {$} = window;

describe('RF09FrontPaths: SubmitRowActionExtension.postForm()', () => {
  let submitted: HTMLFormElement[];

  beforeEach(() => {
    document.body.innerHTML = '<a class="js-submit-row-action" data-url="/suppliers/3/delete">Delete</a>';
    submitted = [];
    // Captures the form and stops the real navigation.
    $(document).off('submit').on('submit', 'form', (event) => {
      submitted.push(event.target as HTMLFormElement);
      event.preventDefault();
    });
  });

  const postForm = (method: string) => new SubmitRowActionExtension().postForm($('.js-submit-row-action'), method);

  it('testCamino1: POST builds a POST form without _method', () => {
    postForm('POST');

    expect(submitted).toHaveLength(1);
    expect(submitted[0].getAttribute('method')).toBe('POST');
    expect(submitted[0].getAttribute('action')).toBe('/suppliers/3/delete');
    expect(submitted[0].querySelector('input[name="_method"]')).toBeNull();
  });

  it('testCamino2: DELETE builds a POST form with the hidden _method=DELETE', () => {
    postForm('DELETE');

    expect(submitted).toHaveLength(1);
    expect(submitted[0].getAttribute('method')).toBe('POST');
    expect(submitted[0].querySelector<HTMLInputElement>('input[name="_method"]')?.value).toBe('DELETE');
  });

  // Unreachable: nodes 3 and 7 test the same boolean, it cannot be true and false at once.
  it.skip('testCamino3: GET/POST form with _method (contradictory)', () => undefined);

  afterAll(() => {
    perf('09', () => {
      postForm('DELETE');
      $('form').remove();
    });
  });
});
