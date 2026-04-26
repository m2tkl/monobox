import { Extension } from '@tiptap/core';
import { MarkdownParser } from '@tiptap/pm/markdown';
import { Fragment, Slice, type Schema } from '@tiptap/pm/model';
import { Plugin } from '@tiptap/pm/state';
import MarkdownIt from 'markdown-it';

import type Token from 'markdown-it/lib/token.mjs';

type ParseSpec = ConstructorParameters<typeof MarkdownParser>[2][string];

function listIsTight(tokens: readonly Token[], i: number) {
  while (++i < tokens.length) {
    if (tokens[i].type !== 'list_item_open') return tokens[i].hidden;
  }
  return false;
}

function createMarkdownParser(schema: Schema) {
  const tokenizer = MarkdownIt('commonmark', { html: false, linkify: true });
  const tokens: Record<string, ParseSpec> = {
    blockquote: { block: 'blockquote' },
    paragraph: { block: 'paragraph' },
    list_item: { block: 'listItem' },
    bullet_list: { block: 'bulletList', getAttrs: (_, tokenStream, i) => ({ tight: listIsTight(tokenStream, i) }) },
    ordered_list: {
      block: 'orderedList',
      getAttrs: (token, tokenStream, i) => ({
        start: Number(token.attrGet('start') ?? '1') || 1,
        tight: listIsTight(tokenStream, i),
      }),
    },
    heading: { block: 'heading', getAttrs: token => ({ level: Number(token.tag.slice(1)) || 1, id: null }) },
    code_block: { block: 'codeBlock', noCloseToken: true },
    fence: { block: 'codeBlock', noCloseToken: true, getAttrs: token => ({ language: token.info.trim(), name: '', refresh: 0 }) },
    hr: { node: 'horizontalRule' },
    image: {
      node: 'image',
      getAttrs: token => ({
        src: token.attrGet('src'),
        alt: token.content || token.attrGet('alt') || '',
        title: token.attrGet('title') || null,
      }),
    },
    hardbreak: { node: 'hardBreak' },
    em: { mark: 'italic' },
    strong: { mark: 'bold' },
    link: {
      mark: 'link',
      getAttrs: token => ({
        href: token.attrGet('href'),
        title: token.attrGet('title') || null,
      }),
    },
    code_inline: { mark: 'code', noCloseToken: true },
  };

  return new MarkdownParser(schema, tokenizer, tokens);
}

const markdownPatterns = [
  /^(#{1,6})\s+\S/m,
  /^>\s+\S/m,
  /^```[\w+-]*\n[\s\S]*\n```/m,
  /^~~~[\w+-]*\n[\s\S]*\n~~~/m,
  /^\s*[-*+]\s+\S/m,
  /^\s*\d+\.\s+\S/m,
  /!\[[^\]]*]\([^)]+\)/,
  /\[[^\]]+]\([^)]+\)/,
  /(^|[^\w])(\*\*|__)[^\n]+(\*\*|__)(?=$|[^\w])/,
  /(^|[^\w])(_|\*)[^\n]+(_|\*)(?=$|[^\w])/,
  /(^|[^\w])~~[^\n]+~~(?=$|[^\w])/,
  /(^|\n)---(\n|$)/,
];

export function looksLikeMarkdown(text: string): boolean {
  const normalized = text.trim();
  if (!normalized) return false;

  return markdownPatterns.some(pattern => pattern.test(normalized));
}

export function parseMarkdownToSlice(schema: Schema, text: string): Slice {
  const parser = createMarkdownParser(schema);
  const doc = parser.parse(text);
  return new Slice(Fragment.from(doc.content), 0, 0);
}

export const markdownPasteExtension = Extension.create({
  name: 'markdownPaste',

  addProseMirrorPlugins() {
    const schema = this.editor.schema;

    return [
      new Plugin({
        props: {
          handlePaste(view, event) {
            const clipboardData = event.clipboardData;
            if (!clipboardData) return false;

            if (clipboardData.files.length > 0) return false;

            const html = clipboardData.getData('text/html');
            if (html) return false;

            const text = clipboardData.getData('text/plain');
            if (!looksLikeMarkdown(text)) return false;

            try {
              const slice = parseMarkdownToSlice(schema, text);
              view.dispatch(view.state.tr.replaceSelection(slice));
              return true;
            }
            catch {
              return false;
            }
          },
        },
      }),
    ];
  },
});
