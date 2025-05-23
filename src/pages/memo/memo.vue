<template>
  <NuxtLayout name="default">
    <template #context-menu>
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

    <template #main>
      <div
        class="flex size-full justify-center"
      >
        <div
          class="scrollbar border-right flex h-full w-[250px] shrink-0 flex-col gap-3"
        >
          <OutlineView
            v-if="editor"
            :editor-content="editor.getJSON()"
            :active-heading-id="activeHeadingId"
            @click="(id: any) => { focusHeading(editor, id); navigateToHeading(id) }"
            @copy-link="(id, text) => copyLinkToHeading(`${route.path}#${id}`, `${route.path}#${text}`)"
          />
        </div>

        <div
          id="main"
          class="hide-scrollbar h-full min-w-0 flex-1 overflow-y-auto bg-slate-200"
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
          <MemoLinkCardView :links="store.links" />
          <MarginForEditorScroll />
        </div>
      </div>
    </template>

    <template #actions>
      <div v-if="store.workspaceMemos && store.workspace">
        <SearchPalette
          ref="linkPaletteRef"
          :workspace="store.workspace"
          :memos="store.workspaceMemos"
          type="link"
          shortcut-symbol="i"
          :editor="editor"
        />
        <SearchPalette
          :workspace="store.workspace"
          :memos="store.workspaceMemos"
          type="search"
          shortcut-symbol="k"
          :editor="editor"
        />
      </div>

      <DeleteMemoWorkflow ref="deleteMemoWithUserConfirmation" />

      <!-- Export with related pages -->
      <ExportDialogToSelectTargets
        v-model:open="exportDialogOn"
        :export-candidates="exportCandidates"
        @select="(targets) => exportPagesV2(targets)"
      />
      <ExportDialogToCopyResult
        v-model:open="exportResultDialogOn"
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

import AltEditDialog from './units/AltEditDialog.vue';
import DeleteMemoWorkflow from './units/DeleteMemoWorkflow.vue';
import ExportDialogToCopyResult from './units/ExportDialogToCopyResult.vue';
import ExportDialogToSelectTargets from './units/ExportDialogToSelectTargets.vue';
import LinkEditDialog from './units/LinkEditDialog.vue';

import type { DropdownMenuItem } from '@nuxt/ui';
import type { NodeViewProps, Editor as _Editor } from '@tiptap/vue-3';
import type { EditorMsg } from '~/lib/editor/msg';
import type { Link as LinkModel } from '~/models/link';

import CodeBlockComponent from '~/components/CodeBlock.vue';
import EditorToolbarButton from '~/components/EditorToolbarButton.vue';
import OutlineView from '~/components/OutlineView.vue';
import SearchPalette from '~/components/SearchPalette.vue';
import * as EditorAction from '~/lib/editor/action.js';
import * as EditorCommand from '~/lib/editor/command';
import { convertEditorJsonToHtml } from '~/lib/editor/command/htmlExport';
import { dispatchEditorMsg } from '~/lib/editor/dispatcher';
import * as CustomExtension from '~/lib/editor/extensions';

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
const { withToast } = useToast_();
const command = useCommand();
const store = useWorkspaceStore();

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

/* --- Contect menu items --- */
const contextMenuItems: DropdownMenuItem[][] = [
  [
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
      onSelect: () => { exportDialogOn.value = true; },
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
      action: () => { linkPaletteRef.value?.openCommandPalette(); },
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

async function saveMemo() {
  const updatedTitle = memoTitle.value;
  if (!updatedTitle) {
    window.alert('Please set title.');
    return;
  }

  if (!editor.value) {
    return;
  }

  const result = await withToast(
    store.saveMemo,
    { success: 'Saved!', error: 'Failed to save.' },
  )(
    workspaceSlug.value,
    memoSlug.value,
    {
      title: updatedTitle,
      content: JSON.stringify(editor.value.getJSON()),
      description: truncateString(editor.value.getText(), 256),
      thumbnailImage: headImageRef.value ?? '',
    },
  );

  if (result.ok) {
    // Go to updated title page
    emitEvent('memo/updated', { workspaceSlug: workspaceSlug.value, memoSlug: updatedTitle });
    router.replace(`/${workspaceSlug.value}/${encodeForSlug(updatedTitle)}`);
  }
};

const deleteMemoWithUserConfirmation = ref<InstanceType<typeof DeleteMemoWorkflow>>();
async function runDeleteWorkflow() {
  if (!deleteMemoWithUserConfirmation.value) {
    throw new Error('Workflow ref is not set correctlly.');
  }

  const workflowResult = await deleteMemoWithUserConfirmation.value.run(async () => {
    const result = await withToast(
      store.deleteMemo,
      { success: 'Delete memo successfully.', error: 'Failed to delete.' },
    )(workspaceSlug.value, memoSlug.value);

    if (!result.ok) throw new Error ('Failed to delete.');
  });

  if (workflowResult === 'completed') {
    emitEvent('memo/deleted', { workspaceSlug: workspaceSlug.value });
    router.replace(`/${workspaceSlug.value}`);
  }
}

const copyPageAsMarkdown = withToast(
  EditorCommand.copyAsMarkdown,
  { success: 'Copied page as markdown.', error: 'Failed to copy.' },
);

const copyPageAsHtml = withToast(
  async (editor: _Editor, title: string) => {
    const json = editor.getJSON();
    const htmlBody = convertEditorJsonToHtml(json);
    const htmlPage = `<h1>${title}</h1>${htmlBody}`;

    await navigator.clipboard.writeText(htmlPage);
  },
  { success: 'Copied page as html.', error: 'Failed to copy.' },
);

const copySelectedTextAsMarkdown = withToast(
  EditorCommand.copySelectedAsMarkdown,
  { success: 'Copied as markdown.', error: 'Failed to copy.' },
);

/**
 * Copy link to heading as html link format
 *
 * @param headingId
 * @param headingText
 */
const copyLinkToHeading = withToast(
  EditorCommand.copyLinkAsHtml,
  { success: 'Copied link to heading.', error: 'Failed to copy.' },
);

/* --- Export with related pages (Step1: select targets) --- */

const exportDialogOn = ref(false);

const exportCandidates = computed(() => {
  if (store.links) {
    const uniqueLinks = Array.from(
      new Map(store.links.map(link => [link.id, link])).values(),
    );
    return uniqueLinks;
  }
  return [];
});

const htmlExport = ref<string>('');

const exportPagesV2 = async (targets: Array<LinkModel>) => {
  if (!editor.value || !store.memo) return;

  const json = editor.value.getJSON();
  const htmlBody = convertEditorJsonToHtml(json);
  const htmlPage = `<h1>${store.memo.title}</h1>${htmlBody}`;

  const htmls = [htmlPage];

  for (const link of targets) {
    const jsonContent = JSON.parse((await command.memo.get({ workspaceSlugName: workspaceSlug.value, memoSlugTitle: link.title })).content);
    const html = convertEditorJsonToHtml(jsonContent);
    htmls.push(`<h1>${link.title}</h1>${html}`);
  }

  const onePageHtml = htmls.join('\n');
  htmlExport.value = onePageHtml;

  exportDialogOn.value = false;
  exportResultDialogOn.value = true;
};

/* --- Export with related pages (Step2: copy result) */

const exportResultDialogOn = ref(false);

const copyExportedResult = async (textToCopy: string) => {
  await executeWithToast(
    async (text) => {
      navigator.clipboard.writeText(text);
    },
    [textToCopy],
    { success: 'Exported result copied!', error: 'Failed to copy.' },
  );

  exportResultDialogOn.value = false;
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
  color: rgba(0, 0, 255, 0.578);
}

.custom-task-item[data-checked="true"] div a:hover {
  text-decoration: line-through;
  color: blue;
}

a.external-link {
  text-decoration: underline;
  text-underline-offset: 0.2em;
  text-decoration-style: dashed;
  text-decoration-skip-ink: none;
}
</style>
