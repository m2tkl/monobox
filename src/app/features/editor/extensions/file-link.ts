import { Mark, mergeAttributes } from '@tiptap/core';

export const fileLinkExtension = () => {
  return Mark.create({
    name: 'fileLink',
    inclusive: false,
    priority: 1100,

    addAttributes() {
      return {
        fileId: {
          default: null,
          parseHTML: element => element.getAttribute('data-monobox-file-id'),
          renderHTML: attributes => ({
            'data-monobox-file-id': attributes.fileId,
          }),
        },
        label: {
          default: null,
          parseHTML: element => element.textContent,
          renderHTML: attributes => ({
            'data-monobox-file-label': attributes.label,
          }),
        },
      };
    },

    parseHTML() {
      return [
        {
          tag: 'a[data-monobox-file-id]',
        },
      ];
    },

    renderHTML({ HTMLAttributes }) {
      return [
        'a',
        mergeAttributes(HTMLAttributes, {
          'data-link-type': 'file',
          'class': 'monobox-file-link',
        }),
        0,
      ];
    },
  });
};
