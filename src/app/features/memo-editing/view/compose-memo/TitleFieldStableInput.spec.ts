import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';

import TitleFieldStableInput from './TitleFieldStableInput.vue';

function createPasteEvent(textPlain: string, textHtml: string) {
  const event = new Event('paste', { bubbles: true, cancelable: true });

  Object.defineProperty(event, 'clipboardData', {
    value: {
      getData: (type: string) => {
        if (type === 'text/plain') return textPlain;
        if (type === 'text/html') return textHtml;
        return '';
      },
    },
  });

  return event;
}

describe('TitleFieldStableInput', () => {
  beforeEach(() => {
    vi.stubGlobal('ref', ref);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('pastes clipboard HTML as plain text', async () => {
    const title = ref('Memo');
    const TestComponent = defineComponent({
      setup() {
        return () =>
          h(TitleFieldStableInput, {
            'modelValue': title.value,
            'onUpdate:modelValue': (value: string) => {
              title.value = value;
            },
          });
      },
    });

    const wrapper = mount(TestComponent, {
      attachTo: document.body,
    });
    const titleField = wrapper.get('[contenteditable="true"]');

    titleField.element.dispatchEvent(createPasteEvent('<strong>Unsafe</strong>', '<strong>Unsafe</strong>'));
    await nextTick();

    expect(title.value).toBe('Memo<strong>Unsafe</strong>');
    expect(titleField.element.textContent).toBe('Memo<strong>Unsafe</strong>');
    expect(titleField.element.querySelector('strong')).toBeNull();

    wrapper.unmount();
  });
});
