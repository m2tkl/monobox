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
          :copy-link-to-heading="copyLinkToHeadingAction"
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
            <template #status>
              <UBadge
                :color="memoStatusBadge.color"
                variant="soft"
                class="memo-status-badge"
              >
                {{ memoStatusBadge.label }}
              </UBadge>
            </template>

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
                @click="() => void dispatchAction({ type: 'action/open-kanban-modal' })"
              />
              <IconButton
                :icon="memoVM.data.isBookmarked ? iconKey.bookmarkFilled : iconKey.bookmark"
                @click="() => void dispatchAction({ type: 'action/toggle-bookmark' })"
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
                  @exec="() => void dispatchAction({ type: 'action/start-image-alt-editing' })"
                />
                <EditorToolbarButton
                  :icon="iconKey.zoomIn"
                  @exec="() => void dispatchAction({ type: 'action/open-selected-image-preview' })"
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

              <UModal v-model:open="isInboxInsertModalOpen">
                <template #content>
                  <UCard
                    :ui="fileInsertModalCardUi"
                  >
                    <template #header>
                      <div class="text-sm font-semibold">
                        Import from Inbox
                      </div>
                    </template>

                    <div class="inbox-insert-palette">
                      <UCommandPalette
                        v-model:search-term="inboxInsertSearchTerm"
                        v-model="selectedInboxInsertCommand"
                        :groups="inboxInsertCommandGroups"
                        :class="fileInsertPaletteClass"
                        :autoclear="false"
                        icon="carbon:search"
                        placeholder="Search Inbox files"
                        command-attribute="title"
                        :fuse="fileInsertPaletteFuse"
                        :empty-state="{
                          icon: 'carbon:search-locate',
                          label: 'No files available in Inbox.',
                          queryLabel: 'No matching Inbox files found.',
                        }"
                        @update:model-value="onSelectInboxInsertCommand"
                      >
                        <template #item-label="{ item }">
                          <span
                            class="truncate"
                            style="color: var(--color-text-primary)"
                            v-html="getPaletteLabelHtml(item)"
                          />
                        </template>
                      </UCommandPalette>
                    </div>
                  </UCard>
                </template>
              </UModal>

              <UModal v-model:open="isFilesInsertModalOpen">
                <template #content>
                  <UCard
                    :ui="fileInsertModalCardUi"
                  >
                    <template #header>
                      <div class="text-sm font-semibold">
                        Insert from Files
                      </div>
                    </template>

                    <div class="inbox-insert-palette">
                      <UCommandPalette
                        v-model:search-term="filesInsertSearchTerm"
                        v-model="selectedFilesInsertCommand"
                        :groups="filesInsertCommandGroups"
                        :class="fileInsertPaletteClass"
                        :autoclear="false"
                        icon="carbon:search"
                        placeholder="Search Files"
                        command-attribute="title"
                        :fuse="fileInsertPaletteFuse"
                        :empty-state="{
                          icon: 'carbon:search-locate',
                          label: 'No files have been added yet.',
                          queryLabel: 'No matching files found.',
                        }"
                        @update:model-value="onSelectFilesInsertCommand"
                      >
                        <template #item-label="{ item }">
                          <span
                            class="truncate"
                            style="color: var(--color-text-primary)"
                            v-html="getPaletteLabelHtml(item)"
                          />
                        </template>
                        <template #item-trailing="{ item }">
                          <span
                            class="text-xs"
                            style="color: var(--color-text-secondary)"
                          >
                            {{ getFilesInsertMeta(item) }}
                          </span>
                        </template>
                      </UCommandPalette>
                    </div>
                  </UCard>
                </template>
              </UModal>

              <UModal v-model:open="isExternalFileModalOpen">
                <template #content>
                  <UCard>
                    <template #header>
                      <div class="text-sm font-semibold">
                        Create and insert shared link
                      </div>
                    </template>

                    <div class="space-y-4">
                      <UFormField label="Name">
                        <UInput v-model="externalFileForm.displayName" />
                      </UFormField>
                      <UFormField label="URL">
                        <UInput v-model="externalFileForm.url" />
                      </UFormField>
                    </div>

                    <template #footer>
                      <div class="flex justify-end gap-2">
                        <AppButton
                          variant="ghost"
                          @click="isExternalFileModalOpen = false"
                        >
                          Cancel
                        </AppButton>
                        <AppButton
                          :loading="isInsertingManagedFile"
                          :disabled="!externalFileForm.displayName || !externalFileForm.url"
                          @click="createExternalFileAndInsert"
                        >
                          Create and insert
                        </AppButton>
                      </div>
                    </template>
                  </UCard>
                </template>
              </UModal>
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
                    <AppButton
                      v-for="template in availableTemplates"
                      :key="template.id"
                      variant="soft"
                      color="neutral"
                      :loading="isApplyingTemplate && selectedTemplateId === template.id"
                      :disabled="isApplyingTemplate"
                      @click="applyTemplate(template.slug_name)"
                    >
                      {{ template.name }}
                    </AppButton>
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
            :files="memoVM.data.linkedFiles"
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
        @copy="(textToCopy) => void dispatchAction({ type: 'action/copy-exported-result', textToCopy })"
      />
    </template>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import { CREATED_QUERY_SOURCE_NAMED } from './createdQuery';
import { createMemo } from './resource/command/createMemo';
import { loadMemoEditingData } from './resource/read/loadMemoEditingData';
import AltEditDialog from './view/compose-memo/AltEditDialog.vue';
import EditorToolbarButton from './view/compose-memo/EditorToolbarButton.vue';
import LinkEditDialog from './view/compose-memo/LinkEditDialog.vue';
import MemoEditor from './view/compose-memo/MemoEditor.vue';
import { useMemoEditor } from './view/compose-memo/useMemoEditor';
import { useMemoEditorActions } from './view/compose-memo/useMemoEditorActions';
import { useMemoEditorInteractions } from './view/compose-memo/useMemoEditorInteractions';
import DeleteMemoDialog from './view/edit-memo/DeleteMemoDialog.vue';
import { useMemoEditingActions } from './view/edit-memo/useMemoEditingActions';
import { useMemoMachine } from './view/edit-memo/useMemoMachine';
import { useMemoRouteTarget } from './view/edit-memo/useMemoRouteTarget';
import { useMemoTitleBackfill } from './view/edit-memo/useMemoTitleBackfill';
import MemoLinkCardView from './view/navigate-memo/MemoLinkCardView/Index.vue';
import OutlinePanel from './view/navigate-memo/OutlinePanel.vue';
import { useMemoEditingKanban } from './view/organize-memo/memoEditingKanban';
import ExportDialogToCopyResult from './view/share-memo/ExportDialogToCopyResult.vue';
import ExportDialogToSelectTargets from './view/share-memo/ExportDialogToSelectTargets.vue';
import { useMemoExport } from './view/share-memo/memoExport';
import { clearNewMemoTemplateQuery } from './view/start-memo-from-template/clearNewMemoTemplateQuery';
import { useTemplateApply } from './view/start-memo-from-template/useTemplateApply';
import { useTemplateStartIntent } from './view/start-memo-from-template/useTemplateStartIntent';

import type { DeleteMemoDialogHandle } from './view/edit-memo/useMemoMachine';
import type { DropdownMenuItem } from '@nuxt/ui';
import type { NodeViewProps } from '@tiptap/vue-3';
import type { LocationQueryRaw } from 'vue-router';
import type { InboxFileItem, ManagedFileListItem } from '~/models/file';
import type { MemoTemplateIndexItem } from '~/models/memoTemplate';

import { buildExtensions, CodeBlockComponent, dispatchEditorMsg, EditorAction } from '~/features/editor';
import { useCurrentMemoReadModel } from '~/features/memo-editing/resource/read-model';
import { loadMemoTemplates } from '~/features/memo-templates';
import { fileCommand } from '~/resources/file/commands';
import { SearchPalette } from '~/features/search';
import IconButton from '~/shared/components/elements/IconButton.vue';
import { AppError } from '~/utils/error';
import { useConsoleLogger } from '~/utils/logger';
import { buildMemoTitleFromSlug } from '~/utils/slug';

const extensions = buildExtensions({
  CodeBlockComponent: CodeBlockComponent as Component<NodeViewProps>,
});

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { workspaceSlug, memoSlug } = useMemoRouteTarget(route);
const memoVM = useCurrentMemoReadModel();
const { memoTitle } = useMemoTitleBackfill(computed(() => memoVM.value.data.memo));
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
const {
  startIntent,
  shouldFocusNewMemoTitle,
} = useTemplateStartIntent({
  route,
  availableTemplates,
});
const logger = useConsoleLogger('pages/memo');

const isMemoNotFoundError = (error: unknown) =>
  error instanceof AppError && error.message.includes('Memo not found for slug:');

const ensureMemoExistsAndLoad = async () => {
  try {
    await loadMemoEditingData({
      workspaceSlug,
      memoSlug,
      loadKanbanEntries,
      loadTemplates,
    });
  }
  catch (error) {
    if (!isMemoNotFoundError(error)) {
      throw error;
    }

    await createMemo({
      workspaceSlug: workspaceSlug.value,
      title: buildMemoTitleFromSlug(memoSlug.value),
    });

    await router.replace({
      path: route.path,
      query: {
        ...route.query,
        created: CREATED_QUERY_SOURCE_NAMED,
      },
      hash: route.hash,
    });

    await loadMemoEditingData({
      workspaceSlug,
      memoSlug,
      loadKanbanEntries,
      loadTemplates,
    });
  }
};

await usePageLoader(ensureMemoExistsAndLoad);

const resolvedCurrentMemo = computed(() => {
  const memo = memoVM.value.data.memo;
  if (!memo) {
    throw new Error('Memo is not loaded.');
  }
  return memo;
});

type MemoSnapshot = {
  title: string;
  content: string;
};

const lastSavedSnapshot = ref<MemoSnapshot>({
  title: resolvedCurrentMemo.value.title,
  content: resolvedCurrentMemo.value.content,
});

const getCurrentSnapshot = (): MemoSnapshot => {
  const currentContent = editor.value ? JSON.stringify(editor.value.getJSON()) : resolvedCurrentMemo.value.content;
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
const hasMemo = computed(() => memoVM.value.data.memo != null);
const isBookmarked = computed(() => memoVM.value.data.isBookmarked);

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
} = useMemoEditor(resolvedCurrentMemo.value.content, {
  extensions: extensions,
  onChanged: (_reason) => { void dispatchMemoEvent({ type: 'memo/content-updated', payload: { dirty: computeDirty() } }); },
  onLinksChanged: (added, deleted) => { void dispatchMemoEvent({ type: 'memo/links-changed', payload: { added, deleted } }); },
  route,
  router,
});

const { state: memoState, dispatch: dispatchMemoEvent } = useMemoMachine({
  initialState: { type: 'clean' },
  workspaceSlug,
  memoSlug,
  router,
  route,
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

const memoStatusBadge = computed(() => {
  switch (memoState.value.type) {
    case 'dirty':
      return { label: 'Unsaved changes', color: 'warning' as const };
    case 'saving':
      return { label: 'Saving...', color: 'info' as const };
    case 'deleting':
      return { label: 'Deleting...', color: 'neutral' as const };
    case 'clean':
    default:
      return { label: 'Saved', color: 'success' as const };
  }
});

watch(memoTitle, () => {
  void dispatchMemoEvent({ type: 'memo/title-updated', payload: { dirty: computeDirty() } });
});

// Focus the title after mount/template-start timing settles.
const focusNewMemoTitle = () => {
  nextTick(() => {
    window.setTimeout(() => {
      memoEditorRef.value?.focusTitleField(true);
    }, 50);
  });
};

// Focus the title field if coming from a "create new memo" action with the appropriate query parameter.
onMounted(() => {
  if (!shouldFocusNewMemoTitle.value) {
    return;
  }

  focusNewMemoTitle();
});

const clearTemplateStartQuery = async () => {
  await clearNewMemoTemplateQuery({
    route,
    router,
  });
};

// Remove only the requested template slug so a failed apply does not retry forever.
const clearRequestedTemplateQuery = async () => {
  const { template: _template, ...nextQuery } = route.query;
  const normalizedQuery: LocationQueryRaw = {};
  for (const [key, value] of Object.entries(nextQuery)) {
    normalizedQuery[key] = value as string | string[] | null | undefined;
  }

  await router.replace({
    path: route.path,
    query: normalizedQuery,
    hash: route.hash,
  });
};

const {
  isApplyingTemplate,
  selectedTemplateId,
  shouldShowInlineTemplateSuggestions,
  applyTemplate,
} = useTemplateApply({
  editor,
  hasMemo,
  workspaceSlug,
  availableTemplates,
  startIntent,
  clearTemplateStartQuery,
  clearRequestedTemplateQuery,
  focusNewMemoTitle,
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
  dispatch: dispatchMemoEvent,
  focusHeading,
  updateActiveHeadingOnScroll,
});

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

const contextMenuItems: DropdownMenuItem[][] = [
  [
    {
      label: 'Insert from Inbox',
      icon: iconKey.folder,
      onSelect: () => { void openInboxInsertModal(); },
    },
    {
      label: 'Create external file link',
      icon: iconKey.link,
      onSelect: () => { isExternalFileModalOpen.value = true; },
    },
    {
      label: 'Insert from Files',
      icon: iconKey.documentAttachment,
      onSelect: () => { void openFilesInsertModal(); },
    },
  ],
  [
    {
      label: 'Slide mode',
      icon: iconKey.pageLink,
      onSelect: () => { void dispatchAction({ type: 'action/open-slide-mode' }); },
    },
    {
      label: 'Copy as markdown',
      icon: iconKey.copy,
      onSelect: () => { void dispatchAction({ type: 'action/copy-markdown' }); },
    },
    {
      label: 'Copy as html',
      icon: iconKey.html,
      onSelect: () => { void dispatchAction({ type: 'action/copy-html' }); },
    },
    {
      label: 'Export with linked pages',
      icon: iconKey.pageLink,
      onSelect: () => { void dispatchAction({ type: 'action/export-with-linked-pages' }); },
    },
  ],
  [
    {
      label: 'Delete',
      icon: iconKey.trash,
      onSelect: () => { void dispatchMemoEvent({ type: 'memo/delete-requested' }); },
    },
  ],
];

/* --- Editor bubble menu items --- */
const bubbleMenuItems = [
  [
    {
      icon: iconKey.memoLink,
      action: () => {
        void dispatchAction({ type: 'action/open-link-palette' });
      },
    },
    {
      icon: iconKey.link,
      action: () => { void dispatchAction({ type: 'action/start-link-editing' }); },
    },
    {
      icon: iconKey.unlink,
      action: () => { void dispatchAction({ type: 'action/unset-link' }); },
    },
  ],
  [
    {
      icon: iconKey.textBold,
      action: () => { void dispatchAction({ type: 'action/toggle-editor-style', style: 'bold' }); },
    },
    {
      icon: iconKey.textItalic,
      action: () => { void dispatchAction({ type: 'action/toggle-editor-style', style: 'italic' }); },
    },
    {
      icon: iconKey.textStrikeThrough,
      action: () => { void dispatchAction({ type: 'action/toggle-editor-style', style: 'strike' }); },
    },
    {
      icon: iconKey.inlineCode,
      action: () => { void dispatchAction({ type: 'action/toggle-inline-code' }); },
    },
    {
      icon: iconKey.clearFormat,
      action: () => { void dispatchAction({ type: 'action/reset-editor-style' }); },
    },
  ],
  [
    {
      icon: iconKey.copy,
      action: () => { void dispatchAction({ type: 'action/copy-selected-markdown' }); },
    },
  ],
];

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

const isInboxInsertModalOpen = ref(false);
const isFilesInsertModalOpen = ref(false);
const isExternalFileModalOpen = ref(false);
const isInsertingManagedFile = ref(false);
const inboxItems = ref<InboxFileItem[]>([]);
const managedFiles = ref<ManagedFileListItem[]>([]);
const inboxInsertSearchTerm = ref('');
const selectedInboxInsertCommand = ref<unknown[]>([]);
const filesInsertSearchTerm = ref('');
const selectedFilesInsertCommand = ref<unknown[]>([]);
const externalFileForm = reactive({
  displayName: '',
  url: '',
});

const fileInsertModalCardUi = {
  header: 'px-4 py-3 sm:px-4',
  body: 'p-0 sm:p-0',
} as const;

const fileInsertPaletteClass = 'max-h-[calc(60vh)] min-h-[calc(60vh)]';

const fileInsertPaletteFuse = {
  fuseOptions: {
    includeMatches: true,
    keys: ['title', 'normalizedTitle'],
  },
  resultLimit: 30,
};

type FileInsertPaletteItem = {
  label: string;
  title: string;
  normalizedTitle: string;
};

type InboxInsertCommandItem = FileInsertPaletteItem & {
  path: string;
};

type InboxInsertCommandGroup = {
  id: string;
  label: string;
  items: InboxInsertCommandItem[];
};

type FilesInsertCommandItem = FileInsertPaletteItem & {
  fileId: string;
  fileType: ManagedFileListItem['type'];
};

type FilesInsertCommandGroup = {
  id: string;
  label: string;
  items: FilesInsertCommandItem[];
};

const inboxInsertCommandGroups = computed<InboxInsertCommandGroup[]>(() => [{
  id: 'inbox-files',
  label: 'Inbox',
  items: inboxItems.value
    .map(item => ({
      ...createFileInsertPaletteItem(item.display_name),
      path: item.path,
    })),
}]);

const filesInsertCommandGroups = computed<FilesInsertCommandGroup[]>(() => [{
  id: 'managed-files',
  label: 'Files',
  items: managedFiles.value.map(item => ({
    ...createFileInsertPaletteItem(item.display_name),
    fileId: item.id,
    fileType: item.type,
  })),
}]);

const loadInboxItems = async () => {
  const page = await fileCommand.listInbox({ limit: 50, offset: 0 });
  inboxItems.value = page.items;
};

const loadManagedFiles = async () => {
  const page = await fileCommand.listFiles({ limit: 50, offset: 0 });
  managedFiles.value = page.items;
};

const openInboxInsertModal = async () => {
  try {
    await loadInboxItems();
    inboxInsertSearchTerm.value = '';
    selectedInboxInsertCommand.value = [];
    isInboxInsertModalOpen.value = true;
  }
  catch (error) {
    if (error instanceof AppError) {
      toast.add({
        title: 'Failed to load Inbox.',
        description: error.message,
        color: 'error',
      });
    }
  }
};

const openFilesInsertModal = async () => {
  try {
    await loadManagedFiles();
    filesInsertSearchTerm.value = '';
    selectedFilesInsertCommand.value = [];
    isFilesInsertModalOpen.value = true;
  }
  catch (error) {
    if (error instanceof AppError) {
      toast.add({
        title: 'Failed to load Files.',
        description: error.message,
        color: 'error',
      });
    }
  }
};

const insertManagedFile = async (fileId: string, displayName: string) => {
  if (!editor.value) {
    return;
  }

  EditorAction.insertFileLink(editor.value, displayName, fileId);
  isFilesInsertModalOpen.value = false;
};

const onSelectInboxInsertCommand = (command: unknown) => {
  if (!command || typeof command !== 'object' || !('path' in command) || typeof command.path !== 'string') {
    return;
  }

  selectedInboxInsertCommand.value = [];
  void insertInboxFile(command.path);
};

const onSelectFilesInsertCommand = (command: unknown) => {
  if (!command || typeof command !== 'object' || !('fileId' in command) || !('title' in command) || typeof command.fileId !== 'string' || typeof command.title !== 'string') {
    return;
  }

  selectedFilesInsertCommand.value = [];
  void insertManagedFile(command.fileId, command.title);
};

const createFileInsertPaletteItem = (displayName: string): FileInsertPaletteItem => ({
  label: displayName,
  title: displayName,
  normalizedTitle: displayName.normalize('NFC'),
});

const getPaletteLabelHtml = (item: unknown) => {
  if (!item || typeof item !== 'object') {
    return '';
  }

  const command = item as FileInsertPaletteItem & { labelHtml?: string };
  return command.labelHtml || command.title;
};

const getFilesInsertMeta = (item: unknown) => {
  if (!item || typeof item !== 'object') {
    return '';
  }

  const command = item as FilesInsertCommandItem;
  return command.fileType === 'external_link' ? 'Link' : 'File';
};

const insertInboxFile = async (path: string) => {
  if (!editor.value) {
    return;
  }

  isInsertingManagedFile.value = true;
  try {
    const file = await fileCommand.importInboxFile(path);
    EditorAction.insertFileLink(editor.value, file.display_name, file.id);
    await loadInboxItems();
    await loadManagedFiles();
    isInboxInsertModalOpen.value = false;
  }
  catch (error) {
    if (error instanceof AppError) {
      toast.add({
        title: 'Failed to insert Inbox file.',
        description: error.message,
        color: 'error',
      });
    }
  }
  finally {
    isInsertingManagedFile.value = false;
  }
};


const createExternalFileAndInsert = async () => {
  if (!editor.value) {
    return;
  }

  isInsertingManagedFile.value = true;
  try {
    const file = await fileCommand.createExternalLink({
      displayName: externalFileForm.displayName,
      url: externalFileForm.url,
    });
    EditorAction.insertFileLink(editor.value, file.display_name, file.id);
    externalFileForm.displayName = '';
    externalFileForm.url = '';
    await loadManagedFiles();
    isExternalFileModalOpen.value = false;
  }
  catch (error) {
    if (error instanceof AppError) {
      toast.add({
        title: 'Failed to insert shared link.',
        description: error.message,
        color: 'error',
      });
    }
  }
  finally {
    isInsertingManagedFile.value = false;
  }
};

/* --- Export with related pages (Step1: select targets) --- */
const { exportMode, htmlExport, isSelectingTargets, isCopyingResult, exportCandidates, exportPagesV2 } = useMemoExport({
  workspaceSlug: () => workspaceSlug.value,
  links: computed(() => memoVM.value.data.links),
  editor,
  memoTitle,
});

const { dispatchAction } = useMemoEditingActions({
  clipboard: {
    editor,
    memoTitle,
  },
  editor: {
    editor,
    startImgAltEditing,
    startLinkEditing,
    openLinkPalette: (selectedText) => {
      linkPaletteRef.value?.openCommandPalette(selectedText);
    },
  },
  page: {
    workspaceSlug,
    memoSlug,
    isBookmarked,
    hasMemo,
    router,
    openKanbanModal,
  },
  export: {
    openExportTargetSelection: () => {
      exportMode.value = 'selectingTargets';
    },
    finishExportCopying: () => {
      exportMode.value = 'idle';
    },
  },
});

const copyLinkToHeadingAction = (fullUrl: string, titleWithHeading: string) => {
  void dispatchAction({ type: 'action/copy-link-to-heading', fullUrl, titleWithHeading });
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
