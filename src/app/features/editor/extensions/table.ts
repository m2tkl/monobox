import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';

export const tableExtension = () => Table.configure({
  resizable: false,
  cellMinWidth: 80,
  lastColumnResizable: true,
});

export const tableRowExtension = () => TableRow;

export const tableCellExtension = () => TableCell;

export const tableHeaderExtension = () => TableHeader;
