<template>
  <NuxtLayout name="default">
    <template #main>
      <div class="memo-editing-shell">
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
          class="memo-editing-content"
          :class="{ 'memo-editing-content--with-context': isContextViewOpen }"
        >
          <div
            id="main"
            class="hide-scrollbar h-full min-w-0 flex-1 overflow-y-auto"
          >
            <MemoEditor
              v-if="editor"
              ref="memoEditorRef"
              v-model:memo-title="memoTitle"
              :editor="editor"
            >
              <template #status>
                <div class="memo-floating-status">
                  <UBadge
                    :color="memoStatusBadge.color"
                    variant="soft"
                    class="memo-status-badge memo-status-badge--floating"
                  >
                    {{ memoStatusBadge.label }}
                  </UBadge>
                </div>

                <div class="focus-status-control">
                  <AppButton
                    size="xs"
                    color="neutral"
                    variant="soft"
                    :icon="iconKey.focusFilled"
                    class="focus-list-button"
                    @click="toggleFocusPane"
                  >
                    Focus
                    <span class="focus-list-count">{{ activeFocusCount }}</span>
                  </AppButton>
                </div>
              </template>

              <template #toolbar="{ editor: _editor }">
                <div class="memo-editor-toolbar-expanded-actions">
                  <EditorToolbarButton
                    v-for="(item, index) in getEditorToolbarActionItems(_editor)"
                    :key="item.msg.type"
                    :label="item.label"
                    :icon="item.icon"
                    :class="getEditorToolbarActionClass(index)"
                    @exec="dispatchEditorMsg(_editor, item.msg)"
                  />
                </div>
                <div class="memo-editor-toolbar-overflow-actions memo-editor-toolbar-overflow-actions--medium">
                  <UDropdownMenu :items="getEditorToolbarOverflowMenuItems(_editor, 'medium')">
                    <IconButton
                      :icon="iconKey.dotMenuVertical"
                      aria-label="More formatting"
                      title="More formatting"
                    />
                  </UDropdownMenu>
                </div>
                <div class="memo-editor-toolbar-overflow-actions memo-editor-toolbar-overflow-actions--narrow">
                  <UDropdownMenu :items="getEditorToolbarOverflowMenuItems(_editor, 'narrow')">
                    <IconButton
                      :icon="iconKey.dotMenuVertical"
                      aria-label="More formatting"
                      title="More formatting"
                    />
                  </UDropdownMenu>
                </div>
              </template>

              <template #context-menu>
                <div class="memo-action-group memo-action-group--status">
                  <AppSelect
                    v-if="primaryKanban"
                    :model-value="kanbanSelections[primaryKanban.id] ?? null"
                    :items="primaryStatusOptions"
                    placeholder="No status"
                    class="memo-toolbar-status-select memo-toolbar-status-select--expanded"
                    :disabled="isPrimaryStatusControlDisabled"
                    @update:model-value="value => applyKanbanStatus(primaryKanban.id, normalizeStatusSelection(value))"
                  />
                </div>

                <div class="memo-action-group">
                  <UTooltip text="Calendar dates">
                    <span class="memo-calendar-button-wrap">
                      <IconButton
                        :icon="iconKey.calendar"
                        :disabled="!memoVM.data.memo"
                        aria-label="Calendar dates"
                        @click="openMemoCalendarDialog"
                      />
                      <span
                        v-if="currentMemoCalendarDates.length > 0"
                        class="memo-calendar-count"
                      >
                        {{ currentMemoCalendarDates.length }}
                      </span>
                    </span>
                  </UTooltip>
                </div>

                <div class="memo-action-group">
                  <UTooltip text="Bookmark">
                    <IconButton
                      :icon="memoVM.data.isBookmarked ? iconKey.bookmarkFilled : iconKey.bookmark"
                      aria-label="Bookmark"
                      @click="() => void dispatchAction({ type: 'action/toggle-bookmark' })"
                    />
                  </UTooltip>
                </div>

                <div class="memo-action-group">
                  <UDropdownMenu
                    :items="contextMenuItems"
                  >
                    <div class="flex items-center">
                      <UIcon
                        :name="iconKey.dotMenuVertical"
                      />
                    </div>
                  </UDropdownMenu>
                </div>
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
                          <AppInput v-model="externalFileForm.displayName" />
                        </UFormField>
                        <UFormField label="URL">
                          <AppInput v-model="externalFileForm.url" />
                        </UFormField>
                      </div>

                      <template #footer>
                        <div class="flex justify-end gap-2">
                          <AppButton
                            color="neutral"
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

                <UModal
                  v-model:open="isMemoCalendarDialogOpen"
                  :content="memoCalendarDialogContent"
                  :ui="memoCalendarDialogModalUi"
                >
                  <template #content>
                    <UCard
                      class="memo-calendar-dialog"
                      :ui="memoCalendarDialogCardUi"
                    >
                      <template #header>
                        <div
                          ref="memoCalendarInitialFocusEl"
                          tabindex="-1"
                        />
                        <div class="text-sm font-semibold">
                          Calendar dates
                        </div>
                      </template>

                      <div class="memo-calendar-dialog-body">
                        <div class="memo-calendar-add-row">
                          <AppInput
                            v-model="memoCalendarDate"
                            type="date"
                            size="sm"
                            :disabled="isCalendarDateUpdating || !memoVM.data.memo"
                          />
                          <AppButton
                            size="sm"
                            variant="subtle"
                            :loading="isCalendarDateUpdating"
                            :disabled="!canAddMemoCalendarDate"
                            @click="addMemoCalendarDate"
                          >
                            Add date
                          </AppButton>
                        </div>

                        <div
                          v-if="currentMemoCalendarDates.length === 0"
                          class="memo-calendar-empty"
                        >
                          No dates linked to this memo.
                        </div>
                        <div
                          v-else
                          class="memo-calendar-date-list"
                        >
                          <div
                            v-for="date in currentMemoCalendarDates"
                            :key="date"
                            class="memo-calendar-date-row"
                          >
                            <span>{{ date }}</span>
                            <AppButton
                              size="xs"
                              color="neutral"
                              variant="ghost"
                              :disabled="isCalendarDateUpdating"
                              @click="removeMemoCalendarDate(date)"
                            >
                              Remove
                            </AppButton>
                          </div>
                        </div>
                      </div>
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

            <!-- Related links -->
            <MemoLinkCardView
              v-if="memoVM.data.memo"
              :memo-title="memoVM.data.memo.title"
              :links="memoVM.data.links"
              :files="memoVM.data.linkedFiles"
              @open-context="openContextView"
              @open-context-window="openContextWindowFromUrl"
            />

            <!-- Margin for editor scroll -->
            <div class="flex h-[calc(100vh-40px)] items-center justify-center">
              <p class="font-bold text-slate-400">
                Happy writing... 📝
              </p>
            </div>
          </div>

          <ContextView
            v-if="isContextViewOpen"
            :memo="contextMemo"
            :is-loading="isContextMemoLoading"
            :has-error="hasContextMemoError"
            :target-hash="contextViewHash"
            @close="closeContextView"
            @open-window="openContextMemoInWindow"
          />
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
import ContextView from './view/context-view/ContextView.vue';
import { openContextWindow } from './view/context-view/openContextWindow';
import DeleteMemoDialog from './view/edit-memo/DeleteMemoDialog.vue';
import { useMemoEditingActions } from './view/edit-memo/useMemoEditingActions';
import { useMemoMachine } from './view/edit-memo/useMemoMachine';
import { useMemoRouteTarget } from './view/edit-memo/useMemoRouteTarget';
import { useMemoTitleBackfill } from './view/edit-memo/useMemoTitleBackfill';
import MemoLinkCardView from './view/navigate-memo/MemoLinkCardView/Index.vue';
import OutlinePanel from './view/navigate-memo/OutlinePanel.vue';
import { useMemoEditingKanban } from './view/organize-memo/memoEditingKanban';
import ExportDialogToSelectTargets from './view/share-memo/ExportDialogToSelectTargets.vue';
import { useMemoExport } from './view/share-memo/memoExport';
import { clearNewMemoTemplateQuery } from './view/start-memo-from-template/clearNewMemoTemplateQuery';
import { useTemplateApply } from './view/start-memo-from-template/useTemplateApply';
import { useTemplateStartIntent } from './view/start-memo-from-template/useTemplateStartIntent';
import { getLocalDateString } from '../workspace-calendar/calendarUtils';

import type { DeleteMemoDialogHandle } from './view/edit-memo/useMemoMachine';
import type { DropdownMenuItem } from '@nuxt/ui';
import type { NodeViewProps } from '@tiptap/vue-3';
import type { LocationQueryRaw } from 'vue-router';
import type { InboxFileItem, ManagedFileListItem } from '~/models/file';
import type { MemoTemplateIndexItem } from '~/models/memoTemplate';

import AppInput from '~/app/elements/AppInput.vue';
import AppSelect from '~/app/elements/AppSelect.vue';
import IconButton from '~/app/elements/IconButton.vue';
import { buildExtensions, CodeBlockComponent, dispatchEditorMsg, EditorAction, TableComponent } from '~/app/features/editor';
import { mergeUniqueMemoItems } from '~/app/features/focus-memo/focusMemoUtils';
import { useFocusMemoListReadModel, useGlobalStatusBoardReadModel, useTodayCalendarMemoListReadModel } from '~/app/features/memo-browsing';
import { useCurrentMemoReadModel } from '~/app/features/memo-editing/resource/read-model';
import { loadMemoTemplates } from '~/app/features/memo-templates';
import { SearchPalette } from '~/app/features/search';
import { command } from '~/external/tauri/command';
import { useQuery } from '~/resource-runtime/useQuery';
import { calendarDayCommand } from '~/resources/calendar-day/commands';
import { fileCommand } from '~/resources/file/commands';
import { memoDetailQuery } from '~/resources/memo/queries';
import { AppError } from '~/utils/error';
import { useConsoleLogger } from '~/utils/logger';
import { buildMemoTitleFromSlug, encodeForSlug } from '~/utils/slug';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { ui } = useUIState();
const { workspaceSlug, memoSlug } = useMemoRouteTarget(route);
const extensions = buildExtensions({
  CodeBlockComponent: CodeBlockComponent as Component<NodeViewProps>,
  TableComponent: TableComponent as Component<NodeViewProps>,
  getHeadingFoldStorageKey: () => `${workspaceSlug.value}/${memoSlug.value}`,
});
const memoVM = useCurrentMemoReadModel();
const globalStatusVM = useGlobalStatusBoardReadModel();
const focusMemoVM = useFocusMemoListReadModel();
const todayCalendarMemoVM = useTodayCalendarMemoListReadModel();
const doneTodayMemoSlugs = computed(() => new Set(focusMemoVM.value.data.doneTodayItems.map(memo => memo.slug_title)));
const activeFocusCount = computed(() => {
  const focusItems = mergeUniqueMemoItems(
    globalStatusVM.value.data.nowItems,
    todayCalendarMemoVM.value.data.items,
  );
  return focusItems.filter(memo => !doneTodayMemoSlugs.value.has(memo.slug_title)).length;
});
const toggleFocusPane = () => {
  ui.value.isFocusPaneOpen = !ui.value.isFocusPaneOpen;
};
const { memoTitle } = useMemoTitleBackfill(computed(() => memoVM.value.data.memo));
const {
  kanbans,
  kanbanSelections,
  isKanbanLoading,
  isKanbanUpdating,
  getStatuses,
  applyKanbanStatus,
  loadKanbanEntries,
} = useMemoEditingKanban({
  workspaceSlug,
  memoSlug,
});
const primaryKanban = computed(() => kanbans.value[0] ?? null);
const primaryStatusOptions = computed(() => {
  const kanban = primaryKanban.value;
  if (!kanban) return [];
  return getStatuses(kanban.id).map(status => ({
    label: status.name,
    value: status.id,
  }));
});
const isPrimaryStatusControlDisabled = computed(() => {
  const kanban = primaryKanban.value;
  return !kanban || isKanbanLoading.value || isKanbanUpdating(kanban.id) || !memoVM.value.data.memo;
});
const normalizeStatusSelection = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') return null;
  const id = typeof value === 'number' ? value : Number(value);
  return Number.isNaN(id) ? null : id;
};
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
await command.memo.recordView({
  workspaceSlugName: workspaceSlug.value,
  memoSlugTitle: memoSlug.value,
});

const resolvedCurrentMemo = computed(() => {
  const memo = memoVM.value.data.memo;
  if (!memo) {
    throw new Error('Memo is not loaded.');
  }
  return memo;
});
const memoCalendarDate = ref(getLocalDateString());
const isMemoCalendarDialogOpen = ref(false);
const isCalendarDateUpdating = ref(false);
const currentMemoCalendarDates = ref<string[]>([]);
const memoCalendarInitialFocusEl = ref<HTMLDivElement | null>(null);
const loadMemoCalendarDates = async () => {
  const memo = memoVM.value.data.memo;
  if (!memo) {
    currentMemoCalendarDates.value = [];
    return;
  }

  try {
    currentMemoCalendarDates.value = await calendarDayCommand.listMemoDates({
      workspaceSlugName: workspaceSlug.value,
      memoSlugTitle: memo.slug_title,
    });
  }
  catch (error) {
    console.error(error);
    toast.add({
      title: 'Failed to load memo dates.',
      color: 'error',
      icon: iconKey.failed,
    });
  }
};
const canAddMemoCalendarDate = computed(() =>
  !!memoVM.value.data.memo
  && /^\d{4}-\d{2}-\d{2}$/.test(String(memoCalendarDate.value))
  && !currentMemoCalendarDates.value.includes(String(memoCalendarDate.value))
  && !isCalendarDateUpdating.value,
);

const openMemoCalendarDialog = async () => {
  isMemoCalendarDialogOpen.value = true;
  await loadMemoCalendarDates();
};

const preventMemoCalendarAutoFocus = (event: Event) => {
  event.preventDefault();
  nextTick(() => {
    memoCalendarInitialFocusEl.value?.focus();
  });
};

const addMemoCalendarDate = async () => {
  const memo = memoVM.value.data.memo;
  if (!memo || !canAddMemoCalendarDate.value) return;

  try {
    isCalendarDateUpdating.value = true;
    await calendarDayCommand.addMemo({
      workspaceSlugName: workspaceSlug.value,
      date: String(memoCalendarDate.value),
      memoSlugTitle: memo.slug_title,
    });
    await loadMemoCalendarDates();
    toast.add({
      title: 'Added memo date.',
      duration: 1200,
      icon: iconKey.success,
    });
  }
  catch (error) {
    console.error(error);
    toast.add({
      title: 'Failed to add memo date.',
      color: 'error',
      icon: iconKey.failed,
    });
  }
  finally {
    isCalendarDateUpdating.value = false;
  }
};

const removeMemoCalendarDate = async (date: string) => {
  const memo = memoVM.value.data.memo;
  if (!memo) return;

  try {
    isCalendarDateUpdating.value = true;
    await calendarDayCommand.removeMemo({
      workspaceSlugName: workspaceSlug.value,
      date,
      memoSlugTitle: memo.slug_title,
    });
    await loadMemoCalendarDates();
    toast.add({
      title: 'Removed memo date.',
      duration: 1200,
      icon: iconKey.success,
    });
  }
  catch (error) {
    console.error(error);
    toast.add({
      title: 'Failed to remove memo date.',
      color: 'error',
      icon: iconKey.failed,
    });
  }
  finally {
    isCalendarDateUpdating.value = false;
  }
};

watch(() => memoVM.value.data.memo?.slug_title ?? null, () => {
  memoCalendarDate.value = getLocalDateString();
  void loadMemoCalendarDates();
});

await loadMemoCalendarDates();

type MemoSnapshot = {
  title: string;
  content: string;
};

const lastSavedSnapshot = ref<MemoSnapshot>({
  title: resolvedCurrentMemo.value.title,
  content: resolvedCurrentMemo.value.content,
});
const isApplyingExternalSnapshot = ref(false);

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
const contextViewWorkspaceSlug = ref('');
const contextViewMemoSlug = ref('');
const contextViewHash = ref('');
const isContextViewOpen = computed(() => contextViewWorkspaceSlug.value.length > 0 && contextViewMemoSlug.value.length > 0);
const { snapshot: contextMemoSnap } = useQuery(memoDetailQuery, {
  workspaceSlug: contextViewWorkspaceSlug,
  memoSlug: contextViewMemoSlug,
}, {
  enabled: isContextViewOpen,
});
const contextMemo = computed(() => contextMemoSnap.value.current ?? null);
const isContextMemoLoading = computed(() => contextMemoSnap.value.status === 'loading');
const hasContextMemoError = computed(() => contextMemoSnap.value.status === 'error');

const parseMemoPath = (url: string) => {
  let resolvedUrl: URL;
  try {
    resolvedUrl = new URL(url, window.location.origin);
  }
  catch {
    return null;
  }

  const [targetWorkspaceSlug, targetMemoSlug] = resolvedUrl.pathname
    .split('/')
    .filter(Boolean);
  if (!targetWorkspaceSlug || !targetMemoSlug) {
    return null;
  }

  return {
    workspaceSlug: encodeForSlug(decodeURIComponent(targetWorkspaceSlug)),
    memoSlug: encodeForSlug(decodeURIComponent(targetMemoSlug)),
    hash: resolvedUrl.hash,
  };
};

const openContextView = (url: string) => {
  const target = parseMemoPath(url);
  if (!target) {
    return;
  }

  contextViewWorkspaceSlug.value = target.workspaceSlug;
  contextViewMemoSlug.value = target.memoSlug;
  contextViewHash.value = target.hash;
};

const buildContextWindowPath = (target: NonNullable<ReturnType<typeof parseMemoPath>>) =>
  `/${target.workspaceSlug}/${target.memoSlug}/_context${target.hash}`;

const openContextWindowForTarget = (
  target: NonNullable<ReturnType<typeof parseMemoPath>>,
  title: string,
) => {
  const contextWindow = openContextWindow({
    path: buildContextWindowPath(target),
    title,
  });
  void contextWindow.once('tauri://error', (event) => {
    toast.add({
      title: 'Failed to open Context window.',
      description: String(event.payload),
      color: 'error',
    });
  });
};

const openContextWindowFromUrl = (url: string, title?: string) => {
  const target = parseMemoPath(url);
  if (!target) {
    return;
  }

  openContextWindowForTarget(
    target,
    title ?? buildMemoTitleFromSlug(target.memoSlug),
  );
};

const closeContextView = () => {
  contextViewWorkspaceSlug.value = '';
  contextViewMemoSlug.value = '';
  contextViewHash.value = '';
};

const openContextMemoInWindow = () => {
  if (!isContextViewOpen.value || !contextMemo.value) {
    return;
  }

  openContextWindowForTarget({
    workspaceSlug: contextViewWorkspaceSlug.value,
    memoSlug: contextViewMemoSlug.value,
    hash: contextViewHash.value,
  }, contextMemo.value.title);
  closeContextView();
};

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
  onChanged: (_reason) => {
    if (isApplyingExternalSnapshot.value) {
      return;
    }
    void dispatchMemoEvent({ type: 'memo/content-updated', payload: { dirty: computeDirty() } });
  },
  onLinksChanged: (added, deleted) => { void dispatchMemoEvent({ type: 'memo/links-changed', payload: { added, deleted } }); },
  onOpenContext: openContextView,
  onOpenContextWindow: openContextWindowFromUrl,
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
  if (isApplyingExternalSnapshot.value) {
    return;
  }
  void dispatchMemoEvent({ type: 'memo/title-updated', payload: { dirty: computeDirty() } });
});

watch(() => memoVM.value.data.memo, (memo) => {
  if (!memo || memoState.value.type !== 'clean') {
    return;
  }

  const nextSnapshot = {
    title: memo.title,
    content: memo.content,
  };
  if (
    nextSnapshot.title === lastSavedSnapshot.value.title
    && nextSnapshot.content === lastSavedSnapshot.value.content
  ) {
    return;
  }

  const currentEditor = editor.value;
  if (!currentEditor) {
    lastSavedSnapshot.value = nextSnapshot;
    memoTitle.value = nextSnapshot.title;
    return;
  }

  try {
    isApplyingExternalSnapshot.value = true;
    lastSavedSnapshot.value = nextSnapshot;
    memoTitle.value = nextSnapshot.title;
    currentEditor.commands.setContent(JSON.parse(nextSnapshot.content), false);
  }
  finally {
    nextTick(() => {
      isApplyingExternalSnapshot.value = false;
    });
  }
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

type EditorToolbarOverflowMode = 'medium' | 'narrow';

function getEditorToolbarActionClass(index: number) {
  return {
    'memo-editor-toolbar-action--medium-overflow': index >= 5,
    'memo-editor-toolbar-action--narrow-overflow': index >= 3,
  };
}

function getEditorToolbarOverflowMenuItems(
  currentEditor?: Parameters<typeof getEditorToolbarActionItems>[0],
  mode: EditorToolbarOverflowMode = 'medium',
): DropdownMenuItem[][] {
  const firstOverflowIndex = mode === 'narrow' ? 3 : 5;
  return [
    getEditorToolbarActionItems(currentEditor).slice(firstOverflowIndex).map(item => ({
      label: getEditorToolbarMenuLabel(item),
      icon: item.icon,
      onSelect: () => {
        if (currentEditor) {
          dispatchEditorMsg(currentEditor, item.msg);
        }
      },
    })),
  ];
}

function getEditorToolbarMenuLabel(
  item: ReturnType<typeof getEditorToolbarActionItems>[number],
) {
  if (item.label) return item.label;

  switch (item.msg.type) {
    case 'toggleStyle':
      return {
        bold: 'Bold',
        italic: 'Italic',
        strike: 'Strikethrough',
      }[item.msg.style];
    case 'toggleBulletList':
      return 'Bullet list';
    case 'toggleOrderedList':
      return 'Numbered list';
    case 'toggleBlockQuote':
      return 'Quote';
    case 'toggleCode':
      return 'Inline code';
    case 'insertTable':
      return 'Insert table';
    case 'clearFormat':
      return 'Clear format';
    default:
      return item.msg.type;
  }
}

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
  ],
  [
    {
      label: 'Export Markdown',
      icon: iconKey.save,
      onSelect: () => { void dispatchAction({ type: 'action/export-markdown' }); },
    },
    {
      label: 'Export HTML',
      icon: iconKey.html,
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
      icon: iconKey.save,
      action: () => { void dispatchAction({ type: 'action/export-selected-markdown' }); },
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

const memoCalendarDialogCardUi = {
  header: 'px-4 py-3 sm:px-4',
  body: 'px-4 py-3 sm:px-4 sm:py-3',
} as const;

const memoCalendarDialogModalUi = {
  content: 'w-auto max-w-[calc(100vw-1rem)] bg-transparent p-0 shadow-none ring-0',
} as const;

const memoCalendarDialogContent = {
  onOpenAutoFocus: preventMemoCalendarAutoFocus,
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
const { exportMode, isSelectingTargets, exportCandidates, exportPagesV2 } = useMemoExport({
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
  },
  export: {
    openExportTargetSelection: () => {
      exportMode.value = 'selectingTargets';
    },
  },
});

const copyLinkToHeadingAction = (fullUrl: string, titleWithHeading: string) => {
  void dispatchAction({ type: 'action/copy-link-to-heading', fullUrl, titleWithHeading });
};
</script>

<style>
.memo-editing-shell {
  --memo-editor-toolbar-height: 2.5rem;

  display: flex;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-width: 0;
}

.memo-editing-content {
  display: flex;
  width: 100%;
  height: 100%;
  min-width: 0;
}

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
}

.focus-list-button {
  min-height: 1.75rem;
}

.focus-list-count {
  min-width: 1rem;
  border-radius: 999px;
  padding: 0 0.25rem;
  font-size: 0.6875rem;
  text-align: center;
  color: white;
  background: var(--color-primary);
}

.focus-status-control {
  display: flex;
  pointer-events: auto;
  align-items: center;
  border: 1px solid var(--color-border-light);
  border-radius: 0.5rem;
  padding: 0.25rem;
  background: var(--color-background);
  box-shadow: 0 8px 24px rgb(15 23 42 / 0.12);
}

.memo-floating-status {
  display: flex;
  pointer-events: auto;
  justify-content: flex-end;
  margin-bottom: 0.375rem;
}

.memo-status-badge {
  flex-shrink: 0;
}

.memo-status-badge--floating {
  box-shadow: 0 8px 24px rgb(15 23 42 / 0.1);
}

.memo-action-group .memo-toolbar-status-select.memo-toolbar-status-select {
  width: 10rem;
  height: 1.75rem;
  min-height: 1.75rem;
  padding-left: 0.5rem;
  font-size: 0.8125rem;
}

.memo-action-group {
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
}

.memo-action-group--status {
  margin-right: 0.25rem;
}

.memo-calendar-button-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.memo-calendar-count {
  position: absolute;
  right: -0.25rem;
  bottom: -0.25rem;
  min-width: 0.875rem;
  border-radius: 999px;
  padding: 0 0.25rem;
  color: white;
  background: var(--color-primary);
  font-size: 0.625rem;
  line-height: 0.875rem;
  text-align: center;
}

.memo-calendar-dialog {
  width: min(28rem, calc(100vw - 2rem));
}

.memo-calendar-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.memo-calendar-add-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) max-content;
  gap: 0.5rem;
}

.memo-calendar-empty {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}

.memo-calendar-date-list {
  display: flex;
  max-height: min(20rem, 50vh);
  flex-direction: column;
  overflow-y: auto;
  border: 1px solid var(--color-border-light);
  border-radius: 0.5rem;
}

.memo-calendar-date-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.375rem 0.5rem;
  border-bottom: 1px solid var(--color-border-light);
  color: var(--color-text-primary);
  font-size: 0.8125rem;
}

.memo-calendar-date-row:last-child {
  border-bottom: 0;
}

@media (max-width: 1100px) {
  .memo-editing-content--with-context {
    flex-direction: column;
  }
}
</style>
