<template>
  <div
    ref="titleFieldRef"
    class="text-2xl font-bold text-[#666]"
    contenteditable="true"
    @input="onInput"
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
</script>
