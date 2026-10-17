import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppSearchCategories from './AppSearchCategories.vue';

describe('search categories', () => {
  it('cycles with arrows and moves keyboard focus with the selection', async () => {
    const wrapper = mount(AppSearchCategories, {
      attachTo: document.body,
      props: {
        modelValue: 'memos',
        items: [{ value: 'memos', label: 'Memos' }, { value: 'full-text', label: 'Full text' }, { value: 'files', label: 'Files' }],
      },
    });
    const buttons = wrapper.findAll('button');
    await buttons[0]!.trigger('keydown', { key: 'ArrowLeft' });
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['files']);
    expect(document.activeElement).toBe(buttons[2]!.element);
    await buttons[2]!.trigger('keydown', { key: 'ArrowRight' });
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual(['memos']);
    wrapper.unmount();
  });
});
