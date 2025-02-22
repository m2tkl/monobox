import { MarkdownSerializer, defaultMarkdownSerializer } from '@tiptap/pm/markdown';

import type { Editor } from '@tiptap/core';
import type { Node } from '@tiptap/pm/model';

export const customMarkdownSerializer = new MarkdownSerializer(
  {
    ...defaultMarkdownSerializer.nodes,
    /**
     * Adjust the heading levels for output
     */
    heading(state, node) {
      const adjustedLevel = Math.min(node.attrs.level + 1, 6);
      state.write(`${'#'.repeat(adjustedLevel)} `);
      state.renderInline(node);
      state.closeBlock(node);
    },
    hardBreak(state, _node) {
      state.write('  \n');
    },
    codeBlock(state, node) {
      // Get code block language and add ```{extension}
      const language = node.attrs.language || '';
      state.write(`\`\`\`${language}\n`);

      // Write code block text
      state.text(node.textContent, false);

      // Close code block
      state.write('\n```');
      state.closeBlock(node);
    },
    bulletList(state, node) {
      state.renderList(node, '  ', () => '- ');
    },
    orderedList(state, node) {
      state.renderList(node, '  ', index => `${index + 1}. `);
    },
    listItem(state, node) {
      state.renderInline(node);
      state.ensureNewLine();
    },
    taskList(state, node) {
      node.forEach((child, _, index) => {
        state.render(child, node, index);
      });
    },
    taskItem(state, node) {
      const checked = node.attrs.checked ? 'x' : ' ';
      state.write(`- [${checked}] `);
      state.renderInline(node);
      state.ensureNewLine();
    },
    horizontalRule(state, _node) {
      state.write('\n---\n');
      state.closeBlock(_node);
    },
  },
  {
    ...defaultMarkdownSerializer.marks,
    bold: {
      open: '**',
      close: '**',
      mixable: true,
      expelEnclosingWhitespace: true,
    },
    italic: {
      open: '_',
      close: '_',
      mixable: true,
      expelEnclosingWhitespace: true,
    },
    strike: {
      open: '~~',
      close: '~~',
      mixable: true,
      expelEnclosingWhitespace: true,
    },
  },
);

export const convertToMarkdown = (node: Node, title?: string) => {
  const titleMarkdown = title ? `# ${title}\n\n` : '';
  const contentMarkdown = customMarkdownSerializer.serialize(node, { tightLists: true });

  const markdown = titleMarkdown + contentMarkdown;
  return markdown;
};

export const copyAsMarkdown = async (editor: Editor, title: string) => {
  const markdown = convertToMarkdown(editor.state.doc, title);
  await navigator.clipboard.writeText(markdown);
};

export const copySelectedAsMarkdown = async (editor: Editor) => {
  const { from, to } = editor.state.selection;
  const selectedContent = editor.state.doc.cut(from, to);

  const markdown = convertToMarkdown(selectedContent);
  await navigator.clipboard.writeText(markdown);
};
