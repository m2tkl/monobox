import Link from '@tiptap/extension-link';
import StarterKit from '@tiptap/starter-kit';
import { Editor as VueEditor } from '@tiptap/vue-3';
import { describe, it, expect } from 'vitest';

import * as Action from './action';
import { headingExtension } from '../extensions/heading';
import { buildExtensions, EditorDoc } from '~/app/features/editor';

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
        {
          type: 'paragraph', content: [
            { type: 'text', text: 'site', marks: [{ type: 'link', attrs: { href: 'https://example.com' } }] },
          ]
        },
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

  it('does not consume undo history when target is normalized after inserting an external link', () => {
    const editor = new VueEditor({
      extensions: [StarterKit, Link],
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
      onTransaction: ({ editor, transaction }) => {
        if (!transaction.docChanged) return;
        Action.applyTargetBlankToExternalLinks(editor as unknown as CoreEditor);
      },
    });

    editor.commands.setTextSelection({ from: 1, to: 1 });
    editor.commands.insertContent({
      type: 'text',
      text: 'example',
      marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
    });

    let linkMark = editor.getJSON().content?.[0]?.content?.[0]?.marks?.find(m => m.type === 'link');
    expect(linkMark?.attrs?.target).toBe('_blank');

    editor.commands.undo();

    expect(editor.getText()).toBe('');
    linkMark = editor.getJSON().content?.[0]?.content?.[0]?.marks?.find(m => m.type === 'link');
    expect(linkMark).toBeUndefined();
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

  it('memo editor transaction pipeline keeps markdown paste undoable in one step', async () => {
    const editor = new VueEditor({
      extensions: buildExtensions({ CodeBlockComponent: {} as never }),
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
      onTransaction: async ({ editor, transaction }) => {
        if (!transaction.docChanged) return;

        Action.applyTargetBlankToExternalLinks(editor as unknown as CoreEditor);
        EditorDoc.getChangedLinks(transaction);
        Action.assignUniqueHeadingIds(editor as unknown as CoreEditor);
      },
    });

    const markdown = [
      'Go 1.22 以降の標準 net/http なら、ServeMux のパターンにワイルドカードを書いて、ハンドラ内で r.PathValue を使う方法が一番簡単です。Go 1.22 では ServeMux がメソッド付きパターンとワイルドカードに対応し、Request.PathValue でその値を取得できます。 (Go.dev)',
      '',
      'たとえば /jobs/{id} の id を受け取るなら、こう書きます。',
      '',
      '```go',
      'package main',
      '',
      'import (',
      '\t"encoding/json"',
      '\t"net/http"',
      ')',
      '```',
    ].join('\n');

    const event = {
      clipboardData: {
        files: { length: 0 },
        getData: (type: string) => {
          if (type === 'text/plain') return markdown;
          return '';
        },
      },
    } as unknown as ClipboardEvent;

    let handled = false;
    editor.view.someProp('handlePaste', (handlePaste) => {
      handled = handlePaste(editor.view, event);
      return handled;
    });

    expect(handled).toBe(true);

    let undoCount = 0;
    while (undoCount < 10 && editor.getText()) {
      editor.commands.undo();
      undoCount += 1;
    }

    expect(undoCount).toBe(1);
    expect(editor.getHTML()).toBe('<p></p>');
    editor.destroy();
  });
});
