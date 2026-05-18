import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import StarterKit from '@tiptap/starter-kit';
import { Editor as VueEditor } from '@tiptap/vue-3';
import { describe, it, expect } from 'vitest';

import { findHeadImage, getChangedLinks } from './doc';

import type { Transaction } from '@tiptap/pm/state';
import type { JSONContent } from '@tiptap/vue-3';

function createEditor(content: JSONContent) {
  return new VueEditor({
    extensions: [StarterKit, Link, Image],
    content,
  });
}

describe('editor/core/doc', () => {
  it('findHeadImage returns the first image src in the document', () => {
    const editor = createEditor({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] },
        { type: 'image', attrs: { src: '/first.png' } },
        { type: 'image', attrs: { src: '/second.png' } },
      ],
    });

    const transaction = { doc: editor.state.doc } as unknown as Transaction;
    expect(findHeadImage(transaction)).toBe('/first.png');
    editor.destroy();
  });

  it('getChangedLinks detects added and deleted internal links', () => {
    const beforeEditor = createEditor({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [
          { type: 'text', text: 'Foo', marks: [{ type: 'link', attrs: { href: '/foo#1' } }] },
          { type: 'text', text: 'Keep', marks: [{ type: 'link', attrs: { href: '/keep' } }] },
          { type: 'text', text: 'External', marks: [{ type: 'link', attrs: { href: 'https://example.com' } }] },
        ] },
      ],
    });

    const afterEditor = createEditor({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [
          { type: 'text', text: 'Keep', marks: [{ type: 'link', attrs: { href: '/keep#changed' } }] },
          { type: 'text', text: 'Bar', marks: [{ type: 'link', attrs: { href: '/bar' } }] },
        ] },
      ],
    });

    const transaction = {
      before: beforeEditor.state.doc,
      doc: afterEditor.state.doc,
    } as unknown as Transaction;

    const { addedLinks, deletedLinks } = getChangedLinks(transaction);
    expect(addedLinks).toEqual(['/bar']);
    expect(deletedLinks).toEqual(['/foo']);

    beforeEditor.destroy();
    afterEditor.destroy();
  });

  it('getChangedLinks ignores heading links to the current memo', () => {
    const beforeEditor = createEditor({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Body' }] },
      ],
    });

    const afterEditor = createEditor({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [
          { type: 'text', text: 'Here', marks: [{ type: 'link', attrs: { href: '/workspace/current-memo#section-1' } }] },
          { type: 'text', text: 'There', marks: [{ type: 'link', attrs: { href: '/workspace/other-memo#section-2' } }] },
        ] },
      ],
    });

    const transaction = {
      before: beforeEditor.state.doc,
      doc: afterEditor.state.doc,
    } as unknown as Transaction;

    const { addedLinks, deletedLinks } = getChangedLinks(transaction, '/workspace/current-memo');
    expect(addedLinks).toEqual(['/workspace/other-memo']);
    expect(deletedLinks).toEqual([]);

    beforeEditor.destroy();
    afterEditor.destroy();
  });
});
