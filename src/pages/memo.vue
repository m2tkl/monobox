<template>
  <NuxtLayout name="default">
    <template #context-menu>
      <UDropdown
        :items="contextMenuItems"
      >
        <div class="flex items-center">
          <UIcon
            :name="iconKey.dotMenuVertical"
          />
        </div>
      </UDropdown>
    </template>

    <template #main>
      <div
        class="flex size-full justify-center"
      >
        <div
          class="scrollbar border-right flex h-full w-[250px] shrink-0 flex-col gap-3"
        >
          <ToCList
            v-if="toc"
            :items="toc"
            :active-heading-id="activeHeadingId"
            @click="(id: any) => focusHeading(editor, id)"
            @copy-link="(id: string, text: string) => copyLinkToHeading(id, text)"
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

              <UDivider class="py-6" />

              <!-- Content -->
              <div>
                <editor-content
                  v-if="editor"
                  :editor="editor"
                />

                <!-- skeleton -->
                <div
                  v-else
                  class="space-y-2"
                >
                  <USkeleton class="h-4 w-[350px]" />
                  <USkeleton class="h-4 w-[200px]" />
                  <USkeleton class="h-4 w-[250px]" />
                </div>
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
        class="flex gap-0.5 rounded-lg bg-slate-200 p-1 outline outline-1 outline-slate-400"
      >
        <template v-if="editor.isActive('image')">
          <EditorToolbarButton
            :icon="iconKey.annotation"
            @exec="openAltEditDialog"
          />
        </template>

        <template v-else>
          <EditorToolbarButton
            :icon="iconKey.memoLink"
            @exec="() => { linkPaletteRef?.openCommandPalette() }"
          />
          <EditorToolbarButton
            :icon="iconKey.link"
            @exec="openLinkEditDialog()"
          />
          <EditorToolbarButton
            :icon="iconKey.unlink"
            @exec="EditorAction.unsetLink(editor)"
          />

          <span class="mx-0.5 font-thin text-slate-400">|</span>

          <EditorToolbarButton
            :icon="iconKey.textBold"
            @exec="EditorAction.toggleStyle(editor, 'bold')"
          />
          <EditorToolbarButton
            :icon="iconKey.textItalic"
            @exec="EditorAction.toggleStyle(editor, 'italic')"
          />
          <EditorToolbarButton
            :icon="iconKey.textStrikeThrough"
            @exec="EditorAction.toggleStyle(editor, 'strike')"
          />

          <EditorToolbarButton
            :icon="iconKey.inlineCode"
            @exec="EditorAction.toggleCode(editor)"
          />

          <EditorToolbarButton
            :icon="iconKey.clearFormat"
            @exec="EditorAction.resetStyle(editor)"
          />

          <span class="mx-0.5 font-thin text-slate-400">|</span>

          <EditorToolbarButton
            :icon="iconKey.copy"
            @exec="copySelectedAsMarkdown"
          />
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

      <!-- Link modal -->
      <UModal v-model="linkDialogOn">
        <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
          <div class="h-24">
            <UForm
              id="set-link"
              :state="state"
              class="space-y-4"
              @submit="execSetLink"
            >
              <UFormGroup
                label="URL"
                name="url"
              >
                <UInput v-model="state.url" />
              </UFormGroup>
            </UForm>
          </div>

          <template #footer>
            <div class="h-8">
              <UButton
                form="set-link"
                type="submit"
                class="bg-slate-600"
                color="indigo"
              >
                Save
              </UButton>
            </div>
          </template>
        </UCard>
      </UModal>

      <!-- Alt edit dialog -->
      <UModal v-model="altDialogOn">
        <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
          <div class="h-24">
            <UForm
              id="set-alt"
              :state="imageState"
              class="space-y-4"
              @submit="execSetAlt"
            >
              <UFormGroup
                label="Alt"
                name="alt"
              >
                <UInput v-model="imageState.alt" />
              </UFormGroup>
            </UForm>
          </div>

          <template #footer>
            <div class="h-8">
              <UButton
                form="set-alt"
                type="submit"
                class="bg-slate-600"
                color="indigo"
              >
                Save
              </UButton>
            </div>
          </template>
        </UCard>
      </UModal>

      <UModal v-model="deleteConfirmationDialogOn">
        <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
          <div class="h-24">
            Once you delete a memo, there is no going back. Please be certain.
          </div>

          <template #footer>
            <div class="flex h-8 w-full">
              <UButton
                type="submit"
                color="red"
                @click="deleteMemo"
              >
                Delete
              </UButton>

              <span class="flex-1" />

              <UButton
                variant="solid"
                color="gray"

                @click="toggleDeleteConfirmationDialog"
              >
                Cancel
              </UButton>
            </div>
          </template>
        </UCard>
      </UModal>
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
import { BubbleMenu, EditorContent, type NodeViewProps, useEditor } from '@tiptap/vue-3';

import type { Editor } from '@tiptap/core';
import type { Transaction } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';

import CodeBlockComponent from '~/components/CodeBlock.vue';
import EditorToolbarButton from '~/components/EditorToolbarButton.vue';
import SearchPalette from '~/components/SearchPalette.vue';
import ToCList from '~/components/ToCList.vue';
import * as EditorAction from '~/lib/editor/action.js';
import * as EditorCommand from '~/lib/editor/command';
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
const toast = useToast();

const workspaceSlug = computed(() => route.params.workspace as string);
const memoSlug = computed(() => route.params.memo as string);

/* --- Workspace and memo loader --- */

const { store, loadMemo, loadWorkspace } = useWorkspaceLoader();

watch([workspaceSlug], async () => {
  await loadWorkspace(workspaceSlug.value);
});
watch([workspaceSlug, memoSlug], async () => {
  await loadMemo(workspaceSlug.value, memoSlug.value);
});

await loadWorkspace(workspaceSlug.value);
await loadMemo(workspaceSlug.value, memoSlug.value);

const { setWorkspace } = useWorkspace();
setWorkspace(store.workspace!);

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
        console.log(href);
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

/* --- toc --- */

type _Heading = {
  type: 'heading';
  attrs?: { level: number; id: string };
  content?: Array<{ type: 'text'; text: string }>;
};
type Heading = {
  level: number;
  id: string;
  text: string;
};

const toc = computed<Heading[]>(() => {
  const content = editor.value?.getJSON().content;

  const headings = content?.filter(c => c.type === 'heading') as _Heading[] | undefined;
  if (headings === undefined) {
    return [];
  }

  return headings.map(h => ({
    id: h.attrs ? (h.attrs.id as string) : '',
    text: h.content ? (h.content[0].text as string) : '',
    level: h.attrs ? (h.attrs.level as number) : 1,
  }));
});

/* --- Contect menu items --- */

const contextMenuItems = [
  [
    {
      label: 'Copy as markdown',
      icon: iconKey.copy,
      click: async () => { await copyAsMarkdown(); },
    },
  ],
  [
    {
      label: 'Delete',
      icon: iconKey.trash,
      click: () => { toggleDeleteConfirmationDialog(); },
    },
  ],
];

/* --- Link operation --- */

const { state: linkDialogOn, toggle: toggleLinkDialog } = useBoolState();

const state = reactive({
  url: undefined,
});

const openLinkEditDialog = () => {
  const previousUrl = editor.value?.getAttributes('link').href;
  state.url = previousUrl;

  toggleLinkDialog();
};

const execSetLink = () => {
  console.log('execSetLink');
  if (!editor.value) {
    return;
  }

  if (state.url) {
    EditorAction.setLink(editor.value, state.url);
  }
  else {
    EditorAction.unsetLink(editor.value);
  }

  toggleLinkDialog();
};

/* --- Image alt setting --- */

const { state: altDialogOn, toggle: toggleAltDialog } = useBoolState();

const imageState = reactive({
  alt: undefined,
});

function openAltEditDialog() {
  const selection = editor.value?.state.selection;
  if (selection) {
    const { $from } = selection;
    const node = $from.nodeAfter;
    if (node && node.type.name === 'image') {
      imageState.alt = node.attrs.alt || '';
      toggleAltDialog();
    }
  }
}

function execSetAlt() {
  editor.value!.commands.updateAttributes('image', { alt: imageState.alt });
  toggleAltDialog();
}

/* --- Commands --- */

async function executeWithToast<T, Args extends unknown[]>(
  action: (...args: Args) => Promise<T>,
  args: Args,
  messages: { success: string; error: string },
): Promise<{ ok: true; data: T } | { ok: false }> {
  try {
    const result = await action(...args);
    toast.add({
      title: messages.success,
      timeout: 1000,
      icon: iconKey.success,
    });
    return { ok: true, data: result };
  }
  catch (error) {
    console.error(messages.error, error);
    toast.add({
      title: messages.error,
      description: 'Please try again',
      color: 'red',
      icon: iconKey.failed,
    });
    return { ok: false };
  }
};

async function saveMemo() {
  const updatedTitle = store.memo?.title;
  if (!updatedTitle) {
    window.alert('Please set title.');
    return;
  }

  if (!editor.value) {
    return;
  }

  const result = await executeWithToast(
    store.saveMemo,
    [
      workspaceSlug.value,
      memoSlug.value,
      {
        title: updatedTitle,
        content: JSON.stringify(editor.value.getJSON()),
        description: truncateString(editor.value.getText(), 256),
        thumbnailImage: headImageRef.value,
      },
    ],
    { success: 'Saved!', error: 'Failed to save.' },
  );

  if (result.ok) {
    // Go to updated title page
    router.replace(`/${workspaceSlug.value}/${encodeForSlug(updatedTitle)}`);
  }
};

const { state: deleteConfirmationDialogOn, toggle: toggleDeleteConfirmationDialog } = useBoolState();

async function deleteMemo() {
  const result = await executeWithToast(
    store.deleteMemo,
    [workspaceSlug.value, memoSlug.value],
    { success: 'Delete memo successfully.', error: 'Failed to delete.' },
  );

  if (result.ok) {
    router.replace(`/${workspaceSlug.value}`);
  }
}

const copyAsMarkdown = async () => {
  if (!editor.value || !store.memo) {
    return;
  }

  await executeWithToast(
    EditorCommand.copyAsMarkdown,
    [editor.value, store.memo.title],
    { success: 'Markdown copied to clipboard!', error: 'Failed to copy markdown' },
  );
};

const copySelectedAsMarkdown = async () => {
  if (!editor.value) return;

  await executeWithToast(
    EditorCommand.copySelectedAsMarkdown,
    [editor.value],
    { success: 'Selected markdown copied!', error: 'Failed to copy selected markdown' },
  );
};

/**
 * Copy link to heading as html link format
 *
 * @param headingId
 * @param headingText
 */
const copyLinkToHeading = async (headingId: string, headingText: string): Promise<void> => {
  const routePathWithHeadingId = route.path + '#' + headingId;
  const routePathForLinkText = route.path + '#' + headingText;

  executeWithToast(
    copyLinkAsHtml,
    [routePathWithHeadingId, routePathForLinkText],
    { success: 'Link to heading copied!', error: 'Failed to copy.' },
  );
};

/**
 * Copy link for html
 *
 * @param href
 * @param text
 */
const copyLinkAsHtml = async (href: string, text: string): Promise<void> => {
  const html = `<a href="${href}">${text}</a>`;
  navigator.clipboard.write([
    new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
    }),
  ]);
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
