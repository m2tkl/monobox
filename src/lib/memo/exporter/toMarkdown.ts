import type { Node } from '@tiptap/pm/model';

import { customMarkdownSerializer } from '~/app/features/editor';

export const convertToMarkdown = (node: Node, title?: string) => {
  const titleMarkdown = title ? `# ${title}\n\n` : '';
  const contentMarkdown = customMarkdownSerializer.serialize(node, { tightLists: true });

  const markdown = titleMarkdown + contentMarkdown;
  return markdown;
};
