import { Heading } from '@tiptap/extension-heading';
import { Slice, Fragment } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';

import type { Node as ProseMirrorNode } from 'prosemirror-model';

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

/**
 * Remove IDs from heading elemetns when pasting.
 *
 * This prevents duplicated heading IDs.
 */
export const removeHeadingIdOnPastePlugin = new Plugin({
  props: {
    transformPasted(slice) {
      function removeHeadingIdsFromFragment(fragment: Fragment): Fragment {
        const nodes: ProseMirrorNode[] = [];
        fragment.forEach((node) => {
          let newNode = node;
          if (node.type.name === 'heading') {
            // Reset the ID attribute
            const newAttrs = { ...node.attrs, id: null };
            newNode = node.type.create(newAttrs, removeHeadingIdsFromFragment(node.content), node.marks);
          }
          else if (node.content && node.content.size > 0) {
            newNode = node.type.create(node.attrs, removeHeadingIdsFromFragment(node.content), node.marks);
          }
          nodes.push(newNode);
        });
        return Fragment.fromArray(nodes);
      }

      const newContent = removeHeadingIdsFromFragment(slice.content);
      return new Slice(newContent, slice.openStart, slice.openEnd);
    },
  },
});
