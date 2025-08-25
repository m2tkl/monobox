<template>
  <node-view-wrapper class="code-block">
    <!-- Header Section -->
    <div class="code-block-header pb-2">
      <!-- Editing: unified input; Display: split title and extension -->
      <template v-if="isEditing">
        <UInput
          ref="unifiedInputRef"
          v-model="codeBlockName"
          size="xs"
          class="flex-1 pr-2 font-semibold text-sm"
          variant="none"
          :placeholder="'Untitled'"
          :ui="{ base: 'text-slate-300 text-sm' }"
          @blur="stopEditing"
          @keydown.enter="handleTitleEnter"
          @keydown.down.prevent="handleTitleArrowDown"
          @keydown.up.prevent="handleTitleArrowUp"
          @keydown.esc.prevent="stopEditing"
        />
      </template>
      <template v-else>
        <div
          class="flex items-center gap-2 flex-1 pr-2"
          @mousedown.prevent.stop="startEditing"
          @keydown.enter.prevent="startEditing"
          @keydown.space.prevent="startEditing"
        >
          <div
            ref="titleDisplayRef"
            class="min-h-[24px] cursor-text font-semibold text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500/60 rounded flex items-center ml-2 py-1 code-block-title"
            :class="!baseName ? 'text-slate-500' : ''"
            tabindex="0"
            role="textbox"
            aria-label="Code block title"
          >
            {{ baseName || 'Untitled' }}
          </div>
          <span
            v-if="fileExtension"
            :class="[
              'rounded px-1.5 py-0.5 text-[11px] border',
              languageUnknown ? 'border-red-500/60 bg-red-500/10 text-red-300' : 'border-slate-600 bg-slate-500/10 text-slate-300',
            ]"
            :title="languageUnknown ? 'Unknown language extension: no highlighter available' : 'Language extension'"
            aria-hidden="true"
          >
            {{ fileExtension }}
          </span>
        </div>
      </template>

      <!-- Copy Button -->
      <IconButton
        :icon="iconKey.copy"
        class="text-slate-300"
        @click="copyToClipboard"
      />
    </div>

    <!-- Code Content -->
    <div ref="codeBlockRef">
      <pre><node-view-content as="code" /></pre>
    </div>
  </node-view-wrapper>
</template>

<script lang="ts">
import { NodeViewContent, NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3';
import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { languageAlias, loaders, normalizeLanguage } from './langs';

import type { NodeViewProps } from '@tiptap/vue-3';
import type { LanguageFn } from 'lowlight';

import { UInput } from '#components';
</script>

<script lang="ts" setup>
defineComponent({
  props: nodeViewProps,
}) as Component<NodeViewProps>;

const props = defineProps(nodeViewProps);
const toast = useToast();

const codeBlockRef = ref<HTMLElement | null>(null);
const isEditing = ref(false);
const unifiedInputRef = ref<typeof UInput | null>(null);
const titleDisplayRef = ref<HTMLElement | null>(null);

const codeBlockName = computed({
  get: () => props.node.attrs.name || '',
  set: (name: string) => {
    props.updateAttributes({ name });
  },
});

const copyToClipboard = async () => {
  try {
    const codeElement = codeBlockRef.value!.querySelector('pre code');
    const codeContent = (codeElement!.textContent ?? '').trimEnd();

    await navigator.clipboard.writeText(codeContent);

    toast.add({
      title: 'Copied!',
      duration: 1000,
      icon: iconKey.success,
    });
  }
  catch (error) {
    console.error('Failed to copy code:', error);

    toast.add({
      title: 'Failed to copy.',
      color: 'error',
      icon: iconKey.failed,
    });
  }
};

const languageUnknown = ref(false);

/**
 * Ensure a language grammar is available in lowlight and apply it to the node.
 *
 * Behavior
 * - Normalizes the input language (aliases like `js` → `javascript`).
 * - If the grammar is already registered (under raw or normalized key), it sets
 *   the node `language` attribute (preferring the raw key) and returns.
 * - Otherwise, it dynamically imports the highlight.js language module for the
 *   normalized key, registers it in lowlight under both normalized and raw keys,
 *   and updates the node attributes (language + a `refresh` counter) to trigger
 *   a re-render.
 * - Special case: `plaintext` never loads a grammar and is treated as valid.
 * - On failure or unknown language, it clears the `language` attribute so the
 *   code block renders without highlighting instead of throwing.
 *
 * Side effects
 * - Mutates lowlight’s internal registry (register).
 * - Updates this node’s attributes via `props.updateAttributes`.
 *
 * @param lang Optional language hint (raw user input or extension token).
 */
async function ensureLanguageLoaded(lang?: string) {
  const lowlight = props.extension.options.lowlight;
  const { raw, normalized } = normalizeLanguage(lang);

  const fail = () => {
    languageUnknown.value = false;
    props.updateAttributes({ language: '' });
  };

  // No hint → nothing to do
  if (!raw || !normalized) {
    languageUnknown.value = false;
    return;
  }

  // Plaintext never requires a grammar
  if (raw === 'plaintext' || normalized === 'plaintext') {
    languageUnknown.value = false;
    return;
  }

  // If already registered (raw or normalized), set attribute and exit
  const available = lowlight.listLanguages();
  if (available.includes(raw) || available.includes(normalized)) {
    props.updateAttributes({ language: raw });
    languageUnknown.value = false;
    return;
  }

  // Resolve loader
  const loader = loaders[normalized];
  if (!loader) {
    fail();
    return;
  }

  try {
    const mod = await loader();

    let langFn: LanguageFn | undefined;
    if ('default' in mod && typeof (mod as { default?: unknown }).default === 'function') {
      langFn = (mod as { default: LanguageFn }).default;
    }
    else {
      const candidate = (mod as Record<string, unknown>)[normalized];
      if (typeof candidate === 'function') {
        langFn = candidate as LanguageFn;
      }
    }

    if (!langFn) {
      fail();
      return;
    }

    // Safe registration helper to avoid duplicate-registration noise
    const safeRegister = (key: string) => {
      if (!key || available.includes(key)) return;
      try {
        lowlight.register(key, langFn);
      }
      catch (err) {
        // ignore duplicate / invalid registration errors
        console.warn(err);
      }
    };

    // Register under both normalized and raw keys
    safeRegister(normalized);
    if (normalized !== raw) safeRegister(raw);

    const refresh = (props.node.attrs.refresh || 0) + 1;
    props.updateAttributes({ language: raw, refresh });
    languageUnknown.value = false;
  }
  catch {
    // Fallback to no-language to avoid rendering failure
    fail();
  }
}

// Known extensions include loader keys and alias keys
const knownExtensions = new Set<string>([
  ...Object.keys(loaders),
  ...Object.keys(languageAlias),
]);

/**
 * Derives the file extension (language hint) for the code block.
 *
 * Priority order:
 * 1. If the title contains a dot and has an extension part, return that extension.
 *
 *   e.g. sample.ts -> ts
 *
 * 2. If the title itself matches a known extension token (e.g., "ts"), return it.
 *
 *   e.g. ts -> ts
 *
 * 3. Otherwise, fallback to the node's `language` attribute (e.g., set via ```
 *
 *   e.g. ```ts -> code block is generated and language set as 'ts' -> ts
 *
 * 4. If none of the above apply, return an empty string.
 *
 *   e.g. ``` or title with no extension -> language is not set
 *
 * The returned extension is lowercased and may be empty if no hint is available.
 */
const fileExtension = computed(() => {
  const name = (codeBlockName.value || '').trim();
  const langAttr = (props.node.attrs.language || '').trim();

  if (name) {
    // 1) Title with explicit extension (e.g. "sample.ts")
    const idx = name.lastIndexOf('.');
    if (idx > 0 && idx < name.length - 1) {
      return name.slice(idx + 1).trim();
    }

    // 2) Title equals a known extension token (e.g., "ts")
    const lower = name.toLowerCase();
    if (knownExtensions.has(lower)) return lower;
  }

  // 3) Fallback to node language (e.g., set via ```ts)
  if (langAttr) return langAttr.toLowerCase();

  // 4) Otherwise, empty (``` or title with no extension)
  return '';
});

/**
 * Derives the base name (title without extension) for the code block.
 *
 * Behavior:
 * - If the title is empty, return an empty string.
 * - If the title contains a dot, return the substring before the last dot.
 *   e.g. "sample.ts" -> "sample"
 * - If the title does not contain a dot and the entire title is a known extension,
 *   return an empty string (because it represents only an extension).
 *   e.g. "ts" -> ""
 * - Otherwise, return the full title string.
 *   e.g. "myfile" -> "myfile"
 *
 * The returned string may be empty if no meaningful base name is available.
 */
const baseName = computed(() => {
  const name = (codeBlockName.value || '').trim();
  if (!name) return '';

  const idx = name.lastIndexOf('.');
  if (idx > 0) return name.slice(0, idx);

  // No dot: if entire name is a known extension, base name is empty
  if (knownExtensions.has(name.toLowerCase())) return '';

  return name;
});

onMounted(async () => {
  const ext = fileExtension.value || props.node.attrs.language;
  await nextTick();
  if (ext) {
    ensureLanguageLoaded(ext);
  }
  else {
    // Fallback: if input without dot is unknown, treat as plaintext
    const name = (codeBlockName.value || '').trim().toLowerCase();
    if (name && !name.includes('.') && !knownExtensions.has(name)) {
      props.updateAttributes({ language: 'plaintext' });
      languageUnknown.value = false;
    }
  }

  // If language is set via fence (e.g., ```ts) and title is empty,
  // set the title to the extension only (e.g., "ts").
  const langAttr = (props.node.attrs.language || '').trim();
  if ((!codeBlockName.value || codeBlockName.value.trim() === '') && langAttr) {
    props.updateAttributes({ name: langAttr.toLowerCase() });
  }
});

watch(fileExtension, (ext) => {
  const lang = (ext || '').toLowerCase();
  if (lang) {
    // Title provided a concrete extension → prefer it
    ensureLanguageLoaded(lang);
    return;
  }

  // No extension derived from title:
  // - Do NOT clear an existing language (e.g., set via ```ts)
  // - If user typed a bare token that looks like an unknown ext and there is no
  //   existing language, treat as plaintext for clarity.
  const name = (codeBlockName.value || '').trim().toLowerCase();
  const hasExistingLang = !!(props.node.attrs.language && String(props.node.attrs.language).trim());
  if (!hasExistingLang && name && !name.includes('.') && !knownExtensions.has(name)) {
    props.updateAttributes({ language: 'plaintext' });
    languageUnknown.value = false;
  }
  // else leave current language as-is
});

/**
 * Enters editing mode for the code block title input.
 *
 * Behavior:
 * - If a language extension is known (`fileExtension`) and the current title has no dot:
 *   - If the current title is non-empty and not equal to the extension, append the extension.
 *     e.g. currentName="example", ext="ts" → name="example.ts".
 *   - If the title is empty or already equals the extension (e.g., "py"), leave it unchanged.
 * - Sets `isEditing` to true and focuses the unified input field.
 * - Automatically selects the input text so the user can start typing immediately.
 *
 * Side effects:
 * - May update the node `name` attribute via `props.updateAttributes`.
 * - Changes the local state `isEditing` and focuses the input element.
 */
function startEditing() {
  // If only extension is known (e.g., set via ```py) and title has no dot,
  // prefill unified input with "<title or Untitled>.<ext>" for easier editing.
  const currentName = (codeBlockName.value || '').trim();
  const ext = (fileExtension.value || '').trim();
  if (ext) {
    if (currentName && !currentName.includes('.') && currentName.toLowerCase() !== ext.toLowerCase()) {
      // Append extension only when user provided a non-empty base name
      // that is not already equal to the extension itself.
      props.updateAttributes({ name: `${currentName}.${ext}` });
    }
    // If name is empty or equals the extension (e.g., "py"),
    // do not modify it; keep as-is to allow editing "py" directly.
  }
  isEditing.value = true;
  nextTick(() => {
    const el = unifiedInputRef.value?.$el as HTMLElement | undefined;
    const input = el?.querySelector('input') as HTMLInputElement | null;
    if (input) {
      input.focus();
      input.select();
    }
  });
}

function stopEditing() {
  isEditing.value = false;
}

function handleTitleEnter(e: KeyboardEvent) {
  // If composing (IME), don't move caret away or prevent default.
  if (e.isComposing || e.keyCode === 229) {
    return;
  }
  e.preventDefault();
  moveIntoBlock();
}

function moveBeforeBlock() {
  nextTick(() => {
    try {
      const getPos = props.getPos as (() => number) | undefined;
      const basePos = typeof getPos === 'function' ? getPos() : undefined;
      if (typeof basePos === 'number') {
        const prevPos = Math.max(1, basePos - 1);
        props.editor?.chain().focus().setTextSelection({ from: prevPos, to: prevPos }).run();
      }
      else {
        props.editor?.commands.focus('start');
      }
    }
    catch {
      // noop
    }
  });
}

function moveIntoBlock() {
  // Exit title editing and move caret into code block content (start)
  isEditing.value = false;
  nextTick(() => {
    try {
      const getPos = props.getPos as (() => number) | undefined;
      const basePos = typeof getPos === 'function' ? getPos() : undefined;
      if (typeof basePos === 'number') {
        const insidePos = basePos + 1;
        props.editor?.chain().focus().setTextSelection({ from: insidePos, to: insidePos }).run();
      }
      else {
        // Fallback: keep focus in editor
        props.editor?.commands.focus();
      }
    }
    catch {
      // noop
    }
  });
}

function handleTitleArrowDown() {
  moveIntoBlock();
}

function handleTitleArrowUp() {
  isEditing.value = false;
  moveBeforeBlock();
}
</script>

<style>
.tiptap .code-block {
  position: relative;
  font-weight: 500;
}

.tiptap .code-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #232B3B;
  transition: background 0.2s ease-in-out, border-bottom 0.2s ease-in-out;
  border-radius: 8px 8px 0 0;
  padding: 6px 10px;
  border-bottom: 2px solid #424851;
}

.tiptap .code-block-header:hover {
  border-bottom: 2px solid #4285F4;
}
</style>
