import { EditorContent } from '@tiptap/vue-3';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, h, nextTick, onBeforeUnmount, ref } from 'vue';

import { useMemoEditor } from './useMemoEditor';

import type { NodeViewProps } from '@tiptap/vue-3';
import type { Component } from 'vue';

import { buildExtensions, CodeBlockComponent, TableComponent } from '~/app/features/editor';

const flushEditorMount = async () => {
  await nextTick();
  await new Promise(resolve => setTimeout(resolve, 0));
  await nextTick();
  await new Promise(resolve => setTimeout(resolve, 0));
};

describe('useMemoEditor', () => {
  const iconKeys = {
    copy: 'copy',
    success: 'success',
    failed: 'failed',
  };

  beforeEach(() => {
    vi.stubGlobal('iconKey', iconKeys);
    vi.stubGlobal('useToast', () => ({
      add: vi.fn(),
    }));
    vi.stubGlobal('ref', ref);
    vi.stubGlobal('computed', computed);
    vi.stubGlobal('defineComponent', defineComponent);
    vi.stubGlobal('scrollToElementWithOffset', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not report content changes when a memo with a code block is only mounted', async () => {
    const onChanged = vi.fn();
    let state: ReturnType<typeof useMemoEditor>;

    const content = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'codeBlock',
          attrs: {
            language: 'ts',
            name: '',
            refresh: 0,
          },
          content: [{ type: 'text', text: 'const value = 1;' }],
        },
      ],
    });

    const TestComponent = defineComponent({
      setup() {
        state = useMemoEditor(content, {
          extensions: buildExtensions({
            CodeBlockComponent: CodeBlockComponent as Component<NodeViewProps>,
            TableComponent: TableComponent as Component<NodeViewProps>,
          }),
          onChanged,
          route: {
            hash: '',
            path: '/workspace/memo',
            query: {},
          } as never,
          router: {
            replace: vi.fn(),
            push: vi.fn(),
          } as never,
        });

        onBeforeUnmount(() => {
          state.editor.value?.destroy();
        });

        return () => h('div', [
          h('div', { id: 'main' }),
          h(EditorContent, { editor: state.editor.value }),
        ]);
      },
    });

    const wrapper = mount(TestComponent, {
      attachTo: document.body,
      global: {
        components: {
          AppButton: defineComponent({
            setup(_, { slots }) {
              return () => h('button', slots.default?.());
            },
          }),
          AppInput: defineComponent({
            props: {
              modelValue: {
                type: String,
                default: '',
              },
            },
            emits: ['update:modelValue'],
            setup() {
              return () => h('input');
            },
          }),
        },
        mocks: {
          iconKey: iconKeys,
        },
      },
    });

    await flushEditorMount();

    expect(state!.editor.value?.getJSON().content?.[0]).toMatchObject({
      type: 'codeBlock',
    });
    expect(onChanged).not.toHaveBeenCalled();

    wrapper.unmount();
  });
});
