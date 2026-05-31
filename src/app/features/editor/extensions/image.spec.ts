import { invoke } from '@tauri-apps/api/core';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { describe, expect, it, vi } from 'vitest';

import { imageExtention } from './image';

vi.mock('../nodeviews/Image/Index.vue', () => ({
  default: {},
}));

vi.mock('~/utils/imageSrc', () => ({
  transformImageSrc: (src: string) => src,
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue('assets/pasted.png'),
}));

describe('editor/extensions/image', () => {
  const createEditor = () => new Editor({
    extensions: [StarterKit, imageExtention()],
    content: '',
  });

  const flushAsyncImageUpload = async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => setTimeout(resolve, 0));
  };

  it('serializes copied html for images without a figcaption wrapper', () => {
    const editor = createEditor();

    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'image',
          attrs: {
            src: 'assets/example.png',
            alt: 'image.png',
          },
        },
      ],
    });

    expect(editor.getHTML()).toBe('<img src="assets/example.png" alt="image.png">');

    editor.destroy();
  });

  it('does not use the pasted image file name as the default alt text', async () => {
    const editor = createEditor();
    const file = new File(['image'], 'image.png', { type: 'image/png' });
    const event = {
      clipboardData: {
        files: [file],
        getData: () => '',
      },
      preventDefault: vi.fn(),
    } as unknown as ClipboardEvent;

    editor.view.someProp('handleDOMEvents', (handlers) => {
      if (!handlers.paste) return false;
      handlers.paste(editor.view, event);
      return vi.mocked(event.preventDefault).mock.calls.length > 0;
    });
    await flushAsyncImageUpload();

    expect(event.preventDefault).toHaveBeenCalled();
    expect(invoke).toHaveBeenCalledWith('save_image', {
      args: {
        data: expect.any(String),
        mime_type: 'image/png',
      },
    });
    expect(editor.getJSON().content).toEqual([
      {
        type: 'image',
        attrs: {
          src: 'assets/pasted.png',
          alt: '',
          title: null,
        },
      },
    ]);

    editor.destroy();
  });
});
