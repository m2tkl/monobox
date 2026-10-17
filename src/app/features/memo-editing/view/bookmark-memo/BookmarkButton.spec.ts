import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, nextTick, ref } from 'vue';

import BookmarkButton from './BookmarkButton.vue';

const { toggleMemoBookmark, useBookmarkListReadModel } = vi.hoisted(() => ({
  toggleMemoBookmark: vi.fn(),
  useBookmarkListReadModel: vi.fn(),
}));
const bookmarkItems = ref<Array<{ slug_title: string }>>([]);

vi.mock('../../resource/command/toggleMemoBookmark', () => ({
  toggleMemoBookmark,
}));

vi.mock('~/app/features/memo-browsing', () => ({
  useBookmarkListReadModel,
}));

const ButtonStub = defineComponent({
  inheritAttrs: false,
  template: '<button v-bind="$attrs" @click="$emit(\'click\')" />',
});

describe('BookmarkButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bookmarkItems.value = [];
    useBookmarkListReadModel.mockReturnValue(computed(() => ({
      data: { items: bookmarkItems.value },
    })));
    vi.stubGlobal('computed', computed);
    vi.stubGlobal('ref', ref);
    vi.stubGlobal('useToast', () => ({ add: vi.fn() }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses Chrome-style star states and toggles the current memo bookmark', async () => {
    const wrapper = mount(BookmarkButton, {
      props: {
        workspaceSlug: 'workspace',
        memoSlug: 'memo',
      },
      global: {
        stubs: { IconButton: ButtonStub },
      },
    });

    expect(wrapper.get('button').attributes('icon')).toBe('carbon:star');
    expect(wrapper.get('button').classes()).toEqual(expect.arrayContaining([
      'bookmark-button',
      'size-6',
      'min-w-6',
      'rounded-full',
      'p-0',
    ]));
    await wrapper.get('button').trigger('click');
    expect(toggleMemoBookmark).toHaveBeenLastCalledWith({
      workspaceSlug: 'workspace',
      memoSlug: 'memo',
      isBookmarked: false,
    });

    bookmarkItems.value = [{ slug_title: 'memo' }];
    await nextTick();
    expect(wrapper.get('button').attributes('icon')).toBe('carbon:star-filled');
  });
});
