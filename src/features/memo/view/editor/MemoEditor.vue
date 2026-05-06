<template>
  <div style="background-color: var(--color-background)">
    <!-- Toolbar -->
    <div
      class="sticky h-8 left-0 top-0 z-50 border-b-1"
      style="border-color: var(--color-border-light); background-color: var(--color-surface)"
    >
      <div
        :class="['h-8 flex items-center gap-0.5 overflow-auto px-2', toolbarContainerClass]"
      >
        <slot
          name="toolbar"
          :editor="editor"
        />
        <div class="ml-auto" />
        <slot
          name="context-menu"
          :editor="editor"
        />
      </div>
    </div>

    <!-- Editor area -->
    <div
      :class="['p-6', contentContainerClass]"
      style="background-color: var(--color-surface-elevated)"
    >
      <TitleFieldStableInput
        ref="titleFieldRef"
        v-model="memoTitle"
      />

      <div class="relative">
        <USeparator
          class="py-6"
          style="border-color: var(--color-border-light) !important;"
        />

        <UProgress
          v-if="!editorReady"
          size="xs"
          color="info"
          class="absolute inset-x-0 top-6 mx-auto"
        />
      </div>

      <div
        ref="editorSurfaceRef"
        :class="[
          'relative size-full',
          tableSelectionAxis ? 'table-structure-selection' : '',
        ]"
      >
        <EditorLoadingSkelton v-if="!editorReady" />

        <editor-content
          v-else
          :editor="editor"
        />

        <template v-if="tableHandleState.visible">
          <button
            type="button"
            class="table-handle absolute z-10"
            aria-label="Row actions"
            tabindex="-1"
            :style="{
              left: `${tableHandleState.rowButtonLeft}px`,
              top: `${tableHandleState.rowButtonTop}px`,
            }"
            @mousedown.prevent
            @click="selectCurrentTableRow"
          >
            <span class="table-handle-dots table-handle-dots-row" />
          </button>

          <button
            type="button"
            class="table-handle table-handle-column absolute z-10"
            aria-label="Column actions"
            tabindex="-1"
            :style="{
              left: `${tableHandleState.columnButtonLeft}px`,
              top: `${tableHandleState.columnButtonTop}px`,
            }"
            @mousedown.prevent
            @click="selectCurrentTableColumn"
          >
            <span class="table-handle-dots table-handle-dots-column" />
          </button>
        </template>
      </div>
    </div>

    <!-- Bubble menu -->
    <BubbleMenu
      plugin-key="bubbleMenuDefault"
      :editor="editor"
      :should-show="shouldShowDefaultBubbleMenu"
      class="flex gap-0.5 rounded-lg p-1 outline"
      style="background-color: var(--color-surface); outline-color: var(--color-border-muted)"
    >
      <slot
        name="bubble-menu"
        :editor="editor"
      />
    </BubbleMenu>

    <BubbleMenu
      plugin-key="bubbleMenuTable"
      :editor="editor"
      :should-show="shouldShowTableBubbleMenu"
      :tippy-options="tableBubbleMenuTippyOptions"
      class="flex flex-col gap-0.5 rounded-lg p-1 outline"
      style="background-color: var(--color-surface); outline-color: var(--color-border-muted)"
    >
      <slot
        name="table-bubble-menu"
        :editor="editor"
        :table-selection-axis="tableSelectionAxis"
      />
    </BubbleMenu>

    <slot
      name="dialogs"
      :editor="editor"
    />
  </div>
</template>

<script setup lang="ts">
import { BubbleMenu, EditorContent } from '@tiptap/vue-3';
import { CellSelection } from 'prosemirror-tables';

import type { Editor } from '@tiptap/core';
import type { EditorState } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';

import { dispatchEditorMsg } from '~/features/editor';
import EditorLoadingSkelton from '~/features/memo/view/editor/EditorLoadingSkelton.vue';
import TitleFieldStableInput from '~/features/memo/view/editor/TitleFieldStableInput.vue';

const props = withDefaults(defineProps<{
  editor: Editor;
  // TODO: These layout hooks were added for the template editor dialog.
  // Prefer moving width/alignment control to the parent once MemoEditor's
  // internal structure is simplified enough to style from the outside.
  toolbarContainerClass?: string;
  contentContainerClass?: string;
}>(), {
  toolbarContainerClass: '',
  contentContainerClass: 'max-w-[820px]',
});

const memoTitle = defineModel<string>('memoTitle', { required: true });
const titleFieldRef = ref<InstanceType<typeof TitleFieldStableInput> | null>(null);
const editorSurfaceRef = ref<HTMLElement | null>(null);

const editorReady = ref(false);
const tableSelectionAxis = ref<'row' | 'column' | null>(null);
const tableHandleState = ref({
  visible: false,
  rowButtonLeft: 0,
  rowButtonTop: 0,
  columnButtonLeft: 0,
  columnButtonTop: 0,
  rowAnchorRect: null as DOMRect | null,
  columnAnchorRect: null as DOMRect | null,
});
let detachEditorListeners: (() => void) | null = null;

onMounted(async () => {
  setTimeout(() => {
    editorReady.value = true;
  }, 500);

  window.addEventListener('resize', updateTableHandleState);
});

type BubbleMenuShouldShowProps = {
  editor: Editor;
  element: HTMLElement;
  view: EditorView;
  state: EditorState;
  oldState?: EditorState;
  from: number;
  to: number;
};

function shouldShowDefaultBubbleMenu({ editor }: BubbleMenuShouldShowProps) {
  return (
    (
      !editor.state.selection.empty
      && !(editor.state.selection instanceof CellSelection)
    )
    || editor.isActive('image')
  );
}

function shouldShowTableBubbleMenu({ editor }: BubbleMenuShouldShowProps) {
  const { selection } = editor.state;
  const isInHeaderCell = selection.$from.node(-1)?.type?.name === 'tableHeader';

  if (isInHeaderCell) {
    return false;
  }

  return selection instanceof CellSelection
    && (selection.isRowSelection() || selection.isColSelection());
}

function updateTableHandleState() {
  const surface = editorSurfaceRef.value;
  if (!surface || !editorReady.value) {
    tableHandleState.value.visible = false;
    return;
  }

  const currentEditor = props.editor;
  const { selection } = currentEditor.state;
  if (!currentEditor.isActive('table') || !selection.empty || selection instanceof CellSelection) {
    tableHandleState.value.visible = false;
    return;
  }

  const domAtPos = currentEditor.view.domAtPos(selection.from);
  const domNode = domAtPos.node instanceof HTMLElement
    ? domAtPos.node
    : domAtPos.node.parentElement;
  const cell = domNode?.closest('td, th');
  if (!cell) {
    tableHandleState.value.visible = false;
    return;
  }

  if (cell.tagName === 'TH') {
    tableHandleState.value.visible = false;
    return;
  }

  const table = cell.closest('table');
  if (!table) {
    tableHandleState.value.visible = false;
    return;
  }

  const surfaceRect = surface.getBoundingClientRect();
  const tableRect = table.getBoundingClientRect();
  const cellRect = cell.getBoundingClientRect();
  const handleSize = 18;
  const lineCenterOffset = handleSize / 2;

  tableHandleState.value = {
    visible: true,
    rowButtonLeft: tableRect.left - surfaceRect.left - lineCenterOffset,
    rowButtonTop: cellRect.top - surfaceRect.top + (cellRect.height / 2) - (handleSize / 2),
    columnButtonLeft: cellRect.left - surfaceRect.left + (cellRect.width / 2) - (handleSize / 2),
    columnButtonTop: tableRect.top - surfaceRect.top - lineCenterOffset,
    rowAnchorRect: DOMRect.fromRect({
      x: tableRect.left - lineCenterOffset,
      y: cellRect.top + (cellRect.height / 2) - (handleSize / 2),
      width: handleSize,
      height: handleSize,
    }),
    columnAnchorRect: DOMRect.fromRect({
      x: cellRect.left + (cellRect.width / 2) - (handleSize / 2),
      y: tableRect.top - lineCenterOffset,
      width: handleSize,
      height: handleSize,
    }),
  };
}

function getTableBubbleMenuAnchorRect() {
  const { selection } = props.editor.state;
  if (!(selection instanceof CellSelection)) {
    return null;
  }

  if (tableSelectionAxis.value === 'column' && selection.isColSelection()) {
    return tableHandleState.value.columnAnchorRect;
  }

  if (tableSelectionAxis.value === 'row' && selection.isRowSelection()) {
    return tableHandleState.value.rowAnchorRect;
  }

  return selection.isColSelection()
    ? tableHandleState.value.columnAnchorRect
    : tableHandleState.value.rowAnchorRect;
}

const tableBubbleMenuTippyOptions = computed(() => ({
  placement: tableSelectionAxis.value === 'column'
    ? 'bottom'
    : 'right-start',
  offset: tableSelectionAxis.value === 'column'
    ? [0, 6]
    : [6, 0],
  getReferenceClientRect: () => {
    const rect = getTableBubbleMenuAnchorRect();
    return rect ?? DOMRect.fromRect({ x: 0, y: 0, width: 0, height: 0 });
  },
}));

function selectCurrentTableRow() {
  tableSelectionAxis.value = 'row';
  dispatchEditorMsg(props.editor, { type: 'selectTableRow' });
}

function selectCurrentTableColumn() {
  tableSelectionAxis.value = 'column';
  dispatchEditorMsg(props.editor, { type: 'selectTableColumn' });
}

function focusTitleField(selectAll = false) {
  if (selectAll) {
    titleFieldRef.value?.focusAndSelectAll();
    return;
  }
}

defineExpose({
  focusTitleField,
});

watch(() => props.editor, (currentEditor) => {
  detachEditorListeners?.();
  detachEditorListeners = null;

  const refresh = () => {
    const selection = currentEditor.state.selection;
    if (!(selection instanceof CellSelection)) {
      tableSelectionAxis.value = null;
    }
    updateTableHandleState();
  };

  currentEditor.on('selectionUpdate', refresh);
  currentEditor.on('transaction', refresh);
  currentEditor.on('focus', refresh);
  currentEditor.on('blur', refresh);
  nextTick(() => {
    refresh();
  });

  detachEditorListeners = () => {
    currentEditor.off('selectionUpdate', refresh);
    currentEditor.off('transaction', refresh);
    currentEditor.off('focus', refresh);
    currentEditor.off('blur', refresh);
  };
}, { immediate: true });

watch(editorReady, (ready) => {
  if (ready) {
    nextTick(() => {
      updateTableHandleState();
    });
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateTableHandleState);
  detachEditorListeners?.();
});
</script>

<style scoped>
/* Force separator color to match theme */
:deep(.separator) {
  border-color: var(--color-border-light) !important;
}

:deep(hr) {
  border-color: var(--color-border-light) !important;
}

.table-handle {
  height: 18px;
  width: 18px;
  padding: 0;
  border: none;
  border-radius: 9999px;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.9;
}

.table-handle:hover,
.table-handle:focus-visible {
  opacity: 1;
  background-color: color-mix(in srgb, var(--color-surface) 72%, transparent);
  outline: none;
}

.table-handle-dots {
  position: relative;
  display: block;
}

.table-handle-dots::before {
  content: '';
  position: absolute;
  inset: 0;
  margin: auto;
  width: 4px;
  height: 4px;
  border-radius: 9999px;
  background-color: color-mix(in srgb, var(--color-text-muted) 88%, transparent);
}

.table-handle-dots-row {
  width: 3px;
  height: 14px;
}

.table-handle-dots-row::before {
  box-shadow:
    0 -5px 0 color-mix(in srgb, var(--color-text-muted) 88%, transparent),
    0 5px 0 color-mix(in srgb, var(--color-text-muted) 88%, transparent);
}

.table-handle-dots-column {
  width: 14px;
  height: 4px;
}

.table-handle-dots-column::before {
  box-shadow:
    -5px 0 0 color-mix(in srgb, var(--color-text-muted) 88%, transparent),
    5px 0 0 color-mix(in srgb, var(--color-text-muted) 88%, transparent);
}
</style>
