import { Heading } from '@tiptap/extension-heading';

export const headingExtension = () => {
  return Heading.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        id: {
          default: null,
          parseHTML: element => element.getAttribute('id'),
          renderHTML: (attributes) => {
            return {
              id: attributes.id,
            };
          },
        },
        level: {
          default: 1,
          parseHTML: element => parseInt(element.tagName[1], 10),
          renderHTML: (attributes) => {
            return {
              level: attributes.level,
            };
          },
        },
      };
    },
    renderHTML({ HTMLAttributes }) {
      return [
        `h${HTMLAttributes.level}`,
        {
          ...HTMLAttributes,
          class: `custom-heading custom-heading-level-${HTMLAttributes.level}`,
        },
        0,
      ];
    },
  });
};
