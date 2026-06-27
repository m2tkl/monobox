import { Editor } from '@tiptap/core';
import { Fragment, Slice } from '@tiptap/pm/model';
import { describe, expect, it } from 'vitest';

import { looksLikeMarkdown, parseMarkdownToSlice, shouldHandleMarkdownPaste } from './markdown-paste';

import { buildExtensions } from '~/app/features/editor';

describe('editor/extensions/markdown-paste', () => {
  const createEditor = () => new Editor({
    extensions: buildExtensions({ CodeBlockComponent: {} as never }),
    content: '',
  });

  it('detects markdown-like pasted text', () => {
    expect(looksLikeMarkdown('# Title\n\n- item')).toBe(true);
    expect(looksLikeMarkdown('**bold** text')).toBe(true);
    expect(looksLikeMarkdown('| Name | Role |\n| --- | --- |\n| Ada | Admin |')).toBe(true);
    expect(looksLikeMarkdown('just a normal sentence')).toBe(false);
  });

  it('parses markdown into tiptap-compatible nodes', () => {
    const editor = createEditor();

    const slice = parseMarkdownToSlice(
      editor.schema,
      '# Title\n\n- item\n- **done**\n\n```ts\nconst a = 1;\n```',
    );

    expect(slice.content.toJSON()).toEqual([
      {
        type: 'heading',
        attrs: { id: null, level: 1 },
        content: [{ type: 'text', text: 'Title' }],
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'item' }] }],
          },
          {
            type: 'listItem',
            content: [{
              type: 'paragraph',
              content: [{ type: 'text', text: 'done', marks: [{ type: 'bold' }] }],
            }],
          },
        ],
      },
      {
        type: 'codeBlock',
        attrs: { language: 'ts', name: '', refresh: 0 },
        content: [{ type: 'text', text: 'const a = 1;' }],
      },
    ]);

    editor.destroy();
  });

  it('pastes a plain URL as a single undoable link insertion', () => {
    const editor = createEditor();
    const event = {
      clipboardData: {
        files: { length: 0 },
        getData: (type: string) => {
          if (type === 'text/plain') return 'https://example.com';
          return '';
        },
      },
    } as unknown as ClipboardEvent;

    let handled = false;
    editor.view.someProp('handlePaste', (handlePaste) => {
      handled = !!handlePaste(editor.view, event, new Slice(Fragment.empty, 0, 0));
      return handled;
    });

    expect(handled).toBe(true);
    expect(editor.getHTML()).toContain('href="https://example.com"');

    editor.commands.undo();

    expect(editor.getText()).toBe('');
    expect(editor.getHTML()).toBe('<p></p>');
    editor.destroy();
  });

  it('pastes markdown content as a single undoable insertion', () => {
    const editor = createEditor();
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
      handled = !!handlePaste(editor.view, event, new Slice(Fragment.empty, 0, 0));
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

  it('does not intercept html clipboard content', () => {
    expect(shouldHandleMarkdownPaste({
      hasFiles: false,
      hasHtml: true,
      isInCodeBlock: false,
      text: '# Title\n\n- item',
    })).toBe(false);
  });

  it('does not intercept markdown paste inside a code block', () => {
    expect(shouldHandleMarkdownPaste({
      hasFiles: false,
      hasHtml: false,
      isInCodeBlock: true,
      text: '# Title\n\n- item',
    })).toBe(false);
  });

  it('parses markdown tables into table nodes', () => {
    const editor = createEditor();

    const slice = parseMarkdownToSlice(
      editor.schema,
      '| Name | Role |\n| --- | --- |\n| Ada | Admin |',
    );

    expect(slice.content.toJSON()).toEqual([
      {
        type: 'table',
        attrs: { name: '' },
        content: [
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableHeader',
                attrs: { colspan: 1, rowspan: 1, colwidth: null },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Name' }] }],
              },
              {
                type: 'tableHeader',
                attrs: { colspan: 1, rowspan: 1, colwidth: null },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Role' }] }],
              },
            ],
          },
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableCell',
                attrs: { colspan: 1, rowspan: 1, colwidth: null },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Ada' }] }],
              },
              {
                type: 'tableCell',
                attrs: { colspan: 1, rowspan: 1, colwidth: null },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Admin' }] }],
              },
            ],
          },
        ],
      },
    ]);

    editor.destroy();
  });
});
