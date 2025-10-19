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
          :memo-title="memoVM.data.memo?.title || memoTitle"
          :memo-slug="memoSlug"
          :workspace-slug="workspaceSlug"
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
          <MemoEditorShell
            v-model:memo-title="memoTitle"
            :editor="editor"
          >
            <template #toolbar="{ editor: _editor }">
              <EditorToolbarButton
                v-for="(item) in editorToolbarActionItems"
                :key="item.msg.type"
                :label="item.label"
                :icon="item.icon"
                @exec="dispatchEditorMsg(_editor, item.msg)"
              />
            </template>

            <template #context-menu>
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
          </MemoEditorShell>

          <!-- Related links -->
          <MemoLinkCardView
            v-if="memoVM.data.memo"
            :memo-title="memoVM.data.memo.title"
            :links="memoVM.data.links"
          />
          <MarginForEditorScroll />
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
import { mergeAttributes } from '@tiptap/core';
import Focus from '@tiptap/extension-focus';
import Link from '@tiptap/extension-link';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import StarterKit from '@tiptap/starter-kit';

import { useUpdateMemoEditAction } from './actions/updateMemoEdit';

import type { DropdownMenuItem } from '@nuxt/ui';
import type { NodeViewProps, Editor as _Editor } from '@tiptap/vue-3';
import type { EditorMsg } from '~/lib/editor/msg';

import DeleteMemoWorkflow from '~/app/features/memo/delete/DeleteMemoWorkflow.vue';
import AltEditDialog from '~/app/features/memo/editor/AltEditDialog.vue';
import LinkEditDialog from '~/app/features/memo/editor/LinkEditDialog.vue';
import MemoEditorShell from '~/app/features/memo/editor/MemoEditorShell.vue';
import { useCopyActions } from '~/app/features/memo/editor/useCopyActions';
import ExportDialogToCopyResult from '~/app/features/memo/export/ExportDialogToCopyResult.vue';
import ExportDialogToSelectTargets from '~/app/features/memo/export/ExportDialogToSelectTargets.vue';
import { useExportLinked } from '~/app/features/memo/export/useExportLinked';
import OutlinePanel from '~/app/features/memo/outline/OutlinePanel.vue';
import SearchPalette from '~/app/features/search/SearchPalette.vue';
import CodeBlockComponent from '~/components/Editor/CodeBlock/Index.vue';
import EditorToolbarButton from '~/components/EditorToolbarButton.vue';
import { bookmarkCommand } from '~/external/tauri/bookmark';
import { linkCommand } from '~/external/tauri/link';
import { memoCommand } from '~/external/tauri/memo';
import * as EditorAction from '~/lib/editor/action.js';
import { dispatchEditorMsg } from '~/lib/editor/dispatcher';
import * as CustomExtension from '~/lib/editor/extensions';
import * as EditorQuery from '~/lib/editor/query.js';
import { emitEvent as emitEvent_ } from '~/resource-state/infra/eventBus';
import { loadMemo, requireMemoValue } from '~/resource-state/resources/memo';
import { loadMemoLinkCollection } from '~/resource-state/resources/memoLinkCollection';
import { useCurrentMemoViewModel } from '~/resource-state/viewmodels/currentMemo';
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

await usePageLoader(async () => {
  await loadMemo(workspaceSlug.value, memoSlug.value);
});

const extensions = [
  StarterKit.configure({ heading: false, codeBlock: false }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      target: null,
    },
  }).extend({
    // Unset link after link text
    inclusive: false,
    renderHTML({ HTMLAttributes }) {
      const href = HTMLAttributes.href;
      if (!isInternalLink(href)) {
        HTMLAttributes.class = `${HTMLAttributes.class || ''} external-link`.trim();
      }
      return ['a', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
    },
  }),
  CustomExtension.imageExtention(),
  CustomExtension.headingExtension(),
  CustomExtension.codeBlockExtension(CodeBlockComponent as Component<NodeViewProps>),
  CustomExtension.codeBlockNavExtension(),
  Focus.configure({
    className: 'has-focus',
    mode: 'deepest',
  }),
  TaskList,
  TaskItem.configure({
    nested: true,
    HTMLAttributes: {
      class: 'custom-task-item',
    },
  }),
  CustomExtension.CustomTab,
];

const router = useRouter();
const { createEffectHandler } = useEffectHandler();
const memoVM = useCurrentMemoViewModel();
const recentStore = useRecentMemoStore();

const memo = requireMemoValue();

const memoTitle = ref(memo.value.title);

/* --- States for editor --- */

// Reference to control the link palette component
const linkPaletteRef = ref<InstanceType<typeof SearchPalette> | null>(null);

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
  saveMemo: async () => { await saveMemo(); },
  updateLinks: async (added, deleted) => {
    await Promise.all([
      ...added.map(href => linkCommand.create({ workspaceSlug: workspaceSlug.value, memoSlug: memoSlug.value }, href)),
      ...deleted.map(href => linkCommand.delete({ workspaceSlug: workspaceSlug.value, memoSlug: memoSlug.value }, href)),
    ]);
    await loadMemoLinkCollection(workspaceSlug.value, memoSlug.value);
  },
  route,
  router,
});

const handleKeydown = (event: KeyboardEvent) => {
  if (isCmdKey(event) && event.key === 's') {
    event.preventDefault();
    saveMemo();
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

  if (memoVM.value.data.memo) {
    const slug = memoSlug.value;
    const workspace = workspaceSlug.value;
    const hash = route.hash || undefined;

    const exists = recentStore.history.some(
      m => m.slug === slug && m.workspace === workspace && m.hash === hash,
    );

    if (!exists) {
      recentStore.addMemo(memoVM.value.data.memo.title, slug, workspace, hash);
    }
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
  document.getElementById('main')?.removeEventListener('scroll', handleScroll);

  // Destroy editor
  editor.value?.destroy();
});

/**
 * Editor toolbar action items
 */
const editorToolbarActionItems: {
  label?: string;
  icon?: string;
  msg: EditorMsg;
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
  { icon: iconKey.clearFormat, msg: { type: 'clearFormat' } },
];

const toggleBookmark = async () => {
  if (!memoVM.value.data.memo) {
    return;
  }

  if (!memoVM.value.data.isBookmarked) {
    await bookmarkCommand.add(workspaceSlug.value, memoSlug.value);
  }
  else {
    await bookmarkCommand.delete(workspaceSlug.value, memoSlug.value);
  }
  emitEvent('bookmark/updated', { workspaceSlug: workspaceSlug.value });
  emitEvent_('bookmark/updated', { workspaceSlug: workspaceSlug.value });
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
      onSelect: () => { runDeleteWorkflow(); },
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

/* --- Commands --- */
const { executeUpdateMemoEdit } = useUpdateMemoEditAction();

async function saveMemo() {
  if (!editor.value) {
    throw new Error('Editor instance not set.');
  }

  const currentTitle = memoTitle.value;
  if (!currentTitle) {
    window.alert('Please set title.');
    return;
  }

  const currentTitleForSlug = encodeForSlug(currentTitle);

  await createEffectHandler((editor: _Editor, title: string) => executeUpdateMemoEdit(
    {
      workspaceSlug: workspaceSlug.value,
      memoSlug: memoSlug.value,
    },
    editor,
    title,
    headImageRef.value ?? '',
    route.hash,
  ))
    .withToast('Saved', 'Failed to save')
    .withCallback(() => {
      // Emit to both event buses (legacy store + resource-state rules)
      emitEvent('memo/updated', { workspaceSlug: workspaceSlug.value, memoSlug: currentTitleForSlug });
      emitEvent_('memo/updated', { workspaceSlug: workspaceSlug.value, memoSlug: currentTitleForSlug });
      router.replace(`/${workspaceSlug.value}/${currentTitleForSlug}${route.hash}`);
    })
    .execute(editor.value, currentTitle);
}

const deleteMemoWithUserConfirmation = ref<InstanceType<typeof DeleteMemoWorkflow>>();
async function runDeleteWorkflow() {
  if (!deleteMemoWithUserConfirmation.value) {
    throw new Error('Workflow ref is not set correctlly.');
  }

  const workflowResult = await deleteMemoWithUserConfirmation.value.run(async () => {
    const result = await createEffectHandler(() => memoCommand.trash({ workspaceSlug: workspaceSlug.value, memoSlug: memoSlug.value }))
      .withToast('Delete memo successfully.', 'Failed to delete.')
      .execute();

    if (!result.ok) throw new Error ('Failed to delete.');
  });

  if (workflowResult === 'completed') {
    // Emit to both buses so lists refresh
    emitEvent('memo/deleted', { workspaceSlug: workspaceSlug.value });
    emitEvent_('memo/deleted', { workspaceSlug: workspaceSlug.value });
    router.replace(`/${workspaceSlug.value}`);
  }
}

const { copyPageAsMarkdown, copyPageAsHtml, copySelectedTextAsMarkdown, copyLinkToHeading } = useCopyActions();

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
</style>
