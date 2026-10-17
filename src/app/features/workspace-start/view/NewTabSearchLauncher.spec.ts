import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent } from 'vue';

import NewTabSearchLauncher from './NewTabSearchLauncher.vue';

const ButtonStub = defineComponent({
  inheritAttrs: false,
  emits: ['click', 'keydown'],
  template: '<button v-bind="$attrs" @click="$emit(\'click\', $event)" @keydown="$emit(\'keydown\', $event)"><slot /></button>',
});

describe('NewTabSearchLauncher', () => {
  it('opens the palette without providing a text input', async () => {
    const wrapper = mount(NewTabSearchLauncher, {
      global: { stubs: { AppButton: ButtonStub } },
    });

    expect(wrapper.find('input').exists()).toBe(false);
    expect(wrapper.get('button').classes()).toContain('justify-start');
    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('open')).toEqual([['']]);
  });

  it('passes an initial printable key directly to the palette', async () => {
    const wrapper = mount(NewTabSearchLauncher, {
      global: { stubs: { AppButton: ButtonStub } },
    });

    await wrapper.get('button').trigger('keydown', { key: 'a' });

    expect(wrapper.emitted('open')).toEqual([['a']]);
  });
});
