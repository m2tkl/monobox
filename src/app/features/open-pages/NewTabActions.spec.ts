import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';

import NewTabActions from './NewTabActions.vue';

const { openPagesStore, routerPush, routerReplace } = vi.hoisted(() => ({
  openPagesStore: {
    createTab: vi.fn(),
  },
  routerPush: vi.fn(async () => {}),
  routerReplace: vi.fn(async () => {}),
}));

vi.mock('./openPagesStore', () => ({
  useOpenPagesStore: () => openPagesStore,
}));

const ButtonStub = defineComponent({
  inheritAttrs: false,
  template: '<button v-bind="$attrs"><slot /></button>',
});

describe('NewTabActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('useRouter', () => ({ push: routerPush, replace: routerReplace }));
  });

  afterEach(() => vi.unstubAllGlobals());

  it('creates a new tab without retaining the previous tab route in browser history', async () => {
    const wrapper = mount(NewTabActions, {
      props: { workspaceSlug: 'workspace' },
      global: { stubs: { AppButton: ButtonStub } },
    });

    await wrapper.get('[aria-label="New tab"]').trigger('click');

    expect(openPagesStore.createTab).toHaveBeenCalledWith('workspace');
    expect(routerReplace).toHaveBeenCalledWith('/workspace/_new-tab');
    expect(routerPush).not.toHaveBeenCalled();
  });
});
