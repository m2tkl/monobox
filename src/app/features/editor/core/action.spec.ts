import Link from '@tiptap/extension-link';
import StarterKit from '@tiptap/starter-kit';
import { Editor as VueEditor } from '@tiptap/vue-3';
import { describe, it, expect } from 'vitest';

import * as Action from './action';
import { headingExtension } from '../extensions/heading';

import type { Editor as CoreEditor } from '@tiptap/core';
import type { Level } from '@tiptap/extension-heading';
import type { JSONContent } from '@tiptap/vue-3';

// Helper to create a basic editor instance
function createEditor(content?: JSONContent) {
  const editor = new VueEditor({
    extensions: [StarterKit, Link],
    content: content ?? { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }] },
  });
  return editor;
}

describe('editor/core/action', () => {
  it('setLink/unsetLink sets link target by internal/external and removes mark', () => {
    const editor = createEditor();
    editor.chain().selectAll().run();

    // Internal link → target should be null
    Action.setLink(editor, '/internal');
    expect(editor.getAttributes('link').href).toBe('/internal');
    expect(editor.getAttributes('link').target ?? null).toBeNull();

    // External link → target should be _blank
    Action.setLink(editor, 'https://example.com');
    expect(editor.getAttributes('link').href).toBe('https://example.com');
    expect(editor.getAttributes('link').target).toBe('_blank');

    // Unset link
    Action.unsetLink(editor);
    expect(editor.isActive('link')).toBe(false);
    editor.destroy();
  });

  it('toggleHeading/style/list/blockquote/code/resetStyle work as expected', () => {
    const editor = createEditor();
    editor.commands.setTextSelection({ from: 2, to: 2 }); // place caret inside text

    // heading h2
    const h2: Level = 2;
    Action.toggleHeading(editor, { h: h2 });
    expect(editor.isActive('heading', { level: 2 })).toBe(true);

    // bold mark
    Action.toggleStyle(editor, 'bold');
    expect(editor.isActive('bold')).toBe(true);
    // toggle off
    Action.toggleStyle(editor, 'bold');
    expect(editor.isActive('bold')).toBe(false);

    // bullet list
    Action.toggleBulletList(editor);
    expect(editor.isActive('bulletList')).toBe(true);
    // ordered list (switch)
    Action.toggleOrderedList(editor);
    expect(editor.isActive('orderedList')).toBe(true);

    // blockquote wrap/lift
    editor.chain().clearNodes().run();
    Action.toggleBlockQuote(editor);
    expect(editor.isActive('blockquote')).toBe(true);
    Action.toggleBlockQuote(editor);
    expect(editor.isActive('blockquote')).toBe(false);

    // code mark
    Action.toggleCode(editor);
    expect(editor.isActive('code')).toBe(true);

    // clear
    Action.resetStyle(editor);
    expect(editor.isActive('bold')).toBe(false);
    expect(editor.isActive('code')).toBe(false);
    editor.destroy();
  });

  it('insertLinkToMemo inserts link text and unsets link mark afterwards', () => {
    const editor = createEditor({ type: 'doc', content: [{ type: 'paragraph' }] });
    editor.commands.setTextSelection({ from: 1, to: 1 });

    Action.insertLinkToMemo(editor, 'Foo', '/internal');

    const html = editor.getHTML();
    expect(html).toContain('<a');
    expect(html).toContain('href="/internal"');

    // Next input should not be linked
    editor.commands.insertContent('X');
    const after = editor.getHTML();
    expect(after).toMatch(/Foo<\/a>.*X/);
    editor.destroy();
  });

  it('applyTargetBlankToExternalLinks adds target="_blank" to external links', () => {
    const editor = createEditor({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [
          { type: 'text', text: 'site', marks: [{ type: 'link', attrs: { href: 'https://example.com' } }] },
        ] },
      ],
    });

    Action.applyTargetBlankToExternalLinks(editor as unknown as CoreEditor);

    const json = editor.getJSON();
    const paragraph = json.content?.[0];
    const textNode = paragraph?.content?.[0];
    const linkMark = textNode?.marks?.find(m => m.type === 'link');
    expect(linkMark?.attrs?.target).toBe('_blank');
    editor.destroy();
  });

  it('assignUniqueHeadingIds assigns ids to headings without id', () => {
    // Use custom heading extension that supports id attribute
    const editor = new VueEditor({
      extensions: [StarterKit.configure({ heading: false }), headingExtension()],
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'A' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'B' }] },
        ],
      },
    });

    Action.assignUniqueHeadingIds(editor as unknown as CoreEditor);
    const json = editor.getJSON();
    const h1 = json.content?.[0];
    const h2 = json.content?.[1];
    expect(typeof h1?.attrs?.id).toBe('string');
    expect((h1?.attrs?.id as string).length).toBeGreaterThan(0);
    expect(typeof h2?.attrs?.id).toBe('string');
    expect((h2?.attrs?.id as string).length).toBeGreaterThan(0);
    expect(h1?.attrs?.id).not.toBe(h2?.attrs?.id);
    editor.destroy();
  });
});
