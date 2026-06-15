import { Heading } from '@tiptap/extension-heading';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Slice, Fragment } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';

import type { EditorView } from '@tiptap/pm/view';
import type { Node as ProseMirrorNode } from 'prosemirror-model';

function findHeadingAtSelection(doc: ProseMirrorNode, pos: number) {
  const $pos = doc.resolve(pos);

  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    const node = $pos.node(depth);
    if (node.type.name === 'heading') {
      return {
        node,
        pos: $pos.before(depth),
      };
    }
  }

  return null;
}

function isCollapsedHeading(node: ProseMirrorNode) {
  return node.type.name === 'heading' && node.attrs.collapsed === true;
}

function createHeadingFoldButton(view: EditorView, pos: number, collapsed: boolean) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'custom-heading-fold-button';
  button.setAttribute('contenteditable', 'false');
  button.setAttribute('aria-label', collapsed ? 'Expand section' : 'Collapse section');
  button.dataset.collapsed = collapsed ? 'true' : 'false';

  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();

    const node = view.state.doc.nodeAt(pos);
    if (!node || node.type.name !== 'heading') {
      return;
    }

    view.dispatch(
      view.state.tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        collapsed: !node.attrs.collapsed,
      }),
    );
    view.focus();
  });

  return button;
}

export const foldHeadingSectionsPlugin = new Plugin({
  props: {
    handleKeyDown(view, event) {
      if (event.key !== 'Enter') {
        return false;
      }

      const heading = findHeadingAtSelection(view.state.doc, view.state.selection.from);
      if (!heading || !isCollapsedHeading(heading.node)) {
        return false;
      }

      event.preventDefault();
      view.dispatch(
        view.state.tr.setNodeMarkup(heading.pos, undefined, {
          ...heading.node.attrs,
          collapsed: false,
        }),
      );
      return true;
    },
    decorations(state) {
      const decorations: Decoration[] = [];
      const collapsedStack: Array<{ level: number }> = [];

      state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          const level = Number(node.attrs.level);
          while (collapsedStack.length > 0 && collapsedStack[collapsedStack.length - 1]!.level >= level) {
            collapsedStack.pop();
          }

          if (collapsedStack.length > 0) {
            decorations.push(Decoration.node(pos, pos + node.nodeSize, {
              class: 'heading-collapsed-hidden',
            }));
          }

          decorations.push(Decoration.widget(
            pos + 1,
            view => createHeadingFoldButton(view, pos, node.attrs.collapsed === true),
            {
              key: `heading-fold-${node.attrs.id ?? pos}-${node.attrs.collapsed ? 'closed' : 'open'}`,
              side: -1,
            },
          ));

          if (isCollapsedHeading(node)) {
            collapsedStack.push({ level });
            decorations.push(Decoration.node(pos, pos + node.nodeSize, {
              'class': 'custom-heading-collapsed',
              'data-heading-collapsed': 'true',
            }));
          }

          return;
        }

        if (collapsedStack.length > 0 && !node.isText) {
          decorations.push(Decoration.node(pos, pos + node.nodeSize, {
            class: 'heading-collapsed-hidden',
          }));
        }
      });

      return DecorationSet.create(state.doc, decorations);
    },
  },
});

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
        collapsed: {
          default: false,
          parseHTML: element => element.getAttribute('data-heading-collapsed') === 'true',
          renderHTML: (attributes) => {
            return attributes.collapsed
              ? { 'data-heading-collapsed': 'true' }
              : {};
          },
        },
      };
    },
    renderHTML({ HTMLAttributes }) {
      return [
        `h${HTMLAttributes.level}`,
        {
          ...HTMLAttributes,
          class: [
            'custom-heading',
            `custom-heading-level-${HTMLAttributes.level}`,
            HTMLAttributes.collapsed ? 'custom-heading-collapsed' : '',
          ].filter(Boolean).join(' '),
        },
        0,
      ];
    },
    addProseMirrorPlugins() {
      return [
        ...(this.parent?.() ?? []),
        foldHeadingSectionsPlugin,
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
            const newAttrs = { ...node.attrs, id: null, collapsed: false };
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
