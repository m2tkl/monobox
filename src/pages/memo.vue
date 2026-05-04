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

      <DeleteMemoWorkflow ref="deleteMemoWithUserConfirmation" />

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
import { CellSelection, TableMap } from 'prosemirror-tables';

import type { DropdownMenuItem } from '@nuxt/ui';
import type { Editor as TiptapEditor } from '@tiptap/core';
import type { NodeViewProps } from '@tiptap/vue-3';
import type { EditorMsgType } from '~/app/features/editor';
import type { MemoEvent, MemoState } from '~/app/features/memo/memoMachine';
import type { DeleteMemoWorkflowHandle } from '~/app/features/memo/useMemoDeleteAction';
import type { MemoTemplateIndexItem } from '~/models/memoTemplate';

import { buildExtensions, EditorAction, dispatchEditorMsg, EditorQuery } from '~/app/features/editor';
import CodeBlockComponent from '~/app/features/editor/nodeviews/CodeBlock';
import {
  CREATED_QUERY_SOURCE_BLANK,
  CREATED_QUERY_SOURCE_NAMED,
} from '~/app/features/memo/creation';
import DeleteMemoWorkflow from '~/app/features/memo/delete/DeleteMemoWorkflow.vue';
import AltEditDialog from '~/app/features/memo/editor/AltEditDialog.vue';
import EditorToolbarButton from '~/app/features/memo/editor/EditorToolbarButton.vue';
import { useImagePreview } from '~/app/features/memo/editor/ImagePreviewDialog/useImagePreview';
import LinkEditDialog from '~/app/features/memo/editor/LinkEditDialog.vue';
import MemoEditor from '~/app/features/memo/editor/MemoEditor.vue';
import { useMemoCopy } from '~/app/features/memo/editor/useMemoCopy';
import { useMemoEditor } from '~/app/features/memo/editor/useMemoEditor';
import ExportDialogToCopyResult from '~/app/features/memo/export/ExportDialogToCopyResult.vue';
import ExportDialogToSelectTargets from '~/app/features/memo/export/ExportDialogToSelectTargets.vue';
import { useExportLinked } from '~/app/features/memo/export/useExportLinked';
import { useMemoKanbanAssignments } from '~/app/features/memo/kanban/useMemoKanbanAssignments';
import MemoLinkCardView from '~/app/features/memo/links/MemoLinkCardView/Index.vue';
import OutlinePanel from '~/app/features/memo/outline/OutlinePanel.vue';
import { memoDetailQuery } from '~/app/features/memo/queries/memoDetailQuery';
import { memoLinksQuery } from '~/app/features/memo/queries/memoLinksQuery';
import {
  getDefaultMemoTemplate,
  parseTemplateContent,
  sortMemoTemplates,
} from '~/app/features/memo/template';
import { useMemoDeleteAction } from '~/app/features/memo/useMemoDeleteAction';
import { useMemoLinkSync } from '~/app/features/memo/useMemoLinkSync';
import { useMemoMachine } from '~/app/features/memo/useMemoMachine';
import { useMemoSaveAction } from '~/app/features/memo/useMemoSaveAction';
import SearchPalette from '~/app/features/search/SearchPalette.vue';
import IconButton from '~/app/ui/IconButton.vue';
import { command } from '~/external/tauri/command';
import { emitEvent } from '~/resource-state/infra/eventBus';
import { loadKanbans } from '~/resource-state/resources/kanbanCollection';
import { useCurrentMemoViewModel } from '~/resource-state/viewmodels/currentMemo';
import { useKanbanCollectionViewModel } from '~/resource-state/viewmodels/kanbanCollection';
import { useConsoleLogger } from '~/utils/logger';
import { getEncodedMemoSlugFromPath, getEncodedWorkspaceSlugFromPath } from '~/utils/route';

definePageMeta({
  path: '/:workspace/:memo',
  validate(route) {
    return route.params.memo !== '_settings';
  },
});

const route = useRoute();
const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');
const memoSlug = computed(() => getEncodedMemoSlugFromPath(route) || '');

const extensions = buildExtensions({
  CodeBlockComponent: CodeBlockComponent as Component<NodeViewProps>,
});

const router = useRouter();
const toast = useToast();
const { createEffectHandler } = useEffectHandler();
const memoVM = useCurrentMemoViewModel();
const kanbanVM = useKanbanCollectionViewModel();
const { saveMemo } = useMemoSaveAction();
const { deleteMemo: executeDeleteMemo } = useMemoDeleteAction();
const { syncMemoLinks } = useMemoLinkSync();
const logger = useConsoleLogger('pages/memo');
const isApplyingTemplate = ref(false);
const selectedTemplateId = ref<number>();
const isTemplatePickerDismissed = ref(false);
const availableTemplates = ref<MemoTemplateIndexItem[]>([]);
const hasAttemptedDefaultTemplate = ref(false);

type MemoSnapshot = {
  title: string;
  content: string;
};

const kanbans = computed(() => kanbanVM.value.data.items);
const {
  kanbanEntryMap,
  kanbanSelections,
  isKanbanLoading,
  isKanbanModalOpen,
  isKanbanUpdating,
  openKanbanModal,
  loadKanbanEntries,
  getStatusOptions,
  applyKanbanStatus,
} = useMemoKanbanAssignments({
  workspaceSlug,
  memoSlug,
  kanbans,
  toast,
});

await usePageLoader(async () => {
  const [templates] = await Promise.all([
    command.memoTemplate.list({ slugName: workspaceSlug.value }),
    memoDetailQuery.fetch({
      workspaceSlug: workspaceSlug.value,
      memoSlug: memoSlug.value,
    }),
    memoLinksQuery.fetch({
      workspaceSlug: workspaceSlug.value,
      memoSlug: memoSlug.value,
    }),
    loadKanbans(workspaceSlug.value),
  ]);
  availableTemplates.value = sortMemoTemplates(templates);
  await loadKanbanEntries();
});

const memo = computed(() => {
  const currentMemo = memoVM.value.data.memo;
  if (!currentMemo) {
    throw new Error('Memo is not loaded.');
  }
  return currentMemo;
});
const memoTitle = ref(memo.value.title);

const lastSavedSnapshot = ref<MemoSnapshot>({
  title: memo.value.title,
  content: memo.value.content,
});

const pendingDeleteAfterSave = ref(false);
const createdQueryValue = computed(() =>
  typeof route.query.created === 'string'
    ? route.query.created
    : undefined,
);
const isNewMemoCreationFlow = computed(() =>
  createdQueryValue.value === CREATED_QUERY_SOURCE_BLANK
  || createdQueryValue.value === CREATED_QUERY_SOURCE_NAMED,
);
const requestedTemplateSlug = computed(() =>
  typeof route.query.template === 'string'
    ? route.query.template
    : undefined,
);
const shouldSkipDefaultTemplate = computed(() => route.query.skipDefaultTemplate === 'true');
const hasRequestedTemplate = computed(() => requestedTemplateSlug.value != null);
const hasDefaultMemoTemplate = computed(() => getDefaultMemoTemplate(availableTemplates.value) != null);
const canOfferManualTemplateSelection = computed(() =>
  !isTemplatePickerDismissed.value
  && !shouldSkipDefaultTemplate.value
  && !hasRequestedTemplate.value
  && !hasDefaultMemoTemplate.value,
);
const shouldShowTemplatePicker = computed(() =>
  isNewMemoCreationFlow.value
  && canOfferManualTemplateSelection.value
  && availableTemplates.value.length > 0,
);
const isEditorBodyEmpty = computed(() => Boolean(editor.value?.isEmpty));
const shouldShowInlineTemplateSuggestions = computed(() =>
  shouldShowTemplatePicker.value && isEditorBodyEmpty.value,
);

const getCurrentSnapshot = (): MemoSnapshot => {
  const currentContent = editor.value ? JSON.stringify(editor.value.getJSON()) : memo.value.content;
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

const deleteMemoWithUserConfirmation = ref<DeleteMemoWorkflowHandle | null>(null);
let dispatch: (event: MemoEvent) => void = () => {};

async function clearCreatedQueryFlag() {
  if (
    createdQueryValue.value == null
    && requestedTemplateSlug.value == null
    && !shouldSkipDefaultTemplate.value
  ) {
    return;
  }

  const {
    created: _created,
    template: _template,
    skipDefaultTemplate: _skipDefaultTemplate,
    ...nextQuery
  } = route.query;
  await router.replace({
    path: route.path,
    query: nextQuery,
    hash: route.hash,
  });
}

function focusTitleFieldIfNeeded() {
  if (createdQueryValue.value !== CREATED_QUERY_SOURCE_BLANK) {
    return;
  }

  nextTick(() => {
    window.setTimeout(() => {
      memoEditorRef.value?.focusTitleField(true);
    }, 50);
  });
}

async function saveMemoContent(mode: 'explicit' | 'auto') {
  return saveMemo({
    target: {
      workspaceSlug: workspaceSlug.value,
      memoSlug: memoSlug.value,
    },
    editor: editor.value,
    title: memoTitle.value,
    thumbnailImage: headImageRef.value ?? '',
    routeHash: route.hash,
    mode,
  });
}

async function applyTemplate(templateSlug: string, options?: { toastTitle?: string }) {
  if (!editor.value || !memoVM.value.data.memo) {
    return false;
  }

  isApplyingTemplate.value = true;

  try {
    const templateMemo = await command.memoTemplate.get({
      workspaceSlugName: workspaceSlug.value,
      templateSlugName: templateSlug,
    });

    selectedTemplateId.value = templateMemo.id;
    editor.value.commands.setContent(parseTemplateContent(templateMemo));
    await nextTick();

    const result = await saveMemoContent('auto');
    if (!result.ok) {
      dispatch({ type: 'memo/save-failed', payload: { error: result.error } });
      toast.add({
        title: 'Failed to apply template',
        description: 'Please try again',
        color: 'error',
        icon: iconKey.failed,
      });
      return false;
    }

    dispatch({ type: 'memo/save-succeeded', payload: { memoSlug: result.memoSlug } });
    isTemplatePickerDismissed.value = true;
    await clearCreatedQueryFlag();
    toast.add({
      title: options?.toastTitle ?? 'Template applied',
      icon: iconKey.success,
      duration: 1000,
    });
    return true;
  }
  catch (error) {
    logger.error(error);
    dispatch({ type: 'memo/save-failed', payload: { error } });
    toast.add({
      title: 'Failed to apply template',
      description: 'Please try again',
      color: 'error',
      icon: iconKey.failed,
    });
    return false;
  }
  finally {
    isApplyingTemplate.value = false;
    selectedTemplateId.value = undefined;
  }
}

const confirmDelete = async (previousState: MemoState) => {
  if (!deleteMemoWithUserConfirmation.value) {
    throw new Error('Workflow ref is not set correctlly.');
  }

  if (previousState === 'dirty') {
    const shouldSaveBeforeDelete = window.confirm('You have unsaved changes. Save before deleting?');
    if (shouldSaveBeforeDelete) {
      pendingDeleteAfterSave.value = true;
      dispatch({ type: 'memo/save-requested', payload: { mode: 'explicit' } });
      return { action: 'cancel' } as const;
    }
    else {
      const confirmDeleteWithoutSave = window.confirm('Delete without saving changes?');
      if (!confirmDeleteWithoutSave) {
        return { action: 'cancel' } as const;
      }
    }
  }

  return { action: 'proceed' } as const;
};

const deleteMemo = async (_previousState: MemoState) => {
  return executeDeleteMemo(deleteMemoWithUserConfirmation, {
    workspaceSlug: workspaceSlug.value,
    memoSlug: memoSlug.value,
  });
};

const machine = useMemoMachine('clean', {
  saveMemo: saveMemoContent,
  syncLinks: async (added, deleted) => {
    await syncMemoLinks({
      workspaceSlug: workspaceSlug.value,
      memoSlug: memoSlug.value,
    }, added, deleted);
  },
  notifyUpdated: (memoSlug) => {
    lastSavedSnapshot.value = getCurrentSnapshot();
    emitEvent('memo/updated', { workspaceSlug: workspaceSlug.value, memoSlug });
    router.replace(`/${workspaceSlug.value}/${memoSlug}${route.hash}`);
    if (pendingDeleteAfterSave.value) {
      pendingDeleteAfterSave.value = false;
      dispatch({ type: 'memo/delete-requested' });
    }
  },
  notifyDeleted: () => {
    emitEvent('memo/deleted', { workspaceSlug: workspaceSlug.value });
    router.replace(`/${workspaceSlug.value}`);
  },
  confirmDelete,
  deleteMemo,
}, {
  onTransition: ({ previous, event, next, effects }) => {
    logger.debug('memo-machine', { previous, event: event.type, next, effects: effects.map(e => e.type) });
  },
});
dispatch = machine.dispatch;

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
} = useMemoEditor(memo.value.content, {
  extensions: extensions,
  onChanged: (_reason) => { dispatch({ type: 'memo/content-changed', payload: { dirty: computeDirty() } }); },
  onLinksChanged: (added, deleted) => { dispatch({ type: 'memo/links-changed', payload: { added, deleted } }); },
  route,
  router,
});

watch(memoTitle, () => {
  dispatch({ type: 'memo/title-changed', payload: { dirty: computeDirty() } });
});

watch(isEditorBodyEmpty, async (isEmpty) => {
  if (
    isEmpty
    || isTemplatePickerDismissed.value
    || !isNewMemoCreationFlow.value
    || isApplyingTemplate.value
  ) {
    return;
  }

  isTemplatePickerDismissed.value = true;
  await clearCreatedQueryFlag();
});

onMounted(() => {
  if (createdQueryValue.value === CREATED_QUERY_SOURCE_BLANK) {
    focusTitleFieldIfNeeded();
  }
});

watch(
  [isNewMemoCreationFlow, requestedTemplateSlug, shouldSkipDefaultTemplate, availableTemplates, editor],
  async ([, templateSlug, skipDefaultTemplate]) => {
    if (hasAttemptedDefaultTemplate.value) {
      return;
    }

    if (!isNewMemoCreationFlow.value) {
      return;
    }

    if (!editor.value) {
      return;
    }

    if (templateSlug) {
      hasAttemptedDefaultTemplate.value = true;
      const isApplied = await applyTemplate(templateSlug);
      if (!isApplied) {
        const { template: _template, ...nextQuery } = route.query;
        await router.replace({
          path: route.path,
          query: nextQuery,
          hash: route.hash,
        });
        isTemplatePickerDismissed.value = false;
      }
      return;
    }

    if (skipDefaultTemplate) {
      hasAttemptedDefaultTemplate.value = true;
      isTemplatePickerDismissed.value = true;
      await clearCreatedQueryFlag();
      focusTitleFieldIfNeeded();
      return;
    }

    const defaultTemplate = getDefaultMemoTemplate(availableTemplates.value);
    if (!defaultTemplate) {
      hasAttemptedDefaultTemplate.value = true;
      return;
    }

    hasAttemptedDefaultTemplate.value = true;
    await applyTemplate(defaultTemplate.slug_name, { toastTitle: 'Default template applied' });
  },
  { immediate: true },
);

const handleKeydown = (event: KeyboardEvent) => {
  if (isCmdKey(event) && event.key === 's') {
    event.preventDefault();
    dispatch({ type: 'memo/save-requested', payload: { mode: 'explicit' } });
    return;
  }
};

function handleScroll() {
  const editorInstance = editor.value;
  const editorContainer = document.getElementById('main');
  if (!editorInstance || !editorContainer) return;

  updateActiveHeadingOnScroll(editorInstance, editorContainer);
}

/**
 * Navigate to the specified heading by updating the URL hash.
 *
 * This will add a new entry to the browser history (push).
 *
 * @param headingId - The ID of the heading to navigate to.
 */
const navigateToHeading = (id: string) => {
  router.push(`${route.path}#${id}`);
};

/**
 * Watch for changes in the URL hash and focus the corresponding heading in the editor.
 *
 * This ensures that browser back/forward navigation moves the editor focus appropriately.
 */
watch(() => route.hash, () => {
  if (!editor.value) {
    return;
  }

  if (route.hash) {
    const id = route.hash.replace(/^#/, '');
    focusHeading(editor.value, id);
  }
});

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
  document.getElementById('main')?.addEventListener('scroll', handleScroll, { passive: true });
});

const { openPreview } = useImagePreview();
// ProseMirror selection/transaction changes are not Vue-reactive by themselves.
// Bump this counter to force toolbar/table-menu getters to re-run against current editor state.
const toolbarContextVersion = ref(0);
let detachToolbarContextListeners: (() => void) | null = null;

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
  document.getElementById('main')?.removeEventListener('scroll', handleScroll);
  detachToolbarContextListeners?.();

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

/**
 * Editor toolbar action items
 */
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

function getEditorToolbarActionItems(currentEditor?: TiptapEditor) {
  // Keep toolbar item derivation behind a getter so toolbar state can depend on editor.state
  // without leaking ProseMirror-specific reactivity details into the template.
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
  // Recompute disabled states and row/column menu choice on every toolbar context bump.
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

watch(editor, (currentEditor, previousEditor) => {
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

const toggleBookmark = async () => {
  if (!memoVM.value.data.memo) {
    return;
  }

  if (!memoVM.value.data.isBookmarked) {
    await command.bookmark.add(workspaceSlug.value, memoSlug.value);
  }
  else {
    await command.bookmark.delete(workspaceSlug.value, memoSlug.value);
  }

  emitEvent('bookmark/updated', { workspaceSlug: workspaceSlug.value });
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
      onSelect: () => { dispatch({ type: 'memo/delete-requested' }); },
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
      action: () => { copySelectedTextAsMarkdown(editor.value!); },
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
const { exportMode, htmlExport, isSelectingTargets, isCopyingResult, exportCandidates, exportPagesV2 } = useExportLinked({
  workspaceSlug: () => workspaceSlug.value,
  links: computed(() => memoVM.value.data.links),
  editor,
  memoTitle,
});

/* --- Export with related pages (Step2: copy result) */

const copyExportedResult = async (textToCopy: string) => {
  await createEffectHandler((text: string) =>
    Promise.resolve(navigator.clipboard.writeText(text)),
  )
    .withToast('Exported result copied!', 'Failed to copy.')
    .withCallback(() => {
      exportMode.value = 'idle';
    })
    .execute(textToCopy);
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
