<template>
  <div
    v-if="editor"
    class="flex gap-0.5 py-1 px-2 bg-slate-200 overflow-auto"
  >
    <EditorToolbarButton
      label="H1"
      @exec="EditorCommand.toggleHeading(editor, { h: 1 })"
    />
    <EditorToolbarButton
      label="H2"
      @exec="EditorCommand.toggleHeading(editor, { h: 2 })"
    />
    <EditorToolbarButton
      label="H3"
      @exec="EditorCommand.toggleHeading(editor, { h: 3 })"
    />

    <EditorToolbarButton
      :icon="iconKey.textBold"
      @exec="EditorCommand.toggleStyle(editor, 'bold')"
    />
    <EditorToolbarButton
      :icon="iconKey.textItalic"
      @exec="EditorCommand.toggleStyle(editor, 'italic')"
    />
    <EditorToolbarButton
      :icon="iconKey.textStrikeThrough"
      @exec="EditorCommand.toggleStyle(editor, 'strike')"
    />
    <EditorToolbarButton
      :icon="iconKey.listBulletted"
      @exec="EditorCommand.toggleBulletList(editor)"
    />
    <EditorToolbarButton
      :icon="iconKey.listNumbered"
      @exec="EditorCommand.toggleOrderedList(editor)"
    />
    <EditorToolbarButton
      :icon="iconKey.quotes"
      @exec="EditorCommand.toggleBlockQuote(editor)"
    />
    <EditorToolbarButton
      :icon="iconKey.inlineCode"
      @exec="EditorCommand.toggleCode(editor)"
    />
    <EditorToolbarButton
      :icon="iconKey.clearFormat"
      @exec="EditorCommand.resetStyle(editor)"
    />
  </div>
</template>

<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';

import * as EditorCommand from '~/lib/editor/command.js';

defineProps<{ editor: Editor }>();
</script>
