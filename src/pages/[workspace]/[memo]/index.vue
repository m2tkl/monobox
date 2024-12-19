<template>
  <div>
    <div class="flex h-[calc(100vh-56px)] justify-center gap-3 px-4 pb-8 pt-4">
      <!-- Table of Contents -->
      <div class="w-[300px] overflow-y-auto">
        <ToCList v-if="toc" :items="toc.map((item) => {
          return {
            id: item.attrs ? (item.attrs.id as string) : '',
            text: item.content ? (item.content[0].text as string) : '',
            level: item.attrs ? (item.attrs.level as number) : 1,
          };
        })" @click="(id: any) => scrollToElementWithOffset(id, 128)" />
      </div>

      <!-- Editor -->
      <div class="w-full max-w-[780px] overflow-y-auto border border-slate-300 bg-slate-50" id="editor-main"
        @click.self="editor?.chain().focus('end').run()">

        <!-- Memo title -->
        <div class="flex gap-0.5 py-1 px-2 sticky top-0 left-0 z-50 bg-slate-200 overflow-auto" v-if="editor">
          <EditorToolbarButton @exec="toggleHeading(editor, {h: 1})" label="H1" />
          <EditorToolbarButton @exec="toggleHeading(editor, {h: 2})" label="H2" />
          <EditorToolbarButton @exec="toggleHeading(editor, {h: 3})" label="H3" />

          <EditorToolbarButton @exec="toggleStyle(editor, 'bold')" icon="carbon:text-bold" />
          <EditorToolbarButton @exec="toggleStyle(editor, 'italic')" icon="carbon:text-italic" />
          <EditorToolbarButton @exec="toggleStyle(editor, 'strike')" icon="carbon:text-strikethrough" />
          <EditorToolbarButton @exec="toggleBulletList(editor)" icon="carbon:list-bulleted" />
          <EditorToolbarButton @exec="toggleOrderedList(editor)" icon="carbon:list-numbered" />
          <EditorToolbarButton @exec="toggleBlockQuote(editor)" icon="carbon:quotes" />
          <EditorToolbarButton @exec="toggleCode(editor)" icon="carbon:string-text" />

          <EditorToolbarButton @exec="openLinkPalette()" icon="carbon:link" />
          <EditorToolbarButton @exec="unsetLink(editor)" icon="carbon:unlink" />


          <EditorToolbarButton @exec="resetStyle(editor)" label="Reset" />
        </div>

        <div class="bg-slate-50 p-8" @click.self="editor?.chain().focus('end').run()">
          <UInput v-model="title" placeholder="Title" autocomplete="off" size="xl" variant="none" rounded
            :padded="false" :ui="{
              size: { xl: 'text-2xl' },
              padding: {
                xs: 'p-0',
              },
              rounded: 'rounded-none',
            }" />

          <UDivider class="py-6" />

          <!-- Memo contents -->
          <div v-if="editor && memo">
            <editor-content v-if="editor" :editor="editor" />

            <!-- Editor contents skeleton -->
            <div v-else class="space-y-2">
              <USkeleton class="h-4 w-[350px]" />
              <USkeleton class="h-4 w-[200px]" />
              <USkeleton class="h-4 w-[250px]" />
            </div>
          </div>
        </div>
      </div>

      <!-- Links -->
      <div class="flex w-[300px] flex-col overflow-y-auto">
        <MemoLinkList v-if="linksData" :links="linksData" />
      </div>

    </div>

    <!-- Operation Buttons -->
    <div class="fixed bottom-10 right-10 z-50">
      <UButton icon="i-heroicons-trash" square variant="solid" size="xl" color="indigo" class="bg-slate-600"
        @click="deleteMemo"></UButton>
    </div>

    <div v-if="memos">
      <SearchPalette :workspace="workspace" :memos="memos" type="link" shortcut-symbol="i" :editor="editor" ref="linkPaletteRef" />
      <SearchPalette :workspace="workspace" :memos="memos" type="search" shortcut-symbol="k" :editor="editor" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { type Workspace } from '~/models/workspace';
import { type MemoDetail, type MemoIndexItem } from '~/models/memo';
import { type Link as LinkType } from '~/models/link';
import { invoke } from '@tauri-apps/api/core';
import { useEditor } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { EditorView } from '@tiptap/pm/view';
import { getChangedLinks, getLinkFromMouseClickEvent, isInternalLink, isModifierKeyPressed } from '~/domain/editor';
import { headingExtension } from '~/domain/extensions/heading';
import ToCList from '~/components/ToCList.vue';
import EditorToolbarButton from '~/components/EditorToolbarButton.vue';
import { toggleHeading, toggleStyle, toggleBulletList, toggleOrderedList, toggleCode, toggleBlockQuote, resetStyle } from '~/domain/editor';
import * as Memo from "~/domain/memo"
import { EditorContent } from '@tiptap/vue-3';
import SearchPalette from '~/components/SearchPalette.vue';
import { unsetLink } from '~/domain/editor';

const LOG_PREFIX = '[pages/[workspace]/[memo]/index]'
const logger = useConsoleLogger(LOG_PREFIX)

const route = useRoute()
const router = useRouter()
const toast = useToast();

const workspaceSlug = route.params.workspace as string;
const memoSlug = route.params.memo as string;

async function fetchWorkspace() {
  try {
    const workspaceDetail = await invoke<Workspace>('get_workspace', {
      args: { workspace_slug_name: workspaceSlug }
    })
    return workspaceDetail
  } catch (error) {
    console.error('Error fetching workspace:', error);
  }
}

async function fetcthMemo() {
  try {
    const memoDetail = await invoke<MemoDetail>('get_memo', {
      args: {
        workspace_slug_name: workspaceSlug,
        memo_slug_title: encodeForSlug(memoSlug),
      }
    })
    return memoDetail
  } catch (error) {
    console.error('Error fetching memo:', error);
  }
}

async function fetchWorkspaceMemosIndex() {
  try {
    const memosIndex = await invoke<MemoIndexItem[]>('get_workspace_memos',
      { args: { workspace_slug_name: route.params.workspace, } }
    )
    return memosIndex
  } catch (error) {
    console.error('Error fetching memos:', error);
  }
}

const workspace = ref()
workspace.value = await fetchWorkspace()

const memo = ref()
memo.value = await fetcthMemo()

const title = ref(memo.value?.title)

const memos = ref<Array<MemoIndexItem>>()
memos.value = await fetchWorkspaceMemosIndex()

const linksData = ref<LinkType[]>([])
await reloadLinks()

const { setWorkspace } = useWorkspace()
setWorkspace(workspace.value)

const editor = useEditor({
  content: memo.value ? JSON.parse(memo.value.content) : "",
  extensions: [
    StarterKit.configure({ heading: false }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        target: null,
      },
    }).extend({
      // Unset link after link text
      inclusive: false
    }),
    // imageExtention(),
    headingExtension(),
  ],
  editorProps: {
    /**
     * Register shortcuts for the Editor.
     *
     * NOTE:
     *   Shortcuts registered here are only active when the Editor is focused.
     *   For shortcuts that should be usable even when the Editor is not focused, use `window.addEventListener` to register them.
     */
    handleKeyDown(view: EditorView, event: KeyboardEvent) {
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
    const handleLinkClick = (event: MouseEvent) => {
      event.preventDefault()

      const url = getLinkFromMouseClickEvent(event)
      if (!url) {
        return;
      }

      if (isInternalLink(url) && !isModifierKeyPressed(event)) {
        router.push({ path: url })
        return;
      }

      window.open(url);
    }

    editor.view.dom.addEventListener("click", handleLinkClick);
    return () => {
      editor.view.dom.removeEventListener("click", handleLinkClick);
    };
  },
  onTransaction: async ({ transaction }) => {
    const { deletedLinks, addedLinks } = getChangedLinks(transaction)
    await Promise.all(
      deletedLinks.map(async (href) => {
        await deleteLink(href)
      })
    )
    await Promise.all(
      addedLinks.map(async (href) => {
        await createLink(href)
      })
    )

    if (deletedLinks.length > 0 || addedLinks.length > 0) {
      await Promise.all([
        reloadLinks(),
        saveMemo(),
      ])
      logger.log("Link updated successfully.")
    }

    // Assign an ID to the Heading
    const { state } = editor.value!;
    const tr = state.tr; // Get new transaction
    let modified = false;

    state.doc.descendants((node, pos) => {
      if (node.type.name === "heading" && !node.attrs.id) {
        const newId = `heading-${Math.floor(Math.random() * 100000)}`;
        tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          id: newId,
        });
        modified = true;
      }
    });

    if (modified) {
      editor.value?.view.dispatch(tr);
    }
  },
});

const toc = computed(() => {
  const content = editor.value?.getJSON().content;
  return content?.filter((c) => c.type === "heading");
});

/********************************
 * Link operation
 ********************************/

async function createLink(href: string) {
  await safeExecute(async () => {
    await Memo.createLink({ workspaceSlug, memoSlug }, href)
  }, `${LOG_PREFIX}/createLink`)()
}

async function deleteLink(href: string) {
  await safeExecute(async () => {
    await Memo.deleteLink({ workspaceSlug, memoSlug }, href)
  }, `${LOG_PREFIX}/deleteLink`)()
}

async function reloadLinks() {
  await safeExecute(async () => {
    const newLinks = await Memo.getLinks({ workspaceSlug, memoSlug })
    if (newLinks) {
      linksData.value = newLinks
    }
  }, `${LOG_PREFIX}/reloadLinks`)()
}

/********************************
 * Memo operation
 ********************************/

async function saveMemo() {
  const updatedTitle = title.value
  if (!updatedTitle) {
    window.alert("Please set title.");
    return;
  }

  const editorInstance = editor.value
  if (editorInstance == null) {
    logger.warn("Editor instance is undefined.")
    return;
  }

  // Send a request for the memo title before the update
  const result = await safeExecute(async () => {
    await Memo.save(
      { workspaceSlug, memoSlug },
      {
        slugTitle: encodeForSlug(updatedTitle),
        title: updatedTitle,
        content: JSON.stringify(editorInstance.getJSON()),
        description: truncateString(editorInstance.getText(), 256)
      }
    )
  }, `${LOG_PREFIX}/saveMemo`)()

  if (result.ok) {
    toast.clear()
    toast.add({
      title: "Saved!",
      timeout: 1000,
      icon: "i-heroicons-check-circle",
    });

    // Go to updated title page
    router.replace(`/${workspaceSlug}/${encodeForSlug(updatedTitle)}`);
  } else {
    toast.add({
      title: "Failed to save.",
      description: "Please save again.",
      color: "red",
      icon: "i-heroicons-exclamation-triangle"
    })
  }
};

async function deleteMemo() {
  await safeExecute(async () => {
    await Memo.trash({ workspaceSlug, memoSlug })
    router.replace(`/${workspaceSlug}`)
  }, `${LOG_PREFIX}/deleteMemo`)()
}

/******************************************
 * Command palette operation
 ******************************************/

const linkPaletteRef = ref<InstanceType<typeof SearchPalette> | null>(null)

async function openLinkPalette() {
  if (linkPaletteRef.value) {
    linkPaletteRef.value.openCommandPalette()
  }
};


/*******************************
 * Shortcuts (window)
 *******************************/

const handleKeydownShortcut = (event: KeyboardEvent) => {
  if (isCmdKey(event) && event.key === "s") {
    event.preventDefault();
    saveMemo();
    return;
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydownShortcut)
  // >>> For focus behavior debug
  // document.addEventListener('focus', (event) => {
  //   logger.debug('Focused element:', document.activeElement);
  // }, true);
  // document.addEventListener('blur', (event) => {
  //   logger.debug('Focus left:', event.target);
  // }, true);
  // <<< For focus behavior debug
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydownShortcut)

  // Destroy editor
  editor.value?.destroy()
})
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
}

.custom-heading-level-1 {
  font-size: 2.5em;
  color: #333;
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

.custom-heading-level-1::before {
  content: "H1";
  color: #555;
}

.custom-heading-level-2::before {
  content: "H2";
  color: #666;
}

.custom-heading-level-3::before {
  content: "H3";
  color: #777;
}

.custom-heading-level-4::before {
  content: "H4";
  color: #777;
}

.custom-heading-level-5::before {
  content: "H5";
  color: #777;
}

.custom-heading-level-6::before {
  content: "H6";
  color: #777;
}

.custom-heading::before {
  font-size: small;
  font-weight: bold;
  margin-right: 6px;
}
</style>
