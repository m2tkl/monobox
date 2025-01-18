<template>
  <div class="flex gap-0.5 py-1 px-2 bg-slate-200 overflow-auto" v-if="editor">
    <EditorToolbarButton @exec="toggleHeading(editor, { h: 1 })" label="H1" />
    <EditorToolbarButton @exec="toggleHeading(editor, { h: 2 })" label="H2" />
    <EditorToolbarButton @exec="toggleHeading(editor, { h: 3 })" label="H3" />

    <EditorToolbarButton @exec="toggleStyle(editor, 'bold')" :icon="iconKey.textBold" />
    <EditorToolbarButton @exec="toggleStyle(editor, 'italic')" :icon="iconKey.textItalic" />
    <EditorToolbarButton @exec="toggleStyle(editor, 'strike')" :icon="iconKey.textStrikeThrough" />
    <EditorToolbarButton @exec="toggleBulletList(editor)" :icon="iconKey.listBulletted" />
    <EditorToolbarButton @exec="toggleOrderedList(editor)" :icon="iconKey.listNumbered" />
    <EditorToolbarButton @exec="toggleBlockQuote(editor)" :icon="iconKey.quotes" />
    <EditorToolbarButton @exec="toggleCode(editor)" :icon="iconKey.inlineCode" />
    <EditorToolbarButton @exec="resetStyle(editor)" :icon="iconKey.clearFormat" />
  </div>
</template>

<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';
import { toggleHeading, toggleStyle, toggleBulletList, toggleOrderedList, toggleBlockQuote, toggleCode, resetStyle } from '~/domain/editor';

defineProps<{ editor: Editor }>()
</script>
