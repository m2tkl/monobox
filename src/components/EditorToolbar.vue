<template>
  <div
    v-if="editor"
    class="flex gap-0.5 overflow-auto px-2 py-1"
  >
    <EditorToolbarButton
      label="H1"
      @exec="EditorAction.toggleHeading(editor, { h: 1 })"
    />
    <EditorToolbarButton
      label="H2"
      @exec="EditorAction.toggleHeading(editor, { h: 2 })"
    />
    <EditorToolbarButton
      label="H3"
      @exec="EditorAction.toggleHeading(editor, { h: 3 })"
    />

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
      :icon="iconKey.listBulletted"
      @exec="EditorAction.toggleBulletList(editor)"
    />
    <EditorToolbarButton
      :icon="iconKey.listNumbered"
      @exec="EditorAction.toggleOrderedList(editor)"
    />
    <EditorToolbarButton
      :icon="iconKey.quotes"
      @exec="EditorAction.toggleBlockQuote(editor)"
    />
    <EditorToolbarButton
      :icon="iconKey.inlineCode"
      @exec="EditorAction.toggleCode(editor)"
    />
    <EditorToolbarButton
      :icon="iconKey.clearFormat"
      @exec="EditorAction.resetStyle(editor)"
    />
  </div>
</template>

<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';

import { EditorAction } from '~/lib/editor';

defineProps<{ editor: Editor }>();
</script>
