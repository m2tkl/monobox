import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';

import { convertToMarkdown } from '../serializer/markdown';

import type { EditorState } from '@tiptap/pm/state';

export type SelectionCopyFormat = 'html' | 'markdown';

type SelectionCopyOptions = {
  getFormat: () => SelectionCopyFormat;
};

export function serializeSelectionToMarkdown(state: EditorState): string {
  const slice = state.selection.content();
  const doc = state.schema.topNodeType.create(null, slice.content);

  return convertToMarkdown(doc).trimEnd();
}

export const selectionCopyExtension = Extension.create<SelectionCopyOptions>({
  name: 'selectionCopy',

  addOptions() {
    return {
      getFormat: () => 'html',
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleDOMEvents: {
            copy: (view, event) => {
              if (this.options.getFormat() !== 'markdown') {
                return false;
              }

              if (view.state.selection.empty || !event.clipboardData) {
                return false;
              }

              const markdown = serializeSelectionToMarkdown(view.state);
              event.clipboardData.clearData();
              event.clipboardData.setData('text/plain', markdown);
              event.preventDefault();
              return true;
            },
          },
        },
      }),
    ];
  },
});
