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
        class="h-full w-full flex justify-center"
      >
        <div
          class="scrollbar w-[250px] flex flex-col gap-3 flex-shrink-0 h-full border-right"
        >
          <ToCList
            v-if="toc"
            :items="toc"
            :active-heading-id="activeHeadingId"
            @click="(id: any) => { scrollToElementWithOffset(id, 100); EditorUtil.focusNodeById(editor!, id); activeHeadingId = id }"
          />
        </div>

        <div
          id="main"
          class="flex-1 min-w-0 bg-slate-200 h-full overflow-y-auto hide-scrollbar"
        >
          <!-- Editor -->
          <div
            @click.self="editor?.chain().focus('end').run()"
          >
            <!-- Toolbar -->
            <EditorToolbar
              v-if="editor"
              :editor="editor"
              class="sticky top-0 left-0 z-50 border-b-2 border-slate-400 h-8"
            />

            <!-- Content area -->
            <div
              class="bg-slate-100 p-6"
              @click.self="editor?.chain().focus('end').run()"
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
        class="bg-slate-200 py-1 px-1 flex gap-0.5 rounded-lg outline outline-1 outline-slate-400"
      >
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

      <UModal v-model="deleteConfirmationDialogOn">
        <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
          <div class="h-24">
            Once you delete a memo, there is no going back. Please be certain.
          </div>

          <template #footer>
            <div class="h-8 flex w-full">
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
import { convertToMarkdown } from '~/lib/editor';
import * as EditorAction from '~/lib/editor/action.js';
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
    }),
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
    const handleLinkClick = async (event: MouseEvent) => {
      const url = EditorAction.getLinkFromMouseClickEvent(event);

      // If clicked element is not link, do nothing.
      if (!url) {
        return;
      }

      // Prevent browser default navigation
      event.preventDefault();

      if (isInternalLink(url) && !isModifierKeyPressed(event)) {
        router.push({ path: url });
        return;
      }
    };

    editor.view.dom.addEventListener('click', handleLinkClick);
    return () => {
      editor.view.dom.removeEventListener('click', handleLinkClick);
    };
  },
  onTransaction: async ({ editor: _editor, transaction }) => {
    await updateLinks(transaction);
    updateHeadImage(transaction);
    updateHeadingIds(_editor);
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
          // updateStickyScroll(node.attrs.id);
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

const updateHeadingIds = (editor: Editor) => {
  let modified = false;

  const { state, view } = editor;
  const tr = state.tr;
  state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading' && !node.attrs.id) {
      const newId = `heading-${Math.floor(Math.random() * 100000)}`;
      tr.setNodeMarkup(pos, undefined, { ...node.attrs, id: newId });
      modified = true;
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

/* --- Commands --- */

async function saveMemo() {
  const updatedTitle = store.memo?.title;
  if (!updatedTitle) {
    window.alert('Please set title.');
    return;
  }

  const editorInstance = editor.value;
  if (editorInstance == null) {
    logger.warn('Editor instance is undefined.');
    return;
  }

  try {
    await store.saveMemo(workspaceSlug.value, memoSlug.value, {
      title: updatedTitle,
      content: JSON.stringify(editorInstance.getJSON()),
      description: truncateString(editorInstance.getText(), 256),
      thumbnailImage: headImageRef.value,
    });

    toast.clear();
    toast.add({
      title: 'Saved!',
      timeout: 1000,
      icon: iconKey.success,
    });

    // Go to updated title page
    router.replace(`/${workspaceSlug.value}/${encodeForSlug(updatedTitle)}`);
  }
  catch (error) {
    logger.error(error);

    toast.add({
      title: 'Failed to save.',
      description: 'Please save again.',
      color: 'red',
      icon: iconKey.failed,
    });
  }
};

const { state: deleteConfirmationDialogOn, toggle: toggleDeleteConfirmationDialog } = useBoolState();

async function deleteMemo() {
  try {
    await store.deleteMemo(workspaceSlug.value, memoSlug.value);

    toast.clear();
    toast.add({
      title: 'Delete memo successfully.',
      timeout: 1000,
      icon: iconKey.success,
    });

    router.replace(`/${workspaceSlug.value}`);
  }
  catch (error) {
    logger.error(error);
    toast.add({
      title: 'Failed to delete.',
      description: 'Please delete again.',
      color: 'red',
      icon: iconKey.failed,
    });
  }
}

const copyAsMarkdown = async () => {
  if (!editor.value || !store.memo) {
    return;
  }

  const markdown = convertToMarkdown(editor.value, store.memo.title);

  try {
    await navigator.clipboard.writeText(markdown);
    toast.add({
      title: 'Markdown dopied to clipboard!',
      timeout: 1000,
      icon: iconKey.success,
    });
  }
  catch (error) {
    console.error('Failed to copy markdown:', error);
    toast.add({
      title: 'Failed to copy.',
      description: 'Please try again.',
      color: 'red',
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
}

.custom-heading-level-1 {
  font-size: 2.5em;
  color: #666;
  border-bottom: 2px solid #ddd;
}

.custom-heading-level-2 {
  font-size: 2em;
  color: #555;
  border-bottom: 1px solid #ddd;
  border-style: dashed;
}

.custom-heading-level-3 {
  font-size: 1.5em;
  color: #777;
}

.custom-heading-level-4,
.custom-heading-level-5,
.custom-heading-level-6 {
  font-size: 1.5em;
  color: #777;
}

.custom-heading {
  display: flex;
  align-items: center;
}

.custom-heading-level-1::after {
  content: "h1";
}

.custom-heading-level-2::after {
  content: "h2";
}

.custom-heading-level-3::after {
  content: "h3";
}

.custom-heading-level-4::after {
  content: "h4";
}

.custom-heading-level-5::after {
  content: "h5";
}

.custom-heading-level-6::after {
  content: "h6";
}

.custom-heading::after {
  font-size: small;
  font-weight: bold;
  color: #888;
  margin-left: 4px;

  background-color: var(--slate);
  border-radius: 4px;
  padding: 2px 4px;
}
</style>
