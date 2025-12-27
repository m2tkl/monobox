import type { Node } from '@tiptap/pm/model';
import type { EditorView } from '@tiptap/pm/view';
import type { Editor, JSONContent } from '@tiptap/vue-3';

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
