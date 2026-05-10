<template>
  <NuxtLayout name="default">
    <template #main>
      <div
        class="flex size-full justify-center"
      >
        <OutlinePanel
          :outline="outline"
          :active-heading-id="activeHeadingId"
          :active-ancestor-headings="activeAncestorHeadings"
          :route-path="route.path"
          :focus-heading="(id: string) => focusHeading(editor, id)"
          :navigate-to-heading="navigateToHeading"
          :copy-link-to-heading="copyLinkToHeading"
        />

        <div
          id="main"
          class="hide-scrollbar h-full min-w-0 flex-1 overflow-y-auto"
          style="background-color: var(--color-background)"
        >
          <MemoEditor
            v-if="editor"
            ref="memoEditorRef"
            v-model:memo-title="memoTitle"
            :editor="editor"
          >
            <template #toolbar="{ editor: _editor }">
              <EditorToolbarButton
                v-for="(item) in getEditorToolbarActionItems(_editor)"
                :key="item.msg.type"
                :label="item.label"
                :icon="item.icon"
                @exec="dispatchEditorMsg(_editor, item.msg)"
              />
            </template>

            <template #context-menu>
              <IconButton
                :icon="iconKey.kanban"
                :disabled="isKanbanLoading || !memoVM.data.memo"
                aria-label="Kanban"
                @click="openKanbanModal"
              />
              <IconButton
                :icon="iconKey.shuffle"
                @click="showRandomMemo"
              />
              <IconButton
                :icon="memoVM.data.isBookmarked ? iconKey.bookmarkFilled : iconKey.bookmark"
                @click="toggleBookmark"
              />

              <UDropdownMenu
                :items="contextMenuItems"
              >
                <div class="flex items-center">
                  <UIcon
                    :name="iconKey.dotMenuVertical"
                  />
                </div>
              </UDropdownMenu>
            </template>

            <template #bubble-menu="{ editor: _editor }">
              <template v-if="_editor.isActive('image')">
                <EditorToolbarButton
                  :icon="iconKey.annotation"
                  @exec="startImgAltEditing"
                />
                <EditorToolbarButton
                  :icon="iconKey.zoomIn"
                  @exec="openSelectedImagePreview"
                />
              </template>

              <template v-else>
                <div
                  v-for="(actionGroup, groupIndex) in bubbleMenuItems"
                  :key="groupIndex"
                  class="flex gap-0.5"
                >
                  <span
                    v-if="groupIndex !== 0"
                    class="mx-0.5 font-thin text-slate-400"
                  >|</span>
                  <div
                    v-for="(item, index) in actionGroup"
                    :key="index"
                  >
                    <EditorToolbarButton
                      :icon="item.icon"
                      @exec="item.action"
                    />
                  </div>
                </div>
              </template>
            </template>

            <template #table-bubble-menu="{ editor: _editor, tableSelectionAxis }">
              <div
                v-for="item in getTableBubbleMenuActionItems(_editor, tableSelectionAxis)"
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
                  @exec="dispatchEditorMsg(_editor, item.msg)"
                />
              </div>
            </template>

            <template #dialogs="{ editor: _editor }">
              <LinkEditDialog
                v-model:open="isEditingLink"
                :editor="_editor"
                @exit="finishLinkEditing"
              />

              <AltEditDialog
                v-model:open="isEditingImgAlt"
                :editor="_editor"
                @exit="finishImgAltEditing"
              />
            </template>
          </MemoEditor>

          <div
            v-if="shouldShowInlineTemplateSuggestions"
            class="template-suggestion-shell"
          >
            <div class="template-suggestion-inline">
              <div
                class="mb-2 text-xs font-medium"
                style="color: var(--color-text-secondary)"
              >
                Use template?
              </div>
              <div class="flex items-start gap-3">
                <div class="template-suggestion-scroll">
                  <div class="flex w-max items-center gap-2">
                    <UButton
                      v-for="template in availableTemplates"
                      :key="template.id"
                      variant="soft"
                      color="neutral"
                      :loading="isApplyingTemplate && selectedTemplateId === template.id"
                      :disabled="isApplyingTemplate"
                      @click="applyTemplate(template.slug_name)"
                    >
                      {{ template.name }}
                    </UButton>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <UModal v-model:open="isKanbanModalOpen">
            <template #content>
              <UCard>
                <div class="kanban-assign-modal">
                  <div class="kanban-assign-title">
                    Kanban assignments
                  </div>
                  <div
                    v-if="kanbans.length === 0"
                    class="kanban-assign-empty"
                  >
                    No Kanban boards available.
                  </div>
                  <div
                    v-else
                    class="kanban-assign-list"
                  >
                    <div
                      v-for="kanban in kanbans"
                      :key="kanban.id"
                      class="kanban-assign-row"
                    >
                      <div class="kanban-assign-info">
                        <div class="kanban-assign-name">
                          {{ kanban.name }}
                        </div>
                        <div
                          v-if="kanbanEntryMap.get(kanban.id)"
                          class="kanban-assign-meta"
                        >
                          {{ kanbanEntryMap.get(kanban.id)?.kanban_status_name || 'No status' }}
                        </div>
                      </div>
                      <div class="kanban-assign-actions">
                        <USelect
                          v-model="kanbanSelections[kanban.id]"
                          :items="getStatusOptions(kanban.id)"
                          size="xs"
                          variant="outline"
                          label-key="label"
                          value-key="value"
                          :disabled="isKanbanUpdating(kanban.id)"
                          @update:model-value="(value) => applyKanbanStatus(kanban.id, typeof value === 'string' ? Number(value) : value)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </UCard>
            </template>
          </UModal>

          <!-- Related links -->
          <MemoLinkCardView
            v-if="memoVM.data.memo"
            :memo-title="memoVM.data.memo.title"
            :links="memoVM.data.links"
          />

          <!-- Margin for editor scroll -->
          <div class="flex h-[calc(100vh-40px)] items-center justify-center">
            <p class="font-bold text-slate-400">
              Happy writing... 📝
            </p>
          </div>
        </div>
      </div>
    </template>

    <template #actions>
      <div v-if="memoVM.data.workspaceMemos && memoVM.data.memo">
        <SearchPalette
          ref="linkPaletteRef"
          :workspace-slug="workspaceSlug"
          :memos="memoVM.data.workspaceMemos"
          :current-memo-title="memoVM.data.memo.title"
          type="link"
          shortcut-symbol="i"
          :editor="editor"
        />
        <SearchPalette
          :workspace-slug="workspaceSlug"
          :memos="memoVM.data.workspaceMemos"
          :current-memo-title="memoVM.data.memo.title"
          type="search"
          shortcut-symbol="k"
          :editor="editor"
        />
      </div>

      <DeleteMemoDialog ref="deleteMemoDialogRef" />

      <!-- Export with related pages -->
      <ExportDialogToSelectTargets
        v-model:open="isSelectingTargets"
        :export-candidates="exportCandidates"
        @select="(targets) => exportPagesV2(targets)"
      />
      <ExportDialogToCopyResult
        v-model:open="isCopyingResult"
        :text-to-export="htmlExport"
        @copy="copyExportedResult"
      />
    </template>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import { toggleMemoBookmark } from './resource/command/toggleMemoBookmark';
import { loadMemoEditingData } from './resource/read/loadMemoEditingData';
import AltEditDialog from './view/compose-memo/AltEditDialog.vue';
import EditorToolbarButton from './view/compose-memo/EditorToolbarButton.vue';
import { useImagePreview } from './view/compose-memo/image-preview/useImagePreview';
import LinkEditDialog from './view/compose-memo/LinkEditDialog.vue';
import MemoEditor from './view/compose-memo/MemoEditor.vue';
import { useMemoEditor } from './view/compose-memo/useMemoEditor';
import { useMemoEditorActions } from './view/compose-memo/useMemoEditorActions';
import { useMemoEditorInteractions } from './view/compose-memo/useMemoEditorInteractions';
import DeleteMemoDialog from './view/edit-memo/DeleteMemoDialog.vue';
import { useMemoEditingContext } from './view/edit-memo/memoEditingContext';
import { useMemoEditingMachine } from './view/edit-memo/memoEditingMachine';
import MemoLinkCardView from './view/navigate-memo/MemoLinkCardView/Index.vue';
import OutlinePanel from './view/navigate-memo/OutlinePanel.vue';
import { useMemoEditingKanban } from './view/organize-memo/memoEditingKanban';
import ExportDialogToCopyResult from './view/share-memo/ExportDialogToCopyResult.vue';
import ExportDialogToSelectTargets from './view/share-memo/ExportDialogToSelectTargets.vue';
import { useMemoCopy } from './view/share-memo/memoCopy';
import { useMemoExport } from './view/share-memo/memoExport';
import { clearNewMemoTemplateQuery } from './view/start-memo-from-template/clearNewMemoTemplateQuery';
import { focusMemoTitleField } from './view/start-memo-from-template/focusMemoTitleField';
import { useTemplateApply } from './view/start-memo-from-template/useTemplateApply';
import { useTemplateStartIntent } from './view/start-memo-from-template/useTemplateStartIntent';

import type { DeleteMemoDialogHandle } from './view/edit-memo/deleteMemoDialog';
import type { MemoEvent } from './view/edit-memo/memoMachine';
import type { DropdownMenuItem } from '@nuxt/ui';
import type { NodeViewProps } from '@tiptap/vue-3';
import type { MemoTemplateIndexItem } from '~/models/memoTemplate';

import { buildExtensions, CodeBlockComponent, EditorAction, dispatchEditorMsg, EditorQuery } from '~/features/editor';
import { loadMemoTemplates } from '~/features/memo-templates';
import { SearchPalette } from '~/features/search';
import IconButton from '~/shared/components/elements/IconButton.vue';
import { useConsoleLogger } from '~/utils/logger';

const extensions = buildExtensions({
  CodeBlockComponent: CodeBlockComponent as Component<NodeViewProps>,
});

const router = useRouter();
const toast = useToast();
const {
  route,
  workspaceSlug,
  memoSlug,
  routeHash,
  memoReadModel: memoVM,
  memo,
  memoTitle,
} = useMemoEditingContext();
const {
  kanbans,
  kanbanEntryMap,
  kanbanSelections,
  isKanbanLoading,
  isKanbanModalOpen,
  isKanbanUpdating,
  openKanbanModal,
  getStatusOptions,
  applyKanbanStatus,
  loadKanbanEntries,
} = useMemoEditingKanban({
  workspaceSlug,
  memoSlug,
});
const availableTemplates = ref<MemoTemplateIndexItem[]>([]);
const loadTemplates = async () => {
  availableTemplates.value = await loadMemoTemplates(workspaceSlug.value);
};
const loadInitialData = () => loadMemoEditingData({
  workspaceSlug,
  memoSlug,
  loadKanbanEntries,
  loadTemplates,
});
const {
  startIntent,
  shouldFocusNewMemoTitle,
} = useTemplateStartIntent({
  route,
  availableTemplates,
});
const logger = useConsoleLogger('pages/memo');

type MemoSnapshot = {
  title: string;
  content: string;
};

await usePageLoader(loadInitialData);

const currentMemo = computed(() => {
  const loadedMemo = memo.value;
  if (!loadedMemo) {
    throw new Error('Memo is not loaded.');
  }
  return loadedMemo;
});

const lastSavedSnapshot = ref<MemoSnapshot>({
  title: currentMemo.value.title,
  content: currentMemo.value.content,
});

const getCurrentSnapshot = (): MemoSnapshot => {
  const currentContent = editor.value ? JSON.stringify(editor.value.getJSON()) : currentMemo.value.content;
  return {
    title: memoTitle.value,
    content: currentContent,
  };
};

const computeDirty = () => {
  const current = getCurrentSnapshot();
  return current.title !== lastSavedSnapshot.value.title
    || current.content !== lastSavedSnapshot.value.content;
};

const deleteMemoDialogRef = ref<DeleteMemoDialogHandle | null>(null);
let dispatch: (event: MemoEvent) => Promise<void> = async () => {};

/* --- States for editor --- */

// Reference to control the link palette component
const linkPaletteRef = ref<InstanceType<typeof SearchPalette> | null>(null);
const memoEditorRef = ref<InstanceType<typeof MemoEditor> | null>(null);

const {
  editor,
  activeHeadingId,
  outline,
  activeAncestorHeadings,
  focusHeading,
  headImageRef,
  updateActiveHeadingOnScroll,
} = useMemoEditor(currentMemo.value.content, {
  extensions: extensions,
  onChanged: (_reason) => { void dispatch({ type: 'memo/content-changed', payload: { dirty: computeDirty() } }); },
  onLinksChanged: (added, deleted) => { void dispatch({ type: 'memo/links-changed', payload: { added, deleted } }); },
  route,
  router,
});

const { dispatch: machineDispatch } = useMemoEditingMachine({
  workspaceSlug,
  memoSlug,
  routeHash,
  router,
  editor,
  memoTitle,
  headImageRef,
  deleteDialogRef: deleteMemoDialogRef,
  getCurrentSnapshot,
  onSnapshotSaved: (snapshot) => {
    lastSavedSnapshot.value = snapshot;
  },
  logger,
});
dispatch = machineDispatch;

watch(memoTitle, () => {
  void dispatch({ type: 'memo/title-changed', payload: { dirty: computeDirty() } });
});

// Focus the title field if coming from a "create new memo" action with the appropriate query parameter.
onMounted(() => {
  if (!shouldFocusNewMemoTitle.value) {
    return;
  }

  focusMemoTitleField({
    focusTitleField: (selectAll) => {
      memoEditorRef.value?.focusTitleField(selectAll);
    },
  });
});

const clearTemplateStartQuery = async () => {
  await clearNewMemoTemplateQuery({
    route,
    router,
  });
};

const focusTitleFieldForNewMemo = () => {
  focusMemoTitleField({
    focusTitleField: (selectAll) => {
      memoEditorRef.value?.focusTitleField(selectAll);
    },
  });
};

const {
  isApplyingTemplate,
  selectedTemplateId,
  shouldShowInlineTemplateSuggestions,
  applyTemplate,
} = useTemplateApply({
  editor,
  hasMemo: computed(() => memoVM.value.data.memo != null),
  workspaceSlug,
  route,
  router,
  availableTemplates,
  startIntent,
  clearTemplateStartQuery,
  focusTitleFieldForNewMemo,
  toast,
  logger,
});

/**
 * Navigate to the specified heading by updating the URL hash.
 *
 * This will add a new entry to the browser history (push).
 *
 * @param headingId - The ID of the heading to navigate to.
 */
const { navigateToHeading } = useMemoEditorInteractions({
  editor,
  route,
  router,
  dispatch,
  focusHeading,
  updateActiveHeadingOnScroll,
});

/**
 * Watch for changes in the URL hash and focus the corresponding heading in the editor.
 *
 * This ensures that browser back/forward navigation moves the editor focus appropriately.
 */
const { openPreview } = useImagePreview();
const {
  getEditorToolbarActionItems,
  getTableBubbleMenuActionItems,
} = useMemoEditorActions({
  editor,
});

onBeforeUnmount(() => {
  // Destroy editor
  editor.value?.destroy();
});

/**
 * Show preview on selected image
 */
function openSelectedImagePreview() {
  const ed = editor.value;
  if (!ed) return;

  const sel = ed.state.selection;
  const { $from } = sel;
  const node = ($from?.nodeAfter ?? $from?.nodeBefore);
  if (node && node.type?.name === 'image') {
    const src: string | undefined = node.attrs?.src;
    const alt: string = node.attrs?.alt || '';
    if (src) {
      openPreview(src, alt);
      return;
    }
  }
  window.alert('Failed to find preview target.');
}

const toggleBookmark = async () => {
  if (!memoVM.value.data.memo) {
    return;
  }

  await toggleMemoBookmark({
    workspaceSlug: workspaceSlug.value,
    memoSlug: memoSlug.value,
    isBookmarked: memoVM.value.data.isBookmarked,
  });
};

/* --- Contect menu items --- */
const contextMenuItems: DropdownMenuItem[][] = [
  [
    {
      label: 'Slide mode',
      icon: iconKey.pageLink,
      onSelect: () => { router.push(`/${workspaceSlug.value}/${memoSlug.value}/_slide`); },
    },
    {
      label: 'Copy as markdown',
      icon: iconKey.copy,
      onSelect: async () => { await copyPageAsMarkdown(editor.value!, memoTitle.value); },
    },
    {
      label: 'Copy as html',
      icon: iconKey.html,
      onSelect: async () => { await copyPageAsHtml(editor.value!, memoTitle.value); },
    },
    {
      label: 'Export with linked pages',
      icon: iconKey.pageLink,
      onSelect: () => { exportMode.value = 'selectingTargets'; },
    },
  ],
  [
    {
      label: 'Delete',
      icon: iconKey.trash,
      onSelect: () => { void dispatch({ type: 'memo/delete-requested' }); },
    },
  ],
];

/* --- Editor bubble menu items --- */
const bubbleMenuItems = [
  [
    {
      icon: iconKey.memoLink,
      action: () => {
        const selectedText = editor.value ? EditorQuery.getSelectedTextV2(editor.value.view) : '';
        linkPaletteRef.value?.openCommandPalette(selectedText);
      },
    },
    {
      icon: iconKey.link,
      action: () => { startLinkEditing(); },
    },
    {
      icon: iconKey.unlink,
      action: () => { EditorAction.unsetLink(editor.value!); },
    },
  ],
  [
    {
      icon: iconKey.textBold,
      action: () => { EditorAction.toggleStyle(editor.value!, 'bold'); },
    },
    {
      icon: iconKey.textItalic,
      action: () => { EditorAction.toggleStyle(editor.value!, 'italic'); },
    },
    {
      icon: iconKey.textStrikeThrough,
      action: () => { EditorAction.toggleStyle(editor.value!, 'strike'); },
    },
    {
      icon: iconKey.inlineCode,
      action: () => { EditorAction.toggleCode(editor.value!); },
    },
    {
      icon: iconKey.clearFormat,
      action: () => { EditorAction.resetStyle(editor.value!); },
    },
  ],
  [
    {
      icon: iconKey.copy,
      action: () => { void copySelectedTextAsMarkdown(editor.value!); },
    },
  ],
];

/**
 * Opens a randomly selected memo from the current workspace.
 */
const showRandomMemo = async () => {
  if (!memoVM.value.data.workspaceMemos || memoVM.value.data.workspaceMemos.length === 0) {
    return;
  }

  const randomIndex = Math.floor(Math.random() * memoVM.value.data.workspaceMemos.length);
  const randomMemo = memoVM.value.data.workspaceMemos[randomIndex];
  if (randomMemo) {
    router.push(`/${workspaceSlug.value}/${randomMemo.slug_title}`);
  }
};

/* --- Editor dialogs --- */
const {
  isOpen: isEditingLink,
  open: startLinkEditing,
  close: finishLinkEditing,
} = useDialog();

const {
  isOpen: isEditingImgAlt,
  open: startImgAltEditing,
  close: finishImgAltEditing,
} = useDialog();

const { copyPageAsMarkdown, copyPageAsHtml, copySelectedTextAsMarkdown, copyLinkToHeading } = useMemoCopy();

/* --- Export with related pages (Step1: select targets) --- */
const { exportMode, htmlExport, isSelectingTargets, isCopyingResult, exportCandidates, exportPagesV2 } = useMemoExport({
  workspaceSlug: () => workspaceSlug.value,
  links: computed(() => memoVM.value.data.links),
  editor,
  memoTitle,
});

/* --- Export with related pages (Step2: copy result) */

const copyExportedResult = async (textToCopy: string) => {
  try {
    await navigator.clipboard.writeText(textToCopy);
    toast.add({ title: 'Exported result copied!', icon: iconKey.success, duration: 1000 });
    exportMode.value = 'idle';
  }
  catch (error) {
    logger.error(error);
    toast.add({
      title: 'Failed to copy.',
      description: 'Please try again',
      color: 'error',
      icon: iconKey.failed,
    });
  }
};
</script>

<style>
.custom-heading {
  font-family: 'Arial', sans-serif;
  margin: 16px 0;
  padding-bottom: 4px;
  font-weight: bold;

  /* NOTE: Since using flex causes the cursor to jump to the beginning, set block */
  display: block;
}

.custom-heading-level-1 {
  font-size: 1.6em;
  color: #555;

  border-bottom: 2px solid #ddd;
}

.custom-heading-level-2 {
  font-size: 1.6em;
  color: #555;

  border-bottom: 1px solid #ccc;
  border-style: dashed;
}

.custom-heading-level-3 {
  font-size: 1.4em;
  color: #555;

  border-bottom: 1px solid #ccc;
  border-style: dashed ;
}

.custom-heading-level-4,
.custom-heading-level-5,
.custom-heading-level-6 {
  font-size: 1.4em;
  color: #777;
}

/* --- Task list --- */

/* Apply a strikethrough to completed checkboxes. */
.custom-task-item[data-checked="true"] div * {
  text-decoration: line-through;
  color: #999;
}

.custom-task-item[data-checked="true"] div a {
  text-decoration: line-through;
  color: var(--color-link);
  opacity: 0.7;
}

.custom-task-item[data-checked="true"] div a:hover {
  text-decoration: line-through;
  color: var(--color-link-hover);
  opacity: 0.8;
}

a.external-link {
  text-decoration: underline;
  text-underline-offset: 0.2em;
  text-decoration-style: dashed;
  text-decoration-skip-ink: none;
}

.kanban-assign-modal {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kanban-assign-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.kanban-assign-empty {
  font-size: 12px;
  color: var(--color-text-muted);
}

.kanban-assign-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.kanban-assign-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border-light);
}

.kanban-assign-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kanban-assign-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.kanban-assign-meta {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.kanban-assign-actions {
  min-width: 180px;
}

.template-suggestion-shell {
  max-width: 820px;
  margin: 0 auto;
  padding: 0 1.5rem;
  background-color: var(--color-surface-elevated);
}

.template-suggestion-inline {
  padding: 0.5rem 0 1.5rem;
}

.template-suggestion-scroll {
  min-width: 0;
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  padding-bottom: 0.25rem;
  scrollbar-width: thin;
  scrollbar-color: var(--color-scrollbar-thumb) var(--color-scrollbar-track);
}

.template-suggestion-scroll::-webkit-scrollbar {
  height: 8px;
}

.template-suggestion-scroll::-webkit-scrollbar-track {
  background: var(--color-scrollbar-track);
}

.template-suggestion-scroll::-webkit-scrollbar-thumb {
  background-color: var(--color-scrollbar-thumb);
  border-radius: var(--radius-sm);
}

.template-suggestion-scroll::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-scrollbar-thumb-hover);
}
</style>
