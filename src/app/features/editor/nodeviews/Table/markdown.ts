import type { Node } from '@tiptap/pm/model';

import { convertEditorJsonToHtml } from '~/app/features/editor/serializer/html';
import { convertToMarkdown } from '~/app/features/editor/serializer/markdown';

export function serializeTableNodeToMarkdown(node: Node): string {
  const doc = node.type.schema.topNodeType.create(null, [node]);
  return convertToMarkdown(doc).trimEnd();
}

export function serializeTableNodeToHtml(node: Node): string {
  const doc = node.type.schema.topNodeType.create(null, [node]);
  return convertEditorJsonToHtml(doc.toJSON());
}
