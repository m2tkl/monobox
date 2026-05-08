import { CellSelection, TableMap } from 'prosemirror-tables';

import type { Editor as TiptapEditor } from '@tiptap/core';
import type { Ref } from 'vue';
import type { EditorMsgType } from '~/features/editor';

import { iconKey } from '~/utils/icon';

type ToolbarActionItem = {
  label?: string;
  icon?: string;
  disabled?: boolean;
  dividerBefore?: boolean;
  msg: EditorMsgType;
};

const baseEditorToolbarActionItems: ToolbarActionItem[] = [
  { label: 'H1', msg: { type: 'toggleHeading', level: 1 } },
  { label: 'H2', msg: { type: 'toggleHeading', level: 2 } },
  { label: 'H3', msg: { type: 'toggleHeading', level: 3 } },
  { icon: iconKey.textBold, msg: { type: 'toggleStyle', style: 'bold' } },
  { icon: iconKey.textItalic, msg: { type: 'toggleStyle', style: 'italic' } },
  { icon: iconKey.textStrikeThrough, msg: { type: 'toggleStyle', style: 'strike' } },
  { icon: iconKey.listBulletted, msg: { type: 'toggleBulletList' } },
  { icon: iconKey.listNumbered, msg: { type: 'toggleOrderedList' } },
  { icon: iconKey.quotes, msg: { type: 'toggleBlockQuote' } },
  { icon: iconKey.inlineCode, msg: { type: 'toggleCode' } },
  { icon: iconKey.table, msg: { type: 'insertTable' } },
  { icon: iconKey.clearFormat, msg: { type: 'clearFormat' } },
];

const tableRowBubbleMenuActionItems: ToolbarActionItem[] = [
  { label: 'Add row before', icon: iconKey.arrowUp, msg: { type: 'insertTableRowBefore' } },
  { label: 'Add row after', icon: iconKey.arrowDown, msg: { type: 'insertTableRowAfter' } },
  { label: 'Del Row', icon: iconKey.trash, msg: { type: 'deleteTableRow' } },
  { label: 'Del Tbl', icon: iconKey.trash, dividerBefore: true, msg: { type: 'deleteTable' } },
];

const tableColumnBubbleMenuActionItems: ToolbarActionItem[] = [
  { label: 'Add col before', icon: iconKey.arrowLeft, msg: { type: 'insertTableColumnBefore' } },
  { label: 'Add col after', icon: iconKey.arrowRight, msg: { type: 'insertTableColumnAfter' } },
  { label: 'Del Col', icon: iconKey.trash, msg: { type: 'deleteTableColumn' } },
  { label: 'Del Tbl', icon: iconKey.trash, dividerBefore: true, msg: { type: 'deleteTable' } },
];

type UseMemoEditorActionsOptions = {
  editor: Ref<TiptapEditor | undefined>;
};

export function useMemoEditorActions(options: UseMemoEditorActionsOptions) {
  const toolbarContextVersion = ref(0);
  let detachToolbarContextListeners: (() => void) | null = null;

  function getEditorToolbarActionItems(currentEditor?: TiptapEditor) {
    void toolbarContextVersion.value;

    if (!currentEditor) {
      return baseEditorToolbarActionItems;
    }

    return baseEditorToolbarActionItems;
  }

  function getTableBubbleMenuActionItems(
    currentEditor?: TiptapEditor,
    tableSelectionAxis?: 'row' | 'column' | null,
  ) {
    void toolbarContextVersion.value;

    if (!currentEditor) {
      return [];
    }

    const selection = currentEditor.state.selection;
    if (selection instanceof CellSelection) {
      const table = selection.$anchorCell.node(-1);
      const tableMap = TableMap.get(table);
      const canDeleteRow = tableMap.height > 1;
      const canDeleteColumn = tableMap.width > 1;
      const rowItems = tableRowBubbleMenuActionItems.map(item =>
        item.msg.type === 'deleteTableRow'
          ? { ...item, disabled: !canDeleteRow }
          : item);
      const columnItems = tableColumnBubbleMenuActionItems.map(item =>
        item.msg.type === 'deleteTableColumn'
          ? { ...item, disabled: !canDeleteColumn }
          : item);

      if (tableSelectionAxis === 'column' && selection.isColSelection()) {
        return columnItems;
      }

      if (tableSelectionAxis === 'row' && selection.isRowSelection()) {
        return rowItems;
      }

      if (selection.isRowSelection()) {
        return rowItems;
      }

      if (selection.isColSelection()) {
        return columnItems;
      }
    }

    return [];
  }

  watch(options.editor, (currentEditor, previousEditor) => {
    detachToolbarContextListeners?.();
    detachToolbarContextListeners = null;

    if (!currentEditor) {
      return;
    }

    const refreshToolbarContext = () => {
      toolbarContextVersion.value += 1;
    };

    currentEditor.on('selectionUpdate', refreshToolbarContext);
    currentEditor.on('transaction', refreshToolbarContext);
    refreshToolbarContext();

    detachToolbarContextListeners = () => {
      currentEditor.off('selectionUpdate', refreshToolbarContext);
      currentEditor.off('transaction', refreshToolbarContext);
    };

    if (previousEditor && previousEditor !== currentEditor) {
      toolbarContextVersion.value += 1;
    }
  }, { immediate: true });

  onBeforeUnmount(() => {
    detachToolbarContextListeners?.();
  });

  return {
    getEditorToolbarActionItems,
    getTableBubbleMenuActionItems,
  };
}
