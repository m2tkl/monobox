<template>
  <NuxtLayout name="default">
    <template #main>
      <div
        class="flex size-full justify-center"
      >
        <div
          class="scrollbar border-right flex h-full w-[250px] shrink-0 flex-col gap-3"
          style="background-color: var(--color-background)"
        >
          <OutlineView
            v-if="editor"
            :editor-content="editor.getJSON()"
            :active-heading-id="activeHeadingId"
            @click="(id: any, title: string) => {
              focusHeading(editor, id);
              navigateToHeading(id);
              recentStore.addMemo(`${store.memo!.title} › ${title}`, encodeForSlug(memoSlug), workspaceSlug, `#${id}`);
            }"
            @copy-link="(id, text) => copyLinkToHeading(`${route.path}#${id}`, `${route.path}#${text}`)"
          />
        </div>

        <div
          id="main"
          class="hide-scrollbar h-full min-w-0 flex-1 overflow-y-auto"
          style="background-color: var(--color-background)"
        >
          <MemoEditor
            v-if="editor"
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
                :icon="store.isBookmarked ? iconKey.bookmarkFilled : iconKey.bookmark"
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

            <template #bubble-menu>
              <template v-if="editor.isActive('image')">
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
          </MemoEditor>

          <!-- Related links -->
          <MemoLinkCardView
            v-if="store.memo"
            :memo-title="store.memo.title"
            :links="store.links"
          />
          <MarginForEditorScroll />
        </div>
      </div>
    </template>

    <template #actions>
      <div v-if="store.workspaceMemos && store.workspace && store.memo">
        <SearchPalette
          ref="linkPaletteRef"
          :workspace="store.workspace"
          :memos="store.workspaceMemos"
          :current-memo-title="store.memo.title"
          type="link"
          shortcut-symbol="i"
          :editor="editor"
        />
        <SearchPalette
          :workspace="store.workspace"
          :memos="store.workspaceMemos"
          :current-memo-title="store.memo.title"
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
import AltEditDialog from './units/AltEditDialog.vue';
import DeleteMemoWorkflow from './units/DeleteMemoWorkflow.vue';
import ExportDialogToCopyResult from './units/ExportDialogToCopyResult.vue';
import ExportDialogToSelectTargets from './units/ExportDialogToSelectTargets.vue';
import LinkEditDialog from './units/LinkEditDialog.vue';

import type { DropdownMenuItem } from '@nuxt/ui';
import type { JSONContent, NodeViewProps, Editor as _Editor } from '@tiptap/vue-3';
import type { EditorMsg } from '~/lib/editor/msg';
import type { Link as LinkModel } from '~/models/link';

import CodeBlockComponent from '~/components/CodeBlock.vue';
import EditorToolbarButton from '~/components/EditorToolbarButton.vue';
import OutlineView from '~/components/OutlineView.vue';
import SearchPalette from '~/components/SearchPalette.vue';
import { writeHtml } from '~/lib/clipboard';
import * as EditorAction from '~/lib/editor/action.js';
import { dispatchEditorMsg } from '~/lib/editor/dispatcher';
import * as CustomExtension from '~/lib/editor/extensions';
import * as EditorQuery from '~/lib/editor/query.js';
import { convertToMarkdown } from '~/lib/editor/serializer/markdown';
import { convertMemoToHtml, createHtmlLink } from '~/lib/memo/exporter/toHtml';

definePageMeta({
  path: '/:workspace/:memo',
  validate(route) {
    return route.params.memo !== '_settings';
  },
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

const route = useRoute();
const router = useRouter();
const { createEffectHandler } = useEffectHandler();
const command = useCommand();
const store = useWorkspaceStore();
const recentStore = useRecentMemoStore();

const workspaceSlug = computed(() => route.params.workspace as string);
const memoSlug = computed(() => route.params.memo as string);

/* --- Workspace and memo loader --- */
const { error, ready } = loadMemoData(workspaceSlug.value, memoSlug.value);

if (error.value) {
  showError({ statusCode: 404, statusMessage: 'Page not found', message: `Memo ${memoSlug.value} not found.` });
}

const { memo } = await ready;
const memoTitle = ref(memo.title);

/* --- States for editor --- */

// Reference to control the link palette component
const linkPaletteRef = ref<InstanceType<typeof SearchPalette> | null>(null);

const {
  editor,
  activeHeadingId,
  focusHeading,
  headImageRef,
  updateActiveHeadingOnScroll,
} = useMemoEditor(memo.content, {
  extensions: extensions,
  saveMemo: async () => { await saveMemo(); },
  updateLinks: async (added, deleted) => {
    await Promise.all([
      ...added.map(href =>
        store.createLink(workspaceSlug.value, memoSlug.value, href),
      ),
      ...deleted.map(href =>
        store.deleteLink(workspaceSlug.value, memoSlug.value, href),
      ),
      store.loadLinks(workspaceSlug.value, memoSlug.value),
    ]);
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

  if (store.memo) {
    const slug = encodeForSlug(memoSlug.value);
    const workspace = workspaceSlug.value;
    const hash = route.hash || undefined;

    const exists = recentStore.history.some(
      m => m.slug === slug && m.workspace === workspace && m.hash === hash,
    );

    if (!exists) {
      recentStore.addMemo(store.memo.title, slug, workspace, hash);
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
  if (!store.memo) {
    return;
  }

  if (!store.isBookmarked) {
    await store.createBookmark(workspaceSlug.value, memoSlug.value);
  }
  else {
    await store.deleteBookmark(workspaceSlug.value, memoSlug.value);
  }
  emitEvent('bookmark/updated', { workspaceSlug: workspaceSlug.value });
};

/* --- Contect menu items --- */
const contextMenuItems: DropdownMenuItem[][] = [
  [
    {
      label: 'Slide mode',
      icon: iconKey.pageLink,
      onSelect: () => { router.push(`/${workspaceSlug.value}/${encodeForSlug(memoSlug.value)}/_slide`); },
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
  if (!store.workspaceMemos || store.workspaceMemos.length === 0) {
    return;
  }

  const randomIndex = Math.floor(Math.random() * store.workspaceMemos.length);
  const randomMemo = store.workspaceMemos[randomIndex];
  if (randomMemo) {
    router.push(`/${workspaceSlug.value}/${encodeForSlug(randomMemo.title)}`);
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
    .withCallback(
      () => {
        emitEvent('memo/updated', { workspaceSlug: workspaceSlug.value, memoSlug: currentTitle });
        router.replace(`/${workspaceSlug.value}/${encodeForSlug(currentTitle)}${route.hash}`);
      },
    )
    .execute(editor.value, currentTitle);
}

const deleteMemoWithUserConfirmation = ref<InstanceType<typeof DeleteMemoWorkflow>>();
async function runDeleteWorkflow() {
  if (!deleteMemoWithUserConfirmation.value) {
    throw new Error('Workflow ref is not set correctlly.');
  }

  const workflowResult = await deleteMemoWithUserConfirmation.value.run(async () => {
    const result = await createEffectHandler(() => store.deleteMemo(workspaceSlug.value, memoSlug.value))
      .withToast('Delete memo successfully.', 'Failed to delete.')
      .execute();

    if (!result.ok) throw new Error ('Failed to delete.');
  });

  if (workflowResult === 'completed') {
    emitEvent('memo/deleted', { workspaceSlug: workspaceSlug.value });
    router.replace(`/${workspaceSlug.value}`);
  }
}

const copyPageAsMarkdown = (editor: _Editor, title: string) =>
  createEffectHandler(async () => {
    const markdown = convertToMarkdown(editor.state.doc, title);
    await writeHtml(markdown);
  })
    .withToast('Copied as markdown.', 'Failed to copy.')
    .execute();

const copyPageAsHtml = (editor: _Editor, title: string) =>
  createEffectHandler(async () => {
    const html = convertMemoToHtml(editor.getJSON(), title);
    await writeHtml(html);
  })
    .withToast('Copied as html.', 'Failed to copy.')
    .execute();

const copySelectedTextAsMarkdown = (editor: _Editor) =>
  createEffectHandler(async () => {
    const selectedContent = EditorQuery.getSelectedNode(editor);
    const markdown = convertToMarkdown(selectedContent);
    await navigator.clipboard.writeText(markdown);
  })
    .withToast('Copied as markdown.', 'Failed to copy.')
    .execute();

/**
 * Copy link to heading as html link format
 *
 * @param headingId
 * @param headingText
 */
const copyLinkToHeading = (fullUrl: string, titleWithHeading: string) =>
  createEffectHandler(async () => {
    const htmlLink = createHtmlLink(fullUrl, titleWithHeading);
    await writeHtml(htmlLink);
  })
    .withToast('Copied link to heading.', 'Failed to copy.')
    .execute();

/* --- Export with related pages (Step1: select targets) --- */

const exportMode = ref<'idle' | 'selectingTargets' | 'copyingResult'>('idle');
const htmlExport = ref<string>('');

const isSelectingTargets = computed({
  get: () => exportMode.value === 'selectingTargets',
  set: (value: boolean) => {
    exportMode.value = value ? 'selectingTargets' : 'idle';
  },
});

const isCopyingResult = computed({
  get: () => exportMode.value === 'copyingResult',
  set: (value: boolean) => {
    exportMode.value = value ? 'copyingResult' : 'idle';
  },
});

const exportCandidates = computed(() => {
  if (store.links) {
    const uniqueLinks = Array.from(
      new Map(store.links.map(link => [link.id, link])).values(),
    );
    return uniqueLinks;
  }
  return [];
});

async function fetchLinkedMemos(links: Array<LinkModel>): Promise<Array<{ content: string; title: string }>> {
  const memos = [];

  for (const link of links) {
    const memo = await command.memo.get({
      workspaceSlugName: workspaceSlug.value,
      memoSlugTitle: link.title,
    });

    memos.push({ content: memo.content, title: link.title });
  }

  return memos;
}

const exportPagesV2 = async (targets: Array<LinkModel>) => {
  if (!editor.value || !store.memo) return;

  await createEffectHandler(async (targets: Array<LinkModel>, editorJson: JSONContent, memoTitle: string) => {
    const currentMemoHtml = convertMemoToHtml(editorJson, memoTitle);

    const linkedMemos = await fetchLinkedMemos(targets);
    const linkedMemoHtmls = linkedMemos.map(linkedMemo => convertMemoToHtml(JSON.parse(linkedMemo.content), linkedMemo.title));

    return [currentMemoHtml, ...linkedMemoHtmls].join('\n');
  })
    .withToast('Export prepared successfully!', 'Failed to prepare export.')
    .withCallback(
      (result: string) => {
        htmlExport.value = result;
        exportMode.value = 'copyingResult';
      },
    )
    .execute(targets, editor.value.getJSON(), store.memo.title);
};

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
