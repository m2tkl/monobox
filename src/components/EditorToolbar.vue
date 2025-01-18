<template>
  <div
    v-if="editor"
    class="flex gap-0.5 py-1 px-2 bg-slate-200 overflow-auto"
  >
    <EditorToolbarButton
      label="H1"
      @exec="toggleHeading(editor, { h: 1 })"
    />
    <EditorToolbarButton
      label="H2"
      @exec="toggleHeading(editor, { h: 2 })"
    />
    <EditorToolbarButton
      label="H3"
      @exec="toggleHeading(editor, { h: 3 })"
    />

    <EditorToolbarButton
      :icon="iconKey.textBold"
      @exec="toggleStyle(editor, 'bold')"
    />
    <EditorToolbarButton
      :icon="iconKey.textItalic"
      @exec="toggleStyle(editor, 'italic')"
    />
    <EditorToolbarButton
      :icon="iconKey.textStrikeThrough"
      @exec="toggleStyle(editor, 'strike')"
    />
    <EditorToolbarButton
      :icon="iconKey.listBulletted"
      @exec="toggleBulletList(editor)"
    />
    <EditorToolbarButton
      :icon="iconKey.listNumbered"
      @exec="toggleOrderedList(editor)"
    />
    <EditorToolbarButton
      :icon="iconKey.quotes"
      @exec="toggleBlockQuote(editor)"
    />
    <EditorToolbarButton
      :icon="iconKey.inlineCode"
      @exec="toggleCode(editor)"
    />
    <EditorToolbarButton
      :icon="iconKey.clearFormat"
      @exec="resetStyle(editor)"
    />
  </div>
</template>

<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';
import { toggleHeading, toggleStyle, toggleBulletList, toggleOrderedList, toggleBlockQuote, toggleCode, resetStyle } from '~/domain/editor';

defineProps<{ editor: Editor }>();
</script>
