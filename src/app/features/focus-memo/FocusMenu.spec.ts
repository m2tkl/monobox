import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, ref, watch } from 'vue';

import FocusMenu from './FocusMenu.vue';

const focusItem = {
  id: 1,
  slug_title: 'focus-item',
  title: 'Focus item',
  modified_at: '2026-09-15T00:00:00Z',
};
const focusItems = ref([focusItem]);
const focusList = computed(() => ({
  data: {
    items: focusItems.value,
    activeItems: focusItems.value,
    doneTodayMemoSlugs: new Set<string>(),
  },
  flags: {
    isLoading: false,
    isStale: false,
    hasError: false,
  },
}));

vi.mock('~/app/features/memo-browsing', () => ({
  useFocusListReadModel: () => focusList,
}));

vi.mock('~/resources/command', () => ({
  command: {
    focusDailyState: {
      clearDoneForToday: vi.fn(),
      markDoneForToday: vi.fn(),
    },
    memo: {
      get: vi.fn().mockResolvedValue({ content: '{}' }),
    },
  },
}));

const PopoverStub = defineComponent({
  name: 'PopoverStub',
  props: {
    content: {
      type: Object,
      default: () => ({}),
    },
  },
  template: '<div><slot /><div class="popover-content"><slot name="content" /></div></div>',
});

const ButtonStub = defineComponent({
  inheritAttrs: false,
  template: '<button v-bind="$attrs"><slot /></button>',
});

describe('FocusMenu', () => {
  beforeEach(() => {
    focusItems.value = [focusItem];
    vi.stubGlobal('computed', computed);
    vi.stubGlobal('ref', ref);
    vi.stubGlobal('watch', watch);
    vi.stubGlobal('useRoute', () => ({
      params: { workspace: 'workspace', memo: 'current' },
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows a task icon beside the remaining count and renders Focus items in the popover', () => {
    const wrapper = mount(FocusMenu, {
      global: {
        stubs: {
          UPopover: PopoverStub,
          AppButton: ButtonStub,
          IconButton: ButtonStub,
          NuxtLink: ButtonStub,
          UIcon: true,
        },
      },
    });

    expect(wrapper.get('.focus-menu-count').text()).toBe('1');
    expect(wrapper.get('.focus-menu-trigger').attributes('icon')).toBe('carbon:task');
    expect(wrapper.get('.focus-menu-trigger').attributes('variant')).toBe('outline');
    expect(wrapper.get('.focus-menu-trigger').classes()).toContain('rounded-full');
    expect(wrapper.get('.focus-sidebar-title__icon').attributes('name')).toBe('carbon:task');
    expect(wrapper.get('.popover-content').text()).toContain('Focus item');
    expect(wrapper.find('.focus-sidebar-count').exists()).toBe(false);

    const openEvent = { preventDefault: vi.fn() };
    const content = wrapper.findComponent(PopoverStub).props('content') as {
      onOpenAutoFocus?: (event: { preventDefault: () => void }) => void;
    };
    content.onOpenAutoFocus?.(openEvent);
    expect(openEvent.preventDefault).toHaveBeenCalledOnce();
  });

  it('shows a completion icon instead of a zero count', () => {
    focusItems.value = [];
    const wrapper = mount(FocusMenu, {
      global: {
        stubs: {
          UPopover: PopoverStub,
          AppButton: ButtonStub,
          IconButton: ButtonStub,
          NuxtLink: ButtonStub,
          UIcon: true,
        },
      },
    });

    expect(wrapper.find('.focus-menu-count').exists()).toBe(false);
    expect(wrapper.get('.focus-menu-trigger').attributes('icon')).toBe('carbon:checkmark-outline');
  });
});
