import type { Level } from '@tiptap/extension-heading';
import type { Editor } from '@tiptap/vue-3';

export const setLink = (editor: Editor, link: string) => {
  const target = isInternalLink(link) ? null : '_blank';
  editor.chain().focus().setMark('link', { href: link, target }).run();
};

export const unsetLink = (editor: Editor) => {
  editor.chain().focus().unsetMark('link').run();
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
    bold: () => editor.chain().focus().toggleMark('bold'),
    italic: () => editor.chain().focus().toggleMark('italic'),
    strike: () => editor.chain().focus().toggleMark('strike'),
  };
  styleMap[style]().run();
};

export const toggleBulletList = (
  editor: Editor,
) => {
  editor.chain().focus().toggleList('bulletList', 'listItem').run();
};

export const toggleOrderedList = (
  editor: Editor,
) => {
  editor.chain().focus().toggleList('orderedList', 'listItem').run();
};

export const toggleBlockQuote = (
  editor: Editor,
) => {
  if (editor.isActive('blockquote')) {
    editor.chain().focus().lift('blockquote').run();
  }
  else {
    editor.chain().focus().wrapIn('blockquote').run();
  }
};

export const toggleCode = (
  editor: Editor,
) => {
  editor.chain().focus().toggleMark('code').run();
};

export const resetStyle = (
  editor: Editor,
) => {
  editor.chain().focus().clearNodes().unsetAllMarks().run();
};

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
