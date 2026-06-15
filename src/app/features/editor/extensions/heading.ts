import { Heading } from '@tiptap/extension-heading';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Slice, Fragment } from 'prosemirror-model';
import { Plugin, PluginKey } from 'prosemirror-state';

import type { EditorView } from '@tiptap/pm/view';
import type { Node as ProseMirrorNode } from 'prosemirror-model';
import type { EditorState } from 'prosemirror-state';

type FoldHeadingSectionsMeta =
  | { type: 'toggle'; key: string }
  | { type: 'reveal'; keys: string[] };

type HeadingExtensionOptions = {
  getFoldStorageKey?: () => string | undefined;
};

export const foldHeadingSectionsPluginKey = new PluginKey<ReadonlySet<string>>('foldHeadingSections');
const headingFoldStateByStorageKey = new Map<string, Set<string>>();

export function getHeadingFoldKey(node: ProseMirrorNode, pos: number) {
  return typeof node.attrs.id === 'string' && node.attrs.id.length > 0
    ? node.attrs.id
    : `pos:${pos}`;
}

function getCollapsedHeadingKeys(state: EditorState) {
  return foldHeadingSectionsPluginKey.getState(state) ?? new Set<string>();
}

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

function pruneMissingHeadingKeys(doc: ProseMirrorNode, keys: ReadonlySet<string>) {
  const availableKeys = new Set<string>();

  doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      availableKeys.add(getHeadingFoldKey(node, pos));
    }
  });

  return new Set([...keys].filter(key => availableKeys.has(key)));
}

function createHeadingFoldButton(view: EditorView, pos: number, key: string, collapsed: boolean) {
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
      view.state.tr.setMeta(foldHeadingSectionsPluginKey, {
        type: 'toggle',
        key,
      } satisfies FoldHeadingSectionsMeta),
    );
    view.focus();
  });

  return button;
}

export const foldHeadingSectionsPlugin = (options: HeadingExtensionOptions = {}) => new Plugin({
  key: foldHeadingSectionsPluginKey,
  state: {
    init() {
      const storageKey = options.getFoldStorageKey?.();
      return storageKey
        ? new Set(headingFoldStateByStorageKey.get(storageKey) ?? [])
        : new Set<string>();
    },
    apply(transaction, value, _oldState, newState) {
      const meta = transaction.getMeta(foldHeadingSectionsPluginKey) as FoldHeadingSectionsMeta | undefined;
      let nextValue = value;

      if (meta?.type === 'toggle') {
        nextValue = new Set(value);
        if (nextValue.has(meta.key)) {
          nextValue.delete(meta.key);
        }
        else {
          nextValue.add(meta.key);
        }
      }

      if (meta?.type === 'reveal') {
        nextValue = new Set(value);
        meta.keys.forEach(key => nextValue.delete(key));
      }

      const finalValue = transaction.docChanged
        ? pruneMissingHeadingKeys(newState.doc, nextValue)
        : nextValue;

      const storageKey = options.getFoldStorageKey?.();
      if (storageKey) {
        headingFoldStateByStorageKey.set(storageKey, new Set(finalValue));
      }

      return finalValue;
    },
  },
  props: {
    handleKeyDown(view, event) {
      if (event.key !== 'Enter') {
        return false;
      }

      const heading = findHeadingAtSelection(view.state.doc, view.state.selection.from);
      if (!heading) {
        return false;
      }

      const key = getHeadingFoldKey(heading.node, heading.pos);
      if (!getCollapsedHeadingKeys(view.state).has(key)) {
        return false;
      }

      event.preventDefault();
      view.dispatch(
        view.state.tr.setMeta(foldHeadingSectionsPluginKey, {
          type: 'reveal',
          keys: [key],
        } satisfies FoldHeadingSectionsMeta),
      );
      return true;
    },
    decorations(state) {
      const decorations: Decoration[] = [];
      const collapsedStack: Array<{ level: number }> = [];
      const collapsedHeadingKeys = getCollapsedHeadingKeys(state);

      state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          const level = Number(node.attrs.level);
          const key = getHeadingFoldKey(node, pos);
          const collapsed = collapsedHeadingKeys.has(key);
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
            view => createHeadingFoldButton(view, pos, key, collapsed),
            {
              key: `heading-fold-${key}-${collapsed ? 'closed' : 'open'}`,
              side: -1,
            },
          ));

          if (collapsed) {
            collapsedStack.push({ level });
            decorations.push(Decoration.node(pos, pos + node.nodeSize, {
              class: 'custom-heading-collapsed',
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

export const headingExtension = (options: HeadingExtensionOptions = {}) => {
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
          class: [
            'custom-heading',
            `custom-heading-level-${HTMLAttributes.level}`,
          ].filter(Boolean).join(' '),
        },
        0,
      ];
    },
    addProseMirrorPlugins() {
      return [
        ...(this.parent?.() ?? []),
        foldHeadingSectionsPlugin(options),
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
