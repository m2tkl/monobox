import type { Editor } from '@tiptap/core';
import type { Node } from '@tiptap/pm/model';
import type { EditorView } from '@tiptap/pm/view';
import type { JSONContent } from '@tiptap/vue-3';

/**
 * Return selected text in editor
 *
 * @param editorInstance Tiptap Editor instance
 * @returns
 */
export function getSelectedTextV2(editorView: EditorView): string {
  const { from, to } = editorView.state.selection;
  const selectedText = editorView.state.doc.textBetween(from, to, '');

  return selectedText;
}

export function getSelectedNode(editor: Editor): Node {
  const { from, to } = editor.state.selection;
  const selectedContent = editor.state.doc.cut(from, to);

  return selectedContent;
}

export function getHeadingTextById(json: JSONContent, id: string): string | null {
  const heading = json.content?.find(
    node =>
      node.type === 'heading'
      && node.attrs?.id === id
      && Array.isArray(node.content)
      && typeof node.content[0]?.text === 'string',
  );
  if (heading && heading.content) {
    if (heading.content.length > 0) {
      return heading.content[0].text || null;
    }
  }

  return null;
}

export const getLinkFromMouseClickEvent = (
  event: MouseEvent,
): string | undefined => {
  if (!event.target) {
    return;
  }

  const link = (event.target as HTMLElement).closest('a');
  if (!link) {
    return;
  }

  const url = link.getAttribute('href');
  if (!url) {
    return;
  }

  return url;
};

/**
 * Find the active heading ID based on the current cursor position in the editor
 *
 * First checks if the cursor is currently inside a heading node and returns its ID.
 * If not inside a heading, finds the most recent heading that appears before
 * the cursor position in the document.
 *
 * @param editor Tiptap Editor instance
 * @returns The ID of the active heading, or null if no heading is found
 */
export const findActiveHeadingId = (editor: Editor): string | null => {
  // If the cursor is currently inside a heading, return it.
  const { $anchor } = editor.state.selection;
  for (let depth = $anchor.depth; depth >= 0; depth--) {
    const node = $anchor.node(depth);
    if (node.type.name === 'heading') {
      return node.attrs.id;
    }
  }

  // If the cursor is not inside a heading node, find the closest heading above the current position.
  const { state } = editor;
  const { from } = state.selection;
  let foundHeadingId: string | null = null;
  state.doc.nodesBetween(0, from, (node) => {
    if (node.type.name === 'heading') {
      foundHeadingId = node.attrs.id ?? null;
    }
  });

  return foundHeadingId;
};
