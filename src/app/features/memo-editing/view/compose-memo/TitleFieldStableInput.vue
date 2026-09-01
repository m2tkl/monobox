<template>
  <div
    ref="titleFieldRef"
    class="text-2xl font-bold"
    style="color: var(--color-text-primary)"
    contenteditable="true"
    @input="onInput"
    @paste="onPaste"
    @compositionstart="onCompositionStart"
    @compositionend="onCompositionEnd"
  >
    {{ editableText }}
  </div>
</template>

<script setup lang="ts">
const title = defineModel<string>({ required: true });

// `editableText` is used to prevent cursor position issues caused by DOM updates.
// By separating the displayed content from the bound `title`, we avoid re-rendering
// the DOM directly during editing, ensuring the cursor remains in the expected position.
const editableText = ref(title.value);

const titleFieldRef = ref<HTMLElement | null>(null);

/***************************
 * IME state handling
 ***************************/
// Flag to manage IME state
let isComposing = false;

// IME input starts
const onCompositionStart = () => {
  isComposing = true;
};

// IME input ends
const onCompositionEnd = () => {
  isComposing = false;
  // Process input when IME input is confirmed
  onInput();
};

/***************************
 * Input handling
 ***************************/
const onInput = () => {
  // Skip input processing when IME composition is active
  if (isComposing) {
    return;
  }

  // Updates the bound title value with the trimmed content of the element.
  const el = titleFieldRef.value;
  if (el) {
    title.value = el.innerText.trim();
  }
};

const onPaste = (event: ClipboardEvent) => {
  event.preventDefault();

  const plainText = event.clipboardData?.getData('text/plain') ?? '';
  insertPlainTextAtSelection(plainText);
  onInput();
};

function insertPlainTextAtSelection(text: string) {
  const el = titleFieldRef.value;
  if (!el) return;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    el.append(document.createTextNode(text));
    return;
  }

  const range = selection.getRangeAt(0);
  if (!el.contains(range.commonAncestorContainer)) {
    el.append(document.createTextNode(text));
    return;
  }

  range.deleteContents();

  const textNode = document.createTextNode(text);
  range.insertNode(textNode);
  range.setStartAfter(textNode);
  range.collapse(true);

  selection.removeAllRanges();
  selection.addRange(range);
}

function focusAndSelectAll() {
  const el = titleFieldRef.value;
  if (!el) return;

  el.focus();

  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  range.selectNodeContents(el);
  selection.removeAllRanges();
  selection.addRange(range);
}

defineExpose({
  focusAndSelectAll,
});
</script>
