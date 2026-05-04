<template>
  <UModal
    :open="open"
    fullscreen
    :ui="{ overlay: 'bg-modal-overlay' }"
    @update:open="onUpdateOpen"
  >
    <template #content>
      <UCard
        class="template-dialog-card"
        :ui="{
          header: 'shrink-0',
          body: 'min-h-0 flex-1 overflow-hidden p-0 sm:p-0',
        }"
      >
        <template #header>
          <div class="template-dialog-shell">
            <header class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <div
                  class="text-sm font-semibold"
                  style="color: var(--color-text-primary)"
                >
                  Edit template
                </div>
                <div
                  v-if="templateName"
                  class="truncate text-xs"
                  style="color: var(--color-text-secondary)"
                >
                  {{ templateName }}
                </div>
              </div>
              <UButton
                :icon="iconKey.close"
                variant="ghost"
                color="neutral"
                size="sm"
                aria-label="Close template editor"
                @click="close"
              />
            </header>
          </div>
        </template>

        <div
          v-if="isLoading"
          class="flex h-full items-center justify-center p-8"
          style="background-color: var(--color-background)"
        >
          <LoadingSpinner />
        </div>

        <div
          v-else-if="loadError"
          class="flex h-full items-center justify-center p-8 text-sm"
          style="background-color: var(--color-background); color: var(--color-text-muted)"
        >
          Failed to load template.
        </div>

        <div
          v-else-if="editor"
          class="flex h-full min-h-0 flex-col"
        >
          <div
            id="main"
            class="hide-scrollbar min-h-0 flex-1 overflow-y-auto"
            style="background-color: var(--color-background)"
          >
            <MemoEditor
              ref="memoEditorRef"
              v-model:memo-title="templateName"
              :editor="editor"
              toolbar-container-class="mx-auto w-full max-w-[960px]"
              content-container-class="mx-auto w-full max-w-[960px]"
            >
              <template #toolbar="{ editor: toolbarEditor }">
                <EditorToolbarButton
                  v-for="item in getEditorToolbarActionItems(toolbarEditor)"
                  :key="item.msg.type"
                  :label="item.label"
                  :icon="item.icon"
                  @exec="dispatchEditorMsg(toolbarEditor, item.msg)"
                />
              </template>

              <template #table-bubble-menu="{ editor: bubbleEditor, tableSelectionAxis }">
                <div
                  v-for="item in getTableBubbleMenuActionItems(bubbleEditor, tableSelectionAxis)"
                  :key="item.msg.type"
                  :class="item.dividerBefore ? 'mt-1 border-t pt-1' : ''"
                  style="border-color: var(--color-border-light)"
                >
                  <EditorToolbarButton
                    :label="item.label"
                    :icon="item.icon"
                    :disabled="item.disabled"
                    tabindex="-1"
                    full-width
                    @exec="dispatchEditorMsg(bubbleEditor, item.msg)"
                  />
                </div>
              </template>

              <template #context-menu>
                <UButton
                  class="template-save-button"
                  size="xs"
                  :loading="isSaving"
                  @click="saveTemplate"
                >
                  Save
                </UButton>
              </template>
            </MemoEditor>
          </div>

          <SearchPalette
            v-if="workspaceMemos.length > 0"
            :workspace-slug="workspaceSlug"
            :memos="workspaceMemos"
            :current-memo-title="templateName"
            type="link"
            shortcut-symbol="i"
            :editor="editor"
          />
          <SearchPalette
            v-if="workspaceMemos.length > 0"
            :workspace-slug="workspaceSlug"
            :memos="workspaceMemos"
            :current-memo-title="templateName"
            type="search"
            shortcut-symbol="k"
            :editor="editor"
          />
        </div>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { CellSelection, TableMap } from 'prosemirror-tables';

import type { NodeViewProps, Editor as _Editor } from '@tiptap/vue-3';
import type { EditorMsgType } from '~/app/features/editor';
import type { MemoIndexItem } from '~/models/memo';

import { buildExtensions, dispatchEditorMsg } from '~/app/features/editor';
import CodeBlockComponent from '~/app/features/editor/nodeviews/CodeBlock';
import { useMemoTemplateEditorAction } from '~/app/features/memo/action/template/useMemoTemplateEditorAction';
import EditorToolbarButton from '~/app/features/memo/ui/editor/EditorToolbarButton.vue';
import MemoEditor from '~/app/features/memo/ui/editor/MemoEditor.vue';
import { useMemoEditor } from '~/app/features/memo/ui/editor/useMemoEditor';
import SearchPalette from '~/app/features/search/SearchPalette.vue';
import LoadingSpinner from '~/app/ui/LoadingSpinner.vue';
import { isCmdKey } from '~/utils/event';
import { iconKey } from '~/utils/icon';
import { useConsoleLogger } from '~/utils/logger';

const props = withDefaults(defineProps<{
  open: boolean;
  workspaceSlug: string;
  templateSlug: string;
  focusTitle?: boolean;
}>(), {
  focusTitle: false,
});

const emit = defineEmits<{
  'update:open': [boolean];
  'saved': [string];
}>();

const route = useRoute();
const router = useRouter();
const toast = useToast();
const logger = useConsoleLogger('MemoTemplateEditorDialog');
const {
  loadTemplateEditorData,
  saveTemplate: executeSaveTemplate,
} = useMemoTemplateEditorAction();

const templateName = ref('');
const currentTemplateSlug = ref(props.templateSlug);
const workspaceMemos = ref<MemoIndexItem[]>([]);
const isLoading = ref(true);
const isSaving = ref(false);
const loadError = ref(false);
const memoEditorRef = ref<InstanceType<typeof MemoEditor> | null>(null);

const extensions = buildExtensions({
  CodeBlockComponent: CodeBlockComponent as Component<NodeViewProps>,
});

const {
  editor,
} = useMemoEditor(JSON.stringify(''), {
  extensions,
  route,
  router,
});
const toolbarContextVersion = ref(0);
let detachToolbarContextListeners: (() => void) | null = null;

const baseEditorToolbarActionItems: {
  label?: string;
  icon?: string;
  msg: EditorMsgType;
}[] = [
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

const tableRowBubbleMenuActionItems: {
  label?: string;
  icon?: string;
  disabled?: boolean;
  dividerBefore?: boolean;
  msg: EditorMsgType;
}[] = [
  { label: 'Add row before', icon: iconKey.arrowUp, msg: { type: 'insertTableRowBefore' } },
  { label: 'Add row after', icon: iconKey.arrowDown, msg: { type: 'insertTableRowAfter' } },
  { label: 'Del Row', icon: iconKey.trash, msg: { type: 'deleteTableRow' } },
  { label: 'Del Tbl', icon: iconKey.trash, dividerBefore: true, msg: { type: 'deleteTable' } },
];

const tableColumnBubbleMenuActionItems: {
  label?: string;
  icon?: string;
  disabled?: boolean;
  dividerBefore?: boolean;
  msg: EditorMsgType;
}[] = [
  { label: 'Add col before', icon: iconKey.arrowLeft, msg: { type: 'insertTableColumnBefore' } },
  { label: 'Add col after', icon: iconKey.arrowRight, msg: { type: 'insertTableColumnAfter' } },
  { label: 'Del Col', icon: iconKey.trash, msg: { type: 'deleteTableColumn' } },
  { label: 'Del Tbl', icon: iconKey.trash, dividerBefore: true, msg: { type: 'deleteTable' } },
];

function getEditorToolbarActionItems(currentEditor?: typeof editor.value) {
  // Keep toolbar item derivation behind a getter so toolbar state can depend on editor.state
  // without leaking ProseMirror-specific reactivity details into the template.
  void toolbarContextVersion.value;

  if (!currentEditor) {
    return baseEditorToolbarActionItems;
  }

  return baseEditorToolbarActionItems;
}

function getTableBubbleMenuActionItems(
  currentEditor?: typeof editor.value,
  tableSelectionAxis?: 'row' | 'column' | null,
) {
  if (!currentEditor) {
    return [];
  }

  const { selection } = currentEditor.state;
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

watch(editor, (currentEditor) => {
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
}, { immediate: true });

async function loadTemplate() {
  isLoading.value = true;
  loadError.value = false;
  currentTemplateSlug.value = props.templateSlug;

  try {
    const { template: loadedTemplate, memos: loadedMemos } = await loadTemplateEditorData({
      workspaceSlug: props.workspaceSlug,
      templateSlug: props.templateSlug,
    });

    templateName.value = loadedTemplate.name;
    workspaceMemos.value = loadedMemos;
    editor.value?.commands.setContent(JSON.parse(loadedTemplate.content), false);

    if (props.focusTitle) {
      nextTick(() => {
        window.setTimeout(() => {
          memoEditorRef.value?.focusTitleField(true);
        }, 50);
      });
    }
  }
  catch (error) {
    logger.error(error);
    loadError.value = true;
  }
  finally {
    isLoading.value = false;
  }
}

async function saveTemplate() {
  if (!editor.value || !templateName.value.trim()) {
    window.alert('Please set template name.');
    return;
  }

  isSaving.value = true;
  try {
    const result = await executeSaveTemplate({
      workspaceSlug: props.workspaceSlug,
      targetSlugName: currentTemplateSlug.value,
      name: templateName.value,
      content: JSON.stringify(editor.value.getJSON()),
    });

    currentTemplateSlug.value = result.slug;
    templateName.value = result.name;
    emit('saved', currentTemplateSlug.value);

    toast.add({
      title: 'Template saved',
      duration: 1000,
      icon: iconKey.success,
    });
  }
  catch (error) {
    logger.error(error);
    toast.add({
      title: 'Failed to save template',
      description: 'Please try again',
      color: 'error',
      icon: iconKey.failed,
    });
  }
  finally {
    isSaving.value = false;
  }
}

function close() {
  emit('update:open', false);
}

function onUpdateOpen(next: boolean) {
  emit('update:open', next);
}

const handleKeydown = (event: KeyboardEvent) => {
  if (isCmdKey(event) && event.key === 's') {
    event.preventDefault();
    void saveTemplate();
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
  void loadTemplate();
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
  detachToolbarContextListeners?.();
  editor.value?.destroy();
});
</script>

<style scoped>
.template-dialog-card {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-surface);
}

.template-dialog-shell {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
}

:deep(.template-save-button) {
  background-color: var(--color-primary);
  color: #fff;
}

:deep(.template-save-button:hover) {
  background-color: var(--color-primary-hover);
}
</style>
