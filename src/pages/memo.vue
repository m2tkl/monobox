<template>
  <NuxtLayout name="default">
    <template #context-menu>
      <UDropdown
        :items="menuItems"
      >
        <div class="flex items-center">
          <UIcon
            :name="iconKey.dotMenuVertical"
          />
        </div>
      </UDropdown>
    </template>

    <template #main>
      <div class="h-full w-full flex justify-center">
        <div
          class="hide-scrollbar w-[250px] flex flex-col gap-3 flex-shrink-0 max-h-full overflow-y-auto border-right"
        >
          <ToCList
            v-if="toc"
            :items="toc"
            :active-heading-id="activeHeadingId"
            @click="(id: any) => { scrollToElementWithOffset(id, 100); focusNodeById(id); activeHeadingId = id }"
          />
        </div>

        <div
          id="main"
          class="flex-1 min-w-0 bg-slate-30 h-full overflow-y-auto hide-scrollbar"
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
          @exec="openLinkPalette()"
        />
        <EditorToolbarButton
          :icon="iconKey.link"
          @exec="setLinkManually()"
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
              @submit="setLink"
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

                @click="() => { deleteConfirmationDialogOn = false }"
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
import { open } from '@tauri-apps/plugin-shell';
import Focus from '@tiptap/extension-focus';
import Link from '@tiptap/extension-link';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { TextSelection } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import { BubbleMenu, EditorContent, type NodeViewProps, useEditor } from '@tiptap/vue-3';
import xml from 'highlight.js/lib/languages/xml';
import { all, createLowlight } from 'lowlight';

import type { Editor } from '@tiptap/core';
import type { EditorView } from '@tiptap/pm/view';

import CodeBlockComponent from '~/components/CodeBlock.vue';
import EditorToolbarButton from '~/components/EditorToolbarButton.vue';
import SearchPalette from '~/components/SearchPalette.vue';
import ToCList from '~/components/ToCList.vue';
import { customMarkdownSerializer } from '~/lib/editor';
import * as EditorAction from '~/lib/editor/action.js';
import * as CustomExtension from '~/lib/editor/extensions';

definePageMeta({
  path: '/:workspace/:memo',
  validate(route) {
    return route.params.memo !== '_settings';
  },
});

/**
 * Focuses on a node with the specified ID and moves the cursor to the end of the node.
 *
 * @param id - The ID of the node to focus.
 */

const focusNodeById = (id: string) => {
  if (!editor.value) return;

  const { state, view } = editor.value;
  const { doc, tr } = state;

  let pos = null;
  let nodeSize = 0;

  // Search for the node with the specified ID and get its position
  doc.descendants((node, posIndex) => {
    if (node.attrs.id === id) {
      pos = posIndex;
      nodeSize = node.nodeSize;
      return false;
    }
  });

  // Move the cursor to the end of the selected node
  if (pos !== null) {
    const selectionPos = pos + nodeSize - 1;
    const newTr = tr.setSelection(TextSelection.create(tr.doc, selectionPos));
    view.dispatch(newTr);
    view.focus();
  }
};

const menuItems = [
  [{
    label: 'Copy as markdown',
    icon: iconKey.copy,
    click: async () => {
      await copyAsMarkdown();
    },
  }],
  [
    {
      label: 'Delete',
      icon: iconKey.trash,
      click: () => {
        deleteConfirmationDialogOn.value = true;
      },
    },
  ],
];

const LOG_PREFIX = '[pages/[workspace]/[memo]/index]';
const logger = useConsoleLogger(LOG_PREFIX);

const route = useRoute();
const router = useRouter();
const toast = useToast();

const lowlight = createLowlight(all);
lowlight.register('html', xml);
lowlight.register('vue', xml);

const workspaceSlug = computed(() => route.params.workspace as string);
const memoSlug = computed(() => route.params.memo as string);

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

      await open(url);
    };

    editor.view.dom.addEventListener('click', handleLinkClick);
    return () => {
      editor.view.dom.removeEventListener('click', handleLinkClick);
    };
  },
  onTransaction: async ({ editor: _editor, transaction }) => {
    const { deletedLinks, addedLinks } = EditorAction.getChangedLinks(transaction);
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

    const { state } = _editor!;

    const tr = state.tr;

    let modified = false;
    let foundFirstImage: string | undefined = undefined;

    // TODO: The processing for headings and images is mixed, so they need to be separated.
    // The logic for headings should be achievable using only transactions.
    state.doc.descendants((node, pos) => {
      // Assign an ID to the Heading
      if (node.type.name === 'heading' && !node.attrs.id) {
        const newId = `heading-${Math.floor(Math.random() * 100000)}`;
        tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          id: newId,
        });
        modified = true;
      }

      // Update image for thumbnail
      if (node.type.name === 'image') {
        if (!foundFirstImage) {
          foundFirstImage = node.attrs.src;
        }
      }
    });

    if (modified) {
      editor.value?.view.dispatch(tr);
    }

    if (foundFirstImage !== headImageRef.value) {
      headImageRef.value = foundFirstImage;
    }
  },
  onSelectionUpdate: ({ editor }) => {
    const caretVisible = isCaretVisible(editor);

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

/**
 * Determine whether the cursor is within the visible range of the editor
 */
function isCaretVisible(editor: Editor): boolean {
  const { state, view } = editor;
  const pos = state.selection.from;

  // Get the absolute coordinates on the screen
  // e.g. { top: 123, bottom: 137, left: 50, right: 60 }
  const caretCoords = view.coordsAtPos(pos);

  // Get the editor's scroll container
  const container = document.getElementById('main');
  if (!container) return false;

  const containerRect = container.getBoundingClientRect();

  // Determine whether it is within the screen vertically.
  const isVisible
    = caretCoords.top >= containerRect.top
      && caretCoords.bottom <= containerRect.bottom;

  return isVisible;
}

const headImageRef = ref();

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

/********************************
 * Link operation
 ********************************/
const linkDialogOn = ref(false);
const state = reactive({
  url: undefined,
});
const openLinkDialog = () => {
  linkDialogOn.value = true;
};
const closeLinkDialog = () => {
  linkDialogOn.value = false;
};

const setLinkManually = () => {
  const previousUrl = editor.value?.getAttributes('link').href;
  state.url = previousUrl;
  openLinkDialog();
};

const setLink = () => {
  if (!state.url) {
    editor.value?.chain().focus().extendMarkRange('link').unsetLink();
    return;
  }

  if (isInternalLink(state.url)) {
    editor.value?.chain().focus().extendMarkRange('link').setLink({ href: state.url, target: null }).run();
  }
  else {
    editor.value?.chain().focus().extendMarkRange('link').setLink({ href: state.url, target: '_blank' }).run();
  }

  closeLinkDialog();
};

/********************************
 * Memo operation
 ********************************/
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

const deleteConfirmationDialogOn = ref(false);

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

/******************************************
 * Command palette operation
 ******************************************/

const linkPaletteRef = ref<InstanceType<typeof SearchPalette> | null>(null);

async function openLinkPalette() {
  if (linkPaletteRef.value) {
    linkPaletteRef.value.openCommandPalette();
  }
};

/*******************************
 * Shortcuts (window)
 *******************************/

const handleKeydownShortcut = (event: KeyboardEvent) => {
  if (isCmdKey(event) && event.key === 's') {
    event.preventDefault();
    saveMemo();
    return;
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydownShortcut);
  // >>> For focus behavior debug
  // document.addEventListener('focus', (event) => {
  //   logger.debug('Focused element:', document.activeElement);
  // }, true);
  // document.addEventListener('blur', (event) => {
  //   logger.debug('Focus left:', event.target);
  // }, true);
  // <<< For focus behavior debug
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydownShortcut);

  // Destroy editor
  editor.value?.destroy();
});

const copyAsMarkdown = async () => {
  if (!editor.value || !store.memo) {
    return;
  }

  const titleMarkdown = `# ${store.memo.title}\n\n`;
  const contentMarkdown = customMarkdownSerializer.serialize(editor.value.state.doc, { tightLists: true });

  const markdown = titleMarkdown + contentMarkdown;

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

const activeHeadingId = ref<string>();
const wasCaretOut = ref(false);

function onScroll() {
  const editorContainer = document.getElementById('main');
  if (!editorContainer) return;

  // Set a flag to disable heading identification based on the cursor position
  // when scrolling moves the cursor out of the screen.
  if (!isCaretVisible(editor.value!)) {
    wasCaretOut.value = true;
  }

  if (wasCaretOut.value) {
    const headings = editorContainer.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]') as NodeListOf<HTMLElement>;
    if (!headings.length) return;

    const containerRect = editorContainer.getBoundingClientRect();

    // Record headings that are positioned above the top of the container (containerRect.top),
    // meaning they have been pushed up by scrolling.
    //
    // For example, if the top of a heading is above the top of the screen, it means the heading has been pushed up.
    // Among such headings, the last one found (i.e., the lowest one) will be set as activeId.
    //
    // Adjust as needed by adding an offset.
    let activeId: string | null = null;
    headings.forEach((heading) => {
      const rect = heading.getBoundingClientRect();
      if (rect.top < containerRect.top + 100) {
        activeId = heading.getAttribute('id');
      }
    });

    activeHeadingId.value = activeId ?? undefined;
  }
}

onMounted(() => {
  const editorContainer = document.getElementById('main');
  if (!editorContainer) return;

  editorContainer.addEventListener('scroll', onScroll, { passive: true });
});

onUnmounted(() => {
  const editorContainer = document.getElementById('main');
  if (!editorContainer) return;

  editorContainer.removeEventListener('scroll', onScroll);
});
</script>

<style>
/* For focus behavior debug */
/* *:focus {
  outline: 2px solid red !important;
  background-color: rgba(255, 0, 0, 0.1);
} */
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
