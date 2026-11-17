import {afterAll, describe, expect, it, vi} from 'vitest';
import ConfirmModal from '@components/modal';
import SubmitBulkActionExtension from '@components/grid/extension/submit-bulk-action-extension';
import {perf} from './perf';

vi.mock('@components/modal', () => {
  const FakeModal = vi.fn(function fakeModal(this: {show: () => void}) {
    this.show = vi.fn();
  });

  return {default: FakeModal, ConfirmModal: FakeModal};
});

const {$} = window;

// Supplier grid with one bulk action button (enable/disable selection).
function supplierGrid(attributes: string): JQuery {
  document.body.innerHTML = `
    <div id="supplier_grid">
      <button class="js-bulk-action-submit-btn" data-form-url="/suppliers/bulk-enable" data-form-method="POST" ${attributes}>
        Enable selection
      </button>
    </div>`;
  const grid = {getContainer: () => $('#supplier_grid'), getId: () => 'supplier'};
  new SubmitBulkActionExtension().extend(grid as never);

  return $('.js-bulk-action-submit-btn');
}

function postFormSpy() {
  return vi.spyOn(SubmitBulkActionExtension.prototype as never as {postForm(): void}, 'postForm')
    .mockImplementation(() => undefined);
}

describe('RF08FrontPaths: SubmitBulkActionExtension.submit()', () => {
  it('testCamino1: without confirm message the form is posted', () => {
    const postForm = postFormSpy();

    supplierGrid('').trigger('click');

    expect(postForm).toHaveBeenCalledTimes(1);
  });

  it('testCamino2: with an empty confirm message the form is posted', () => {
    const postForm = postFormSpy();

    supplierGrid('data-confirm-message=""').trigger('click');

    expect(postForm).toHaveBeenCalledTimes(1);
  });

  it('testCamino3: with message and title the confirmation modal opens', () => {
    const postForm = postFormSpy();

    supplierGrid('data-confirm-message="¿Seguro?" data-confirm-title="Activar"').trigger('click');

    const modal = vi.mocked(ConfirmModal).mock;
    expect(modal.calls.at(-1)?.[0]).toMatchObject({confirmTitle: 'Activar', confirmMessage: '¿Seguro?'});
    expect(vi.mocked(modal.instances.at(-1)!.show)).toHaveBeenCalled();
    expect(postForm).not.toHaveBeenCalled();
  });

  it('testCamino4: with message, no title and window.confirm cancelled nothing is posted', () => {
    const postForm = postFormSpy();
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    supplierGrid('data-confirm-message="¿Seguro?"').trigger('click');

    expect(postForm).not.toHaveBeenCalled();
  });

  it('testCamino5: with message, no title and window.confirm accepted the form is posted', () => {
    const postForm = postFormSpy();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

    supplierGrid('data-confirm-message="¿Seguro?"').trigger('click');

    expect(confirm).toHaveBeenCalledWith('¿Seguro?');
    expect(postForm).toHaveBeenCalledTimes(1);
  });

  afterAll(() => {
    postFormSpy();
    const button = supplierGrid('');
    perf('08', () => button.trigger('click'));
  });
});
