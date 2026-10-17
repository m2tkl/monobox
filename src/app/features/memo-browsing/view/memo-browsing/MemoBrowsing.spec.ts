import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, ref } from 'vue';

import MemoBrowsing from './MemoBrowsing.vue';

const { clearDoneForToday, markDoneForToday } = vi.hoisted(() => ({
  clearDoneForToday: vi.fn().mockResolvedValue(undefined),
  markDoneForToday: vi.fn().mockResolvedValue(undefined),
}));

const memo = {
  id: 1,
  slug_title: 'focus-item',
  title: 'Focus item',
  description: 'Description',
  thumbnail_image: null,
  modified_at: '2026-10-17T00:00:00Z',
};
const doneMemo = {
  ...memo,
  id: 2,
  slug_title: 'done-item',
  title: 'Done item',
};

vi.mock('./useMemoBrowsing', () => ({
  useMemoBrowsing: () => ({
    memos: [memo],
    isLoading: false,
    bookmarkedMemoIds: [],
    isFocusFilter: true,
    doneTodayMemoSlugs: new Set(['done-item']),
    recentMemos: [memo, doneMemo],
    limitedRecentMemos: [memo, doneMemo],
    limitedActiveFocusMemos: [memo],
    limitedDoneTodayFocusMemos: [doneMemo],
    hasMoreRecentMemos: false,
    headingLabel: 'Focus',
    headingIcon: 'carbon:pin-filled',
    emptyLabel: 'No focus memos',
    loadMore: vi.fn(),
  }),
}));

vi.mock('~/resources/command', () => ({
  command: {
    focusDailyState: { clearDoneForToday, markDoneForToday },
  },
}));

vi.mock('~/app/features/search', () => ({
  SearchPalette: { template: '<div />' },
}));

const LayoutStub = defineComponent({
  template: '<div><slot name="main" /><slot name="actions" /></div>',
});

const FrameStub = defineComponent({
  template: '<div><slot /></div>',
});

const LinkStub = defineComponent({
  props: { to: { type: String, required: true } },
  template: '<a :href="to"><slot /></a>',
});

const ButtonStub = defineComponent({
  inheritAttrs: false,
  props: { icon: { type: String, required: true } },
  emits: ['click'],
  template: '<button v-bind="$attrs" @click="$emit(\'click\', $event)" />',
});

describe('MemoBrowsing Focus view', () => {
  beforeEach(() => {
    markDoneForToday.mockClear();
    clearDoneForToday.mockClear();
    vi.stubGlobal('computed', computed);
    vi.stubGlobal('ref', ref);
    vi.stubGlobal('useRoute', () => ({
      path: '/workspace/_focus',
      params: { workspace: 'workspace' },
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders and runs Done for today from the actual Focus page path', async () => {
    const wrapper = mount(MemoBrowsing, {
      global: {
        mocks: { truncateString: (value: string) => value },
        stubs: {
          NuxtLayout: LayoutStub,
          AppButton: true,
          AppPageFrame: FrameStub,
          AppPageHeader: true,
          IconButton: ButtonStub,
          MemoThumbnail: true,
          NuxtLink: LinkStub,
          SearchPalette: true,
        },
      },
    });

    await wrapper.get('[aria-label="Done for today"]').trigger('click');
    await wrapper.get('[aria-label="Undo done for today"]').trigger('click');

    expect(wrapper.get('.memo-browsing-done-heading').text()).toBe('Done for today');
    expect(wrapper.findAll('ul')).toHaveLength(2);
    expect(markDoneForToday).toHaveBeenCalledWith('workspace', 'focus-item');
    expect(clearDoneForToday).toHaveBeenCalledWith('workspace', 'done-item');
  });

  it('aligns the done heading with the text inside memo cards', () => {
    const browsingSource = readFileSync(resolve(process.cwd(), 'src/app/features/memo-browsing/view/memo-browsing/MemoBrowsing.vue'), 'utf8');
    const thumbnailSource = readFileSync(resolve(process.cwd(), 'src/app/features/memo-browsing/view/memo-browsing/MemoThumbnail.vue'), 'utf8');

    expect(thumbnailSource).toMatch(/header: 'px-3 /);
    expect(browsingSource).toMatch(/\.memo-browsing-done-heading\s*{[^}]*padding-inline-start: 0\.75rem;/s);
  });
});
