<template>
  <NuxtLayout name="default">
    <template #context-menu>
      <UDropdown
        :items="menuItems"
        :popper="{ placement: 'bottom-start' }"
      >
        <div class="flex items-center">
          <UIcon
            :name="iconKey.dotMenuVertical"
          />
        </div>
      </UDropdown>
    </template>

    <div class="h-full w-full">
      <div class="flex h-full w-full justify-center gap-3 px-4 pb-4">
        <!-- Editor -->
        <div
          id="editor-main"
          class="w-full overflow-y-auto border border-slate-300 bg-slate-50"
          @click.self="editor?.chain().focus('end').run()"
        >
          <!-- Memo title -->
          <EditorToolbar
            v-if="editor"
            :editor="editor"
            class="sticky top-0 left-0 z-50"
          />

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
              @exec="EditorCommand.unsetLink(editor)"
            />
          </BubbleMenu>

          <div
            class="bg-slate-50 p-8"
            @click.self="editor?.chain().focus('end').run()"
          >
            <TitleFieldAutoResize
              v-if="store.memo"
              v-model="store.memo.title"
            />

            <UDivider class="py-6" />

            <!-- Memo contents -->
            <div v-if="editor">
              <editor-content
                v-if="editor"
                :editor="editor"
              />

              <!-- Editor contents skeleton -->
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

        <!-- Right section -->
        <div class="w-[300px] overflow-y-auto flex flex-col gap-3">
          <ToCList
            v-if="toc"
            :items="toc.map((item) => {
              return {
                id: item.attrs ? (item.attrs.id as string) : '',
                text: item.content ? (item.content[0].text as string) : '',
                level: item.attrs ? (item.attrs.level as number) : 1,
              };
            })"
            @click="(id: any) => scrollToElementWithOffset(id, 128)"
          />

          <MemoLinkList
            v-if="store.links"
            :links="store.links"
          />
        </div>
      </div>

      <!-- Operation Buttons -->
      <div class="fixed bottom-10 right-10 z-50">
        <UButton
          :icon="iconKey.trash"
          square
          variant="solid"
          size="xl"
          color="indigo"
          class="bg-slate-600"
          @click="deleteMemo"
        />
      </div>

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
    </div>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import { open } from '@tauri-apps/plugin-shell';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Focus from '@tiptap/extension-focus';
import Link from '@tiptap/extension-link';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { MarkdownSerializer, defaultMarkdownSerializer } from '@tiptap/pm/markdown';
import StarterKit from '@tiptap/starter-kit';
import { BubbleMenu, EditorContent, type NodeViewProps, VueNodeViewRenderer, useEditor } from '@tiptap/vue-3';
import xml from 'highlight.js/lib/languages/xml';
import { all, createLowlight } from 'lowlight';

import type { EditorView } from '@tiptap/pm/view';

import CodeBlockComponent from '~/components/CodeBlock.vue';
import EditorToolbarButton from '~/components/EditorToolbarButton.vue';
import SearchPalette from '~/components/SearchPalette.vue';
import ToCList from '~/components/ToCList.vue';
import * as EditorCommand from '~/lib/editor/command.js';
import * as CustomExtension from '~/lib/editor/extensions';

definePageMeta({
  path: '/:workspace/:memo',
  validate(route) {
    return route.params.memo !== '_settings';
  },
});

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
    CodeBlockLowlight.extend({
      addNodeView() {
        return VueNodeViewRenderer(CodeBlockComponent as Component<NodeViewProps>);
      },
      addAttributes() {
        return {
          ...this.parent?.(),
          name: {
            default: '',
            parseHTML: element => element.getAttribute('name'),
            renderHTML: (attributes) => {
              return {
                name: attributes.name,
              };
            },
          },
        };
      },
    }).configure({ lowlight }),
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
      const url = EditorCommand.getLinkFromMouseClickEvent(event);

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
    const { deletedLinks, addedLinks } = EditorCommand.getChangedLinks(transaction);
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
});

const headImageRef = ref();

const toc = computed(() => {
  const content = editor.value?.getJSON().content;
  return content?.filter(c => c.type === 'heading');
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

const customMarkdownSerializer = new MarkdownSerializer(
  {
    ...defaultMarkdownSerializer.nodes,
    /**
     * Adjust the heading levels for output
     */
    heading(state, node) {
      const adjustedLevel = Math.min(node.attrs.level + 1, 6);
      state.write(`${'#'.repeat(adjustedLevel)} `);
      state.renderInline(node);
      state.closeBlock(node);
    },
    hardBreak(state, _node) {
      state.write('  \n');
    },
    codeBlock(state, node) {
      // Get code block language and add ```{extension}
      const language = node.attrs.language || '';
      state.write(`\`\`\`${language}\n`);

      // Write code block text
      state.text(node.textContent, false);

      // Close code block
      state.write('\n```');
      state.closeBlock(node);
    },
    bulletList(state, node) {
      state.renderList(node, '  ', () => '- ');
    },
    orderedList(state, node) {
      state.renderList(node, '  ', index => `${index + 1}. `);
    },
    listItem(state, node) {
      state.renderInline(node);
      state.ensureNewLine();
    },
    taskList(state, node) {
      node.forEach((child, _, index) => {
        state.render(child, node, index);
      });
    },
    taskItem(state, node) {
      const checked = node.attrs.checked ? 'x' : ' ';
      state.write(`- [${checked}] `);
      state.renderInline(node);
      state.ensureNewLine();
    },
  },
  defaultMarkdownSerializer.marks,
);

const copyAsMarkdown = async () => {
  if (!editor.value || !store.memo) {
    return;
  }

  const titleMarkdown = `# ${store.memo.title}\n\n`;
  const contentMarkdown = customMarkdownSerializer.serialize(editor.value.state.doc);

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
