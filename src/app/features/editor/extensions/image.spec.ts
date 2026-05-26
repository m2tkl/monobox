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

describe('editor/extensions/image', () => {
  const createEditor = () => new Editor({
    extensions: [StarterKit, imageExtention()],
    content: '',
  });

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
});
