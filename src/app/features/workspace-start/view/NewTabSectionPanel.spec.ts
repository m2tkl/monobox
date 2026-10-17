import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import NewTabSectionPanel from './NewTabSectionPanel.vue';

import MemoCards from '~/app/features/memo-browsing/view/memo-browsing/MemoCards.vue';

const memo = (id: number) => ({
  id,
  slug_title: `memo-${id}`,
  title: `Memo ${id}`,
  description: `Description ${id}`,
  thumbnail_image: `/images/${id}.png`,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  modified_at: '2026-01-01',
});

describe('NewTabSectionPanel', () => {
  it('uses the memo browsing page size as the Recent display limit', () => {
    const memos = Array.from({ length: 65 }, (_, index) => memo(index + 1));
    const wrapper = shallowMount(NewTabSectionPanel, {
      props: {
        section: { key: 'recent', label: 'Recent', items: memos },
        workspaceSlug: 'workspace',
        compactItemLimit: 6,
        bookmarkedMemoIds: [2],
      },
      global: {
        stubs: { NuxtLink: { template: '<a><slot /></a>' } },
      },
    });

    expect(wrapper.classes()).toContain('new-tab-section--recent');
    expect(wrapper.findComponent(MemoCards).props('memos')).toEqual(memos.slice(0, 64));
    expect(wrapper.findComponent(MemoCards).props('bookmarkedMemoIds')).toEqual([2]);
    expect(wrapper.find('.new-tab-section__header').exists()).toBe(true);
    expect(wrapper.find('.new-tab-section__list').exists()).toBe(false);
  });

  it('keeps non-Recent sections in the compact list presentation', () => {
    const wrapper = shallowMount(NewTabSectionPanel, {
      props: {
        section: { key: 'focus', label: 'Focus', items: [memo(1)] },
        workspaceSlug: 'workspace',
        compactItemLimit: 6,
      },
      global: {
        stubs: { NuxtLink: { template: '<a><slot /></a>' } },
      },
    });

    expect(wrapper.findComponent(MemoCards).exists()).toBe(false);
    expect(wrapper.find('.new-tab-section__list').exists()).toBe(true);
  });
});
