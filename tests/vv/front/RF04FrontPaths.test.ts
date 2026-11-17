import {afterAll, describe, expect, it, vi} from 'vitest';
import {ConfirmModal} from '@components/modal';
import SubmitRowActionExtension from '@components/grid/extension/action/row/submit-row-action-extension';
import {perf} from './perf';

vi.mock('@components/modal', () => ({
  ConfirmModal: vi.fn(function fakeModal(this: {show: () => void}) {
    this.show = vi.fn();
  }),
}));

const {$} = window;

// Zone grid with one "Delete" row action as rendered by submit.html.twig.
function zoneGrid(attributes: string): JQuery {
  document.body.innerHTML = `
    <div id="zone_grid">
      <a href="#" class="js-submit-row-action" data-url="/zones/7/delete" data-method="POST" ${attributes}>Delete</a>
    </div>`;
  const grid = {getContainer: () => $('#zone_grid'), getId: () => 'zone'};
  new SubmitRowActionExtension().extend(grid as never);

  return $('.js-submit-row-action');
}

function postFormSpy() {
  return vi.spyOn(SubmitRowActionExtension.prototype, 'postForm').mockImplementation(() => undefined);
}

describe('RF04FrontPaths: SubmitRowActionExtension.extend() click handler', () => {
  it('testCamino1: with a modal title the confirmation modal opens and the form is posted only on confirm', () => {
    const postForm = postFormSpy();
    zoneGrid('data-title="Delete selection" data-confirm-message="Are you sure?"').trigger('click');

    const modal = vi.mocked(ConfirmModal).mock;
    expect(modal.calls.at(-1)?.[0]).toMatchObject({confirmTitle: 'Delete selection', confirmMessage: 'Are you sure?'});
    expect(vi.mocked(modal.instances.at(-1)!.show)).toHaveBeenCalled();
    expect(postForm).not.toHaveBeenCalled();

    (modal.calls.at(-1)?.[1] as () => void)();
    expect(postForm).toHaveBeenCalledWith(expect.anything(), 'POST');
  });

  it('testCamino2: without title nor message the form is posted without asking', () => {
    const postForm = postFormSpy();
    const confirm = vi.spyOn(window, 'confirm');

    zoneGrid('data-confirm-message=""').trigger('click');

    expect(confirm).not.toHaveBeenCalled();
    expect(postForm).toHaveBeenCalledWith(expect.anything(), 'POST');
  });

  it('testCamino3: without title, a message accepted in window.confirm posts the form', () => {
    const postForm = postFormSpy();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

    zoneGrid('data-confirm-message="Are you sure?"').trigger('click');

    expect(confirm).toHaveBeenCalledWith('Are you sure?');
    expect(postForm).toHaveBeenCalled();
  });

  it('testCamino4: without title, a message cancelled in window.confirm posts nothing', () => {
    const postForm = postFormSpy();
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    zoneGrid('data-confirm-message="Are you sure?"').trigger('click');

    expect(postForm).not.toHaveBeenCalled();
  });

  afterAll(() => {
    postFormSpy();
    const button = zoneGrid('data-title="Delete selection" data-confirm-message="Are you sure?"');
    perf('04', () => button.trigger('click'));
  });
});
