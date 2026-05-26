import { MarkdownSerializer, defaultMarkdownSerializer } from '@tiptap/pm/markdown';

import type { Node } from '@tiptap/pm/model';

function escapeTableCellText(text: string): string {
  return text
    .replaceAll('|', '\\|')
    .replaceAll('\n', '<br>');
}

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
    table(state, node) {
      const rows = node.content.content;
      const explicitHeaderRow = rows.find(row => row.type.name === 'tableRow'
        && row.childCount > 0
        && Array.from({ length: row.childCount }).every((_, index) => row.child(index).type.name === 'tableHeader'));

      const columnCount = rows.reduce((max, row) => Math.max(max, row.childCount), 0);
      const headerSourceRow = explicitHeaderRow ?? rows[0] ?? null;
      const fallbackHeader = Array.from({ length: columnCount }, () => ' ');
      const header = headerSourceRow
        ? Array.from({ length: columnCount }, (_, index) => escapeTableCellText(headerSourceRow.maybeChild(index)?.textContent ?? ' '))
        : fallbackHeader;

      state.write(`| ${header.join(' | ')} |\n`);
      state.write(`| ${Array.from({ length: columnCount }, () => '---').join(' | ')} |\n`);

      rows.forEach((row) => {
        if (row === headerSourceRow) {
          return;
        }

        const cells = Array.from({ length: columnCount }, (_, index) => {
          const cell = row.maybeChild(index);
          return escapeTableCellText(cell?.textContent ?? '');
        });

        state.write(`| ${cells.join(' | ')} |\n`);
      });

      state.closeBlock(node);
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
    fileLink: {
      open: '',
      close: '',
      mixable: false,
      expelEnclosingWhitespace: false,
    },
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
