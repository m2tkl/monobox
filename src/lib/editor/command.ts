import type { Level } from '@tiptap/extension-heading';
import type { Transaction } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import type { Editor } from '@tiptap/vue-3';

export const unsetLink = (editor: Editor) => {
  editor.chain().focus().extendMarkRange('link').unsetLink().run();
};

export const toggleHeading = (
  editor: Editor,
  { h }: { h: Level },
) => {
  editor.chain().focus().toggleHeading({ level: h }).run();
};

export const toggleStyle = (
  editor: Editor,
  style: 'bold' | 'italic' | 'strike',
) => {
  const styleMap = {
    bold: () => editor.chain().focus().toggleBold(),
    italic: () => editor.chain().focus().toggleItalic(),
    strike: () => editor.chain().focus().toggleStrike(),
  };
  styleMap[style]().run();
};

export const toggleBulletList = (
  editor: Editor,
) => {
  editor.chain().focus().toggleBulletList().run();
};

export const toggleOrderedList = (
  editor: Editor,
) => {
  editor.chain().focus().toggleOrderedList().run();
};

export const toggleBlockQuote = (
  editor: Editor,
) => {
  editor.chain().focus().toggleBlockquote().run();
};

export const toggleCode = (
  editor: Editor,
) => {
  editor.chain().focus().toggleCode().run();
};

export const resetStyle = (
  editor: Editor,
) => {
  editor.chain().focus().clearNodes().unsetAllMarks().run();
};

/**
 * Memo: Return a Set or Array of links; the creation/deletion of links should be handled on the Main side.
 * IO operations should be performed externally.
 */
export const getChangedLinks = (transaction: Transaction) => {
  const beforeLinks = new Set<string>();
  transaction.before.descendants((node) => {
    const linkMark = node.marks.find(mark => mark.type.name === 'link');
    if (linkMark) {
      beforeLinks.add(linkMark.attrs.href);
    }
  });

  // The updated links (list of href)
  const afterLinks = new Set<string>();
  transaction.doc.descendants((node) => {
    const linkMark = node.marks.find(mark => mark.type.name === 'link');
    if (linkMark) {
      afterLinks.add(linkMark.attrs.href);
    }
  });

  const deletedLinks = [];
  const addedLinks = [];

  // Detect fully removed links
  for (const href of beforeLinks) {
    if (!afterLinks.has(href)) {
      deletedLinks.push(href);
    }
  }

  // Detect fully added links
  for (const href of afterLinks) {
    if (!beforeLinks.has(href)) {
      addedLinks.push(href);
    }
  }

  return {
    deletedLinks,
    addedLinks,
  };
};

export const isInternalLink = (url: string): boolean => {
  const appHost = window.location.origin;
  try {
    const linkHost = new URL(url, appHost).origin;
    return linkHost === appHost;
  }
  catch (error) {
    console.error(error);
    return false;
  }
};

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

/**
 * Insert link into editor
 *
 * @param editor
 * @param displayText
 * @param link
 */
export function insertLinkToMemo(
  editor: Editor,
  displayText: string,
  link: string,
): void {
  // NOTE:
  //   Ideally, I wanted to use chain, but I couldn't insert the text. The reason is unknown.
  editor.commands.insertContent({
    type: 'text',
    text: displayText,
    marks: [
      {
        type: 'link',
        attrs: {
          href: link,
        },
      },
    ],
  });

  // NOTE:
  //   Explicitly unset the link input to prevent subsequent input from being linked after inserting a link.
  editor.commands.unsetMark('link');
}
