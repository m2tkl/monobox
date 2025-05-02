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
          <!-- Editor -->
          <div class="bg-slate-100">
            <!-- Toolbar -->
            <EditorToolbar
              v-if="editor"
              :editor="editor"
              class="sticky left-0 top-0 z-50 h-8 border-b-2 border-slate-400"
            />

            <!-- Content area -->
            <div
              class="max-w-[820px] bg-white p-6"
            >
              <!-- Title -->
              <TitleFieldAutoResize
                v-if="store.memo"
                v-model="store.memo.title"
              />

              <USeparator class="py-6" />

              <!-- Content -->
              <div>
                <EditorLoadingSkelton v-if="!editor" />

                <editor-content
                  v-else
                  :editor="editor"
                />
              </div>
            </div>
          </div>

          <!-- Links -->
          <div>
            <MemoLinkCardView
              v-if="store.links"
              :links="store.links"
            />
          </div>

          <div>
            <MarginForEditorScroll />
          </div>
        </div>
      </div>
    </template>

    <template #actions>
      <!-- Bubble Menu -->
      <BubbleMenu
        v-if="editor"
        :editor="editor"
        class="flex gap-0.5 rounded-lg bg-slate-200 p-1 outline outline-slate-400"
      >
        <template v-if="editor.isActive('image')">
          <EditorToolbarButton
            :icon="iconKey.annotation"
            @exec="() => {
              const selection = editor?.state.selection
              if (selection) {
                const { $from } = selection;
                const node = $from.nodeAfter;
                if (node && node.type.name === 'image') {
                  openAltEditDialog(node.attrs.alt || '')
                }
              }
            }"
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
      </BubbleMenu>

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

      <LinkEditDialog
        v-model:open="linkEditDialog.isOpen.value"
        :initial-value="currentLink"
        @update="closeLinkEditDialogOnUpdate"
        @cancel="closeLinkEditDialogOnCancel"
      />

      <AltEditDialog
        v-model:open="altEditDialog.isOpen.value"
        :initial-value="imageCurrentAltText"
        @update="closeAltEditDialogOnUpdate"
        @cancel="closeAltEditDialogOnCancel"
      />

      <DeleteConfirmationDialog
        v-model:open="deleteConfirmationDialogOn"
        @delete="deleteMemo"
        @cancel="deleteConfirmationDialogOn = false"
      />

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
import { BubbleMenu, EditorContent, type NodeViewProps, useEditor, type Editor as _Editor } from '@tiptap/vue-3';

import AltEditDialog from './units/AltEditDialog.vue';
import DeleteConfirmationDialog from './units/DeleteConfirmationDialog.vue';
import EditorLoadingSkelton from './units/EditorLoadingSkelton.vue';
import ExportDialogToCopyResult from './units/ExportDialogToCopyResult.vue';
import ExportDialogToSelectTargets from './units/ExportDialogToSelectTargets.vue';
import LinkEditDialog from './units/LinkEditDialog.vue';

import type { DropdownMenuItem } from '@nuxt/ui';
import type { Editor } from '@tiptap/core';
import type { Transaction } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import type { Link as LinkModel } from '~/models/link';

import CodeBlockComponent from '~/components/CodeBlock.vue';
import EditorToolbarButton from '~/components/EditorToolbarButton.vue';
import OutlineView from '~/components/OutlineView.vue';
import SearchPalette from '~/components/SearchPalette.vue';
import * as EditorAction from '~/lib/editor/action.js';
import * as EditorCommand from '~/lib/editor/command';
import { convertEditorJsonToHtml } from '~/lib/editor/command/htmlExport';
import * as CustomExtension from '~/lib/editor/extensions';
import * as EditorUtil from '~/lib/editor/util';

definePageMeta({
  path: '/:workspace/:memo',
  validate(route) {
    return route.params.memo !== '_settings';
  },
});

const route = useRoute();
const router = useRouter();
const logger = useConsoleLogger('[pages/memo]');
const { withToast } = useToast_();
const command = useCommand();

const workspaceSlug = computed(() => route.params.workspace as string);
const memoSlug = computed(() => route.params.memo as string);

/* --- Workspace and memo loader --- */

const { store, loadMemo, loadWorkspace } = useWorkspaceLoader();
await loadWorkspace(workspaceSlug.value);
const loadedResult = await loadMemo(workspaceSlug.value, memoSlug.value);

if (!loadedResult.ok) {
  showError({ statusCode: 404, statusMessage: 'Page not found', message: `Memo ${memoSlug.value} not found.` });
}

/* --- States for editor --- */

// Stores the first image found in the document, used as a thumbnail reference
const headImageRef = ref();

// Reference to control the link palette component
const linkPaletteRef = ref<InstanceType<typeof SearchPalette> | null>(null);

// Stores the currently active heading ID, used for tracking the highlighted section in the memo
const activeHeadingId = ref<string>();

// Tracks whether the caret has moved out of the visible editor area, used to adjust heading focus behavior
const wasCaretOut = ref(false);

/* --- Editor --- */

const editor = useEditor({
  content: store.memo ? JSON.parse(store.memo.content) : '',
  extensions: [
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
  ],
  editorProps: {
    /**
     * Register shortcuts for the Editor.
     *
     * NOTE:
     *   Shortcuts registered here are only active when the Editor is focused.
     *   For shortcuts that should be usable even when the Editor is not focused, use `window.addEventListener` to register them.
     */
    handleKeyDown(_view: EditorView, _event: KeyboardEvent) {
      // Command register sample
      // if (event.metaKey && event.key === "i") {
      //   event.preventDefault();
      //
      //   // Do something
      //
      //   return true;
      // }
      // return false;
    },
  },
  onCreate({ editor }) {
    editor.registerPlugin(CustomExtension.removeHeadingIdOnPastePlugin);

    const handleLinkClick = async (event: MouseEvent) => {
      const url = EditorAction.getLinkFromMouseClickEvent(event);

      // If clicked element is not link, do nothing.
      if (!url) {
        return;
      }

      // Prevent browser default navigation
      event.preventDefault();

      // If the path is same to itself and a fragment is specified, move the focus.
      const [path, id] = url.split('#');
      if (route.path === path) {
        focusHeading(editor, id);
        return;
      }

      if (isInternalLink(url) && !isModifierKeyPressed(event)) {
        // NOTE: Pass the entire URL instead of the path ( `{ path: url }` ) to include the fragment.
        router.push(url);
        return;
      }
    };

    // Focus if a hash is specified when entring the memo
    if (route.hash) {
      const id = route.hash.replace(/^#/, '');
      focusHeading(editor, id);
    }

    editor.view.dom.addEventListener('click', handleLinkClick);
    return () => {
      editor.view.dom.removeEventListener('click', handleLinkClick);
    };
  },
  onTransaction: async ({ editor: _editor, transaction }) => {
    await updateLinks(transaction);
    updateHeadImage(transaction);
    assignUniqueHeadingIds(_editor);
  },
  onSelectionUpdate: ({ editor }) => {
    const editorContainer = document.getElementById('main');
    if (!editorContainer) return;

    const caretVisible = EditorUtil.isCaretVisible(editor, editorContainer);

    if (caretVisible) {
      // When a cursor operation is performed and the cursor is visible on the screen,
      // prioritize the heading based on the cursor position
      // and set a flag to skip heading identification based on scrolling.
      wasCaretOut.value = false;

      // If the cursor is currently inside a heading, prioritaize it.
      const { $anchor } = editor.state.selection;
      for (let depth = $anchor.depth; depth >= 0; depth--) {
        const node = $anchor.node(depth);
        if (node.type.name === 'heading') {
          activeHeadingId.value = node.attrs.id;
          return;
        }
      }

      // If the cursor is not inside a heading node, find the preceding heading.
      const { state } = editor;
      const { from } = state.selection;
      let foundHeadingId: string | null = null;
      state.doc.nodesBetween(0, from, (node) => {
        if (node.type.name === 'heading') {
          foundHeadingId = node.attrs.id ?? null;
        }
      });

      if (foundHeadingId) {
        activeHeadingId.value = foundHeadingId;
      }
    }
  },
});

/**
 * Assigns unique IDs for heading elements in the doc.
 *
 * If a heading node does not have an `id` attribute,
 * it assigns a new unique ID.
 *
 * @param editor
 */
const assignUniqueHeadingIds = (editor: Editor) => {
  const { state, view } = editor;
  const tr = state.tr;
  let modified = false;

  state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      if (!node.attrs.id) {
        const newId = crypto.randomUUID();
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, id: newId });
        modified = true;
      }
    }
  });

  if (modified) {
    view.dispatch(tr);
  }
};

const updateLinks = async (transaction: Transaction) => {
  const { deletedLinks, addedLinks } = EditorUtil.getChangedLinks(transaction);
  await Promise.all(
    deletedLinks.map(async (href) => {
      await store.deleteLink(workspaceSlug.value, memoSlug.value, href);
    }),
  );
  await Promise.all(
    addedLinks.map(async (href) => {
      await store.createLink(workspaceSlug.value, memoSlug.value, href);
    }),
  );

  if (deletedLinks.length > 0 || addedLinks.length > 0) {
    await Promise.all([
      store.loadLinks(workspaceSlug.value, memoSlug.value),
      saveMemo(),
    ]);
    logger.log('Link updated successfully.');
  }
};

const updateHeadImage = async (transaction: Transaction) => {
  const foundFirstImage = EditorUtil.findHeadImage(transaction);
  if (foundFirstImage !== headImageRef.value) {
    headImageRef.value = foundFirstImage;
  }
};

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
 * Moves the focus to a specific heading in the editor.
 *
 * This function ensures that the specified heading is scrolled into view
 * and focused within the editor.
 *
 * @param _editor - The instance of the editor. If `undefined`, the function does nothing.
 * @param id - The ID of the heading to focus on.
 */
function focusHeading(_editor: Editor | undefined, id: string) {
  if (!_editor) {
    return;
  }

  scrollToElementWithOffset(id, 100);
  EditorUtil.focusNodeById(_editor, id);
  activeHeadingId.value = id;
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

/**
 * Updates the active heading based on the scroll position.
 * If the caret is out of view, determines the last heading that was pushed up.
 *
 * @param editorInstance - The editor instance
 * @param editorContainer - The main editor container element
 */
function updateActiveHeadingOnScroll(editorInstance: Editor, editorContainer: HTMLElement) {
  // Set a flag to disable heading identification based on the cursor position
  // when scrolling moves the cursor out of the screen.
  if (!EditorUtil.isCaretVisible(editorInstance, editorContainer)) {
    wasCaretOut.value = true;
  }

  if (wasCaretOut.value) {
    activeHeadingId.value = EditorUtil.getLastVisibleHeadingId(editorContainer);
  }
}

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

/* --- Contect menu items --- */
const contextMenuItems: DropdownMenuItem[][] = [
  [
    {
      label: 'Copy as markdown',
      icon: iconKey.copy,
      onSelect: async () => { await copyPageAsMarkdown(editor.value!, store.memo!.title); },
    },
    {
      label: 'Copy as html',
      icon: iconKey.html,
      onSelect: async () => { await copyPageAsHtml(editor.value!, store.memo!.title); },
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
      onSelect: () => { deleteConfirmationDialogOn.value = true; },
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
      action: () => { openLinkEditDialog(); },
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

/* --- Link operation --- */
const linkEditDialog = useDialog();
const currentLink = ref('');

const openLinkEditDialog = linkEditDialog.withOpen(() => {
  const previousUrl = editor.value?.getAttributes('link').href;
  currentLink.value = previousUrl;
});

const closeLinkEditDialogOnUpdate = linkEditDialog.withClose(async (newLink: string) => {
  if (!editor.value) {
    return;
  }
  if (newLink) {
    EditorAction.setLink(editor.value, newLink);
  }
  else {
    EditorAction.unsetLink(editor.value);
  }
});
const closeLinkEditDialogOnCancel = linkEditDialog.withClose(async () => {});

/* --- Image alt edit --- */
const altEditDialog = useDialog();
const imageCurrentAltText = ref('');

const openAltEditDialog = altEditDialog.withOpen((currentAltText: string) => {
  imageCurrentAltText.value = currentAltText;
});

const closeAltEditDialogOnUpdate = altEditDialog.withClose(async (newAltText: string) => {
  if (!editor.value) {
    return;
  }
  editor.value.commands.updateAttributes('image', { alt: newAltText });
});
const closeAltEditDialogOnCancel = altEditDialog.withClose(async () => {});

/* --- Commands --- */

async function saveMemo() {
  const updatedTitle = store.memo?.title;
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
      thumbnailImage: headImageRef.value,
    },
  );

  if (result.ok) {
    // Go to updated title page
    router.replace(`/${workspaceSlug.value}/${encodeForSlug(updatedTitle)}`);
  }
};

const deleteConfirmationDialogOn = ref(false);

async function deleteMemo() {
  const result = await withToast(
    store.deleteMemo,
    { success: 'Delete memo successfully.', error: 'Failed to delete.' },
  )(workspaceSlug.value, memoSlug.value);

  if (result.ok) {
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
