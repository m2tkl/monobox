import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import { VueNodeViewRenderer, type NodeViewProps } from '@tiptap/vue-3';

import type { Component } from 'vue';

const configureTable = (extension: typeof Table) => extension.configure({
  resizable: false,
  cellMinWidth: 80,
  lastColumnResizable: true,
});

export const tableExtension = (node?: Component<NodeViewProps>) => {
  if (!node) {
    return configureTable(Table.extend({
      addAttributes() {
        return {
          ...this.parent?.(),
          name: {
            default: '',
            parseHTML: element => element.getAttribute('name'),
            renderHTML: attributes => ({
              name: attributes.name,
            }),
          },
        };
      },
    }));
  }

  return configureTable(Table.extend({
    addNodeView() {
      return VueNodeViewRenderer(node);
    },
    addAttributes() {
      return {
        ...this.parent?.(),
        name: {
          default: '',
          parseHTML: element => element.getAttribute('name'),
          renderHTML: attributes => ({
            name: attributes.name,
          }),
        },
      };
    },
  }));
};

export const tableRowExtension = () => TableRow;

export const tableCellExtension = () => TableCell;

export const tableHeaderExtension = () => TableHeader;
