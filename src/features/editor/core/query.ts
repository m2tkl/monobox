import type { Editor, JSONContent } from '@tiptap/core';
import type { Node } from '@tiptap/pm/model';
import type { EditorView } from '@tiptap/pm/view';

export type TaskSummary = {
  checked: number;
  total: number;
};

export type OutlineTaskSummary = {
  id: string;
  checked: number;
  total: number;
};

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

export function countTaskItems(json: JSONContent): number {
  return summarizeTaskItems(json).total;
}

export function summarizeTaskItems(json: JSONContent): TaskSummary {
  let checked = 0;
  let total = 0;

  const visit = (node: JSONContent | undefined) => {
    if (!node) {
      return;
    }

    if (node.type === 'taskItem') {
      total += 1;
      if (node.attrs?.checked === true) {
        checked += 1;
      }
    }

    node.content?.forEach(child => visit(child));
  };

  visit(json);

  return { checked, total };
}

type HeadingNode = {
  id: string;
  level: number;
};

function extractHeadingNode(node: JSONContent | undefined): HeadingNode | null {
  if (node?.type !== 'heading') {
    return null;
  }

  const id = typeof node.attrs?.id === 'string' ? node.attrs.id : '';
  const level = typeof node.attrs?.level === 'number' ? node.attrs.level : 1;

  if (!id) {
    return null;
  }

  return { id, level };
}

export function summarizeTaskItemsByOutlineSection(json: JSONContent): OutlineTaskSummary[] {
  const content = json.content ?? [];
  const headings = content
    .map((node, index) => {
      const heading = extractHeadingNode(node);
      return heading ? { ...heading, index } : null;
    })
    .filter((item): item is HeadingNode & { index: number } => item != null);

  return headings.map((heading, currentIndex) => {
    const nextBoundary = headings
      .slice(currentIndex + 1)
      .find(candidate => candidate.level <= heading.level);
    const sectionNodes = content.slice(
      heading.index + 1,
      nextBoundary?.index ?? content.length,
    );

    return {
      id: heading.id,
      ...summarizeTaskItems({
        type: 'doc',
        content: sectionNodes,
      }),
    };
  });
}
