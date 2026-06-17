import { afterEach, describe, it, expect, vi } from 'vitest';

import { buildStandaloneHtmlDocument, convertMemoToHtml, createHtmlLink, embedImagesAsDataUrls } from './converters';

import type { JSONContent } from '@tiptap/vue-3';

vi.mock('~/app/features/editor', () => ({
  convertEditorJsonToHtml: (json: JSONContent) =>
    (json.content ?? []).map((node) => {
      if (node.type !== 'paragraph') return '';
      return `<p>${(node.content ?? []).map(child => child.text ?? '').join('')}</p>`;
    }).join(''),
}));

vi.mock('~/external/tauri/command', () => ({
  command: {
    asset: {
      readImageAsDataUrl: vi.fn(async () => 'data:image/png;base64,aW1hZ2UtYnl0ZXM='),
    },
  },
}));

describe('memo/export - converters', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('convertMemoToHtml prepends h1 title then body html', () => {
    const json: JSONContent = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Body' }] },
      ],
    } as const;

    const html = convertMemoToHtml(json, 'MyTitle');
    expect(html.startsWith('<h1>MyTitle</h1>')).toBe(true);
    expect(html).toContain('<p>Body</p>');
  });

  it('createHtmlLink creates anchor tag', () => {
    const a = createHtmlLink('/path', 'Text');
    expect(a).toBe('<a href="/path">Text</a>');
  });

  it('embedImagesAsDataUrls replaces image src with data urls', async () => {
    const html = await embedImagesAsDataUrls('<p>Body</p><img src="asset://localhost/monobox/image.png" alt="Image">');

    expect(html).toContain('<img src="data:image/png;base64,aW1hZ2UtYnl0ZXM="');
    expect(html).toContain('alt="Image"');
  });

  it('buildStandaloneHtmlDocument creates a distributable html document', () => {
    const html = buildStandaloneHtmlDocument('<h1>Title</h1><p>Body</p>', 'Title & Memo');

    expect(html).toContain('<!doctype html>');
    expect(html).toContain('<title>Title &amp; Memo</title>');
    expect(html).toContain('<h1>Title</h1><p>Body</p>');
  });
});
