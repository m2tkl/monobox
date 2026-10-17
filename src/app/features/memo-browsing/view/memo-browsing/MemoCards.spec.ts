import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent } from 'vue';

import MemoCards from './MemoCards.vue';

const memo = {
  id: 1,
  slug_title: 'focus-item',
  title: 'Focus item',
  description: 'Description',
  thumbnail_image: null,
  modified_at: '2026-10-16T00:00:00Z',
};
const doneMemo = {
  ...memo,
  id: 2,
  slug_title: 'done-item',
  title: 'Done item',
};

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

describe('MemoCards', () => {
  beforeEach(() => {
    vi.stubGlobal('computed', computed);
    vi.stubGlobal('truncateString', (value: string) => value);
    vi.stubGlobal('useRoute', () => ({ params: { workspace: 'workspace' } }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows a separate Done for today action for Focus items', async () => {
    const wrapper = mount(MemoCards, {
      props: {
        memos: [memo],
        showDoneForToday: true,
      },
      global: {
        mocks: { truncateString: (value: string) => value },
        stubs: {
          IconButton: ButtonStub,
          MemoThumbnail: true,
          NuxtLink: LinkStub,
        },
      },
    });

    const action = wrapper.get('[aria-label="Done for today"]');
    expect(wrapper.getComponent(ButtonStub).props('icon')).toBe('carbon:checkmark-outline');
    expect(action.element.closest('a')).toBeNull();
    expect(wrapper.getComponent({ name: 'MemoThumbnail' }).attributes('reservetoprightaction')).toBe('true');

    const source = readFileSync(resolve(process.cwd(), 'src/app/features/memo-browsing/view/memo-browsing/MemoCards.vue'), 'utf8');
    expect(source).toMatch(/\.memo-card-item :deep\(\.memo-card-done-action\)\s*{[^}]*top: 0\.5rem;/s);
    expect(source).not.toMatch(/memo-card-done-action[^}]*bottom:/s);

    await action.trigger('click');

    expect(wrapper.emitted('done-for-today')).toEqual([['focus-item']]);
  });

  it('does not show the action outside Focus', () => {
    const wrapper = mount(MemoCards, {
      props: { memos: [memo] },
      global: {
        mocks: { truncateString: (value: string) => value },
        stubs: {
          IconButton: ButtonStub,
          MemoThumbnail: true,
          NuxtLink: LinkStub,
        },
      },
    });

    expect(wrapper.find('[aria-label="Done for today"]').exists()).toBe(false);
  });

  it('distinguishes done items and offers Undo done for today', async () => {
    const wrapper = mount(MemoCards, {
      props: {
        memos: [memo, doneMemo],
        showDoneForToday: true,
        doneForTodayMemoSlugs: new Set(['done-item']),
      },
      global: {
        mocks: { truncateString: (value: string) => value },
        stubs: {
          IconButton: ButtonStub,
          MemoThumbnail: true,
          NuxtLink: LinkStub,
        },
      },
    });

    const doneItem = wrapper.get('.memo-card-item--done');
    const undoAction = doneItem.get('[aria-label="Undo done for today"]');
    expect(doneItem.getComponent(ButtonStub).props('icon')).toBe('carbon:renew');

    await undoAction.trigger('click');

    expect(wrapper.emitted('undo-done-for-today')).toEqual([['done-item']]);
  });

  it('keeps memo-card hover feedback immediate', () => {
    const utilities = readFileSync(resolve(process.cwd(), 'src/assets/css/modules/utilities.css'), 'utf8');
    const cards = readFileSync(resolve(process.cwd(), 'src/app/features/memo-browsing/view/memo-browsing/MemoCards.vue'), 'utf8');

    expect(utilities).toMatch(/\.card-interactive\s*{[^}]*transition: none;/s);
    expect(utilities).not.toMatch(/\.card-interactive\s*{[^}]*transition: all/s);
    expect(cards).toMatch(/memo-card-done-action[^}]*transition-duration: 60ms;/s);
  });

  it('resets list spacing so section headings and cards share a leading edge', () => {
    const wrapper = mount(MemoCards, {
      props: { memos: [memo] },
      global: {
        mocks: { truncateString: (value: string) => value },
        stubs: {
          IconButton: true,
          MemoThumbnail: true,
          NuxtLink: LinkStub,
        },
      },
    });

    expect(wrapper.get('ul').classes()).toEqual(expect.arrayContaining(['m-0', 'list-none', 'p-0']));
  });
});
