import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, ref, toRef, toRefs, watch } from 'vue';

import SearchPalette from './SearchPalette.vue';

type SearchPaletteExposed = {
  openCommandPalette: (initialTerm?: string) => void;
};

const { openManagedFile } = vi.hoisted(() => ({ openManagedFile: vi.fn(async () => {}) }));

vi.mock('~/resources/command', () => ({ command: { file: { openManagedFile } } }));
vi.mock('./usePaletteSearchSources', () => ({
  usePaletteSearchSources: (options: { fullTextResults: { value: unknown[] }; files: { value: unknown[] } }) => {
    options.fullTextResults.value = [{
      id: 1, slug_title: 'memo', title: 'Different title', modified_at: '',
      description: 'Unrelated summary', snippet: '…the body contains the matched phrase…',
    }];
    options.files.value = [{
      id: 'file-1', type: 'local_file', display_name: 'Report.pdf', imported_at: '', related_memo_count: 0,
    }];
    return { isLoading: ref(false), error: ref('') };
  },
}));

const ModalStub = defineComponent({
  props: ['open'],
  template: '<div v-if="open" class="modal-stub"><slot name="content" /></div>',
});
// CommandPalette's default rendering shows labels, but does not render description.
const CommandPaletteStub = defineComponent({
  props: ['groups'],
  emits: ['update:modelValue'],
  template: '<div><div v-for="group in groups"><button v-for="item in group.items" class="result" @click="$emit(\'update:modelValue\', item)"><slot name="item-label" :item="item">{{ item.label }}</slot><slot name="item-trailing" :item="item" /></button></div></div>',
});

describe('Full text result rendering', () => {
  beforeEach(() => {
    vi.stubGlobal('ref', ref);
    vi.stubGlobal('computed', computed);
    vi.stubGlobal('toRef', toRef);
    vi.stubGlobal('toRefs', toRefs);
    vi.stubGlobal('watch', watch);
    vi.stubGlobal('useToast', () => ({ add: vi.fn() }));
    vi.stubGlobal('useRouter', () => ({ push: vi.fn() }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('shows the body match underneath the title in the actual palette view', async () => {
    const wrapper = mount(SearchPalette, {
      props: { type: 'search', workspaceSlug: 'workspace', memos: [], shortcutSymbol: 'k', searchModes: true },
      global: {
        stubs: { UModal: ModalStub, UCommandPalette: CommandPaletteStub, FileInspectorDialog: true },
        mocks: { iconKey: { search: 'search' } },
      },
    });
    (wrapper.vm as unknown as SearchPaletteExposed).openCommandPalette('matched phrase');
    await wrapper.vm.$nextTick();
    await wrapper.get('[role="tablist"]').findAll('button')[1]!.trigger('click');
    const result = wrapper.get('.result');
    expect(result.text()).toContain('Different title');
    expect(result.text()).toContain('the body contains the matched phrase');
    expect(result.text()).not.toContain('Unrelated summary');
    expect(result.get('.full-text-result').classes()).toEqual(expect.arrayContaining(['w-full', 'text-left']));
    expect(result.get('.full-text-result__title').attributes('style')).toContain('color: var(--color-text-primary)');
    wrapper.unmount();
  });

  it('offers file information without changing the primary file action', async () => {
    const wrapper = mount(SearchPalette, {
      props: { type: 'search', workspaceSlug: 'workspace', memos: [], shortcutSymbol: 'k', searchModes: true },
      global: {
        stubs: { UModal: ModalStub, UCommandPalette: CommandPaletteStub, FileInspectorDialog: true },
        mocks: { iconKey: { search: 'search' } },
      },
    });
    (wrapper.vm as unknown as SearchPaletteExposed).openCommandPalette();
    await wrapper.vm.$nextTick();
    await wrapper.get('[role="tablist"]').findAll('button')[2]!.trigger('click');
    const action = wrapper.get('.file-info-action');
    expect(action.attributes('data-file-id')).toBe('file-1');
    expect(action.attributes('aria-label')).toContain('Report.pdf');
    wrapper.unmount();
  });

  it('executes a file without creating app navigation', async () => {
    const wrapper = mount(SearchPalette, {
      props: { type: 'search', workspaceSlug: 'workspace', memos: [], shortcutSymbol: 'k', searchModes: true },
      global: {
        stubs: { UModal: ModalStub, UCommandPalette: CommandPaletteStub, FileInspectorDialog: true },
        mocks: { iconKey: { search: 'search' } },
      },
    });

    (wrapper.vm as unknown as SearchPaletteExposed).openCommandPalette();
    await wrapper.vm.$nextTick();
    await wrapper.get('[role="tablist"]').findAll('button')[2]!.trigger('click');
    await wrapper.get('.result').trigger('click');
    await Promise.resolve();

    expect(openManagedFile).toHaveBeenCalledWith('file-1');
    expect(wrapper.emitted('navigate')).toBeUndefined();
    expect(wrapper.find('.modal-stub').exists()).toBe(false);
    wrapper.unmount();
  });
});
