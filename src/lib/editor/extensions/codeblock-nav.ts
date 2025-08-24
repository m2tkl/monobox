import { Extension } from '@tiptap/core';
import { Plugin, TextSelection } from '@tiptap/pm/state';

// Navigation helper that skips the code block's title UI and only moves across the block.
export function codeBlockNavExtension() {
  return Extension.create({
    name: 'codeBlockNav',
    addProseMirrorPlugins() {
      return [
        new Plugin({
          props: {
            handleKeyDown: (view, event) => {
              const key = event.key;
              if (key !== 'ArrowUp' && key !== 'ArrowDown') return false;

              const { state } = view;
              const sel = state.selection as TextSelection;
              if (!sel.empty) return false;
              const $from = sel.$from;

              // Only act inside a codeBlock
              if ($from.parent.type.name !== 'codeBlock') return false;

              const parent = $from.parent;
              const atStart = $from.parentOffset === 0;
              const atEnd = $from.parentOffset === parent.nodeSize - 2;

              if (key === 'ArrowUp' && atStart) {
                event.preventDefault();
                const depth = $from.depth;
                const $pos = state.doc.resolve(Math.max(1, $from.before(depth) - 1));
                view.dispatch(state.tr.setSelection(TextSelection.near($pos, -1)));
                return true;
              }

              if (key === 'ArrowDown' && atEnd) {
                event.preventDefault();
                const depth = $from.depth;
                const $pos = state.doc.resolve(Math.min(state.doc.content.size, $from.after(depth) + 1));
                view.dispatch(state.tr.setSelection(TextSelection.near($pos, 1)));
                return true;
              }

              return false;
            },
          },
        }),
      ];
    },
  });
}
