<template>
  <div>
    <NuxtRouteAnnouncer />

    <UApp>
      <NuxtPage />
    </UApp>
  </div>
</template>

<script setup lang="ts">
useEventHandler();
useRouteWatcher();
useTitleUpdater();

emitEvent('app/init', undefined);
</script>

<style>
html,
body {
  background-color: rgb(226 232 240);
  /* Disable bounce */
  overscroll-behavior: none;
  box-sizing: border-box;
}

*, *::before, *::after {
  box-sizing: inherit;
  overscroll-behavior: none;
}

/* Utilities */

/* Utilities > border */
.border-top {
  border-top: 1px solid rgb(180, 187, 195);
}

.border-bottom {
  border-bottom: 1px solid rgb(180, 187, 195);
}

.border-left {
  border-left: 1px solid rgb(180, 187, 195);
}

.border-right {
  border-right: 1px solid rgb(180, 187, 195);
}

/* Utilities > scrollbar */
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

/* Utilities > behavior */
.disable-bounce {
  overscroll-behavior: none;
}

/* Scrollbar customize */
/* Webkit（Chrome, Edge, Safai etc...） */
::-webkit-scrollbar {
  /* For vertical scrollbar */
  width: 6px;
  /* For horizontal scrollbar */
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(73, 73, 73, 0.2);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(83, 83, 83, 0.3);
}

/* Basic editor styles */
.tiptap :first-child {
  margin-top: 0;
}

/* List styles */
.tiptap ul,
.tiptap ol {
  padding: 0 1.5rem;
  margin: 0.4rem 1rem 0.4rem 0.4rem;
}

.tiptap ul {
  list-style-type: circle;
}

.tiptap ol {
  list-style-type: decimal;
}

.tiptap ul li p,
.tiptap ol li p {
  margin-top: 0.25em;
  margin-bottom: 0.25em;
}

/* Heading styles */
.tiptap h1,
.tiptap h2,
.tiptap h3,
.tiptap h4,
.tiptap h5,
.tiptap h6 {
  line-height: 1.1;
  margin-top: 2.0rem;
  margin-bottom: 1.0rem;
  text-wrap: pretty;
}

.tiptap h1 {
  font-size: 1.4rem;
}

.tiptap h2 {
  font-size: 1.2rem;
}

.tiptap h3 {
  font-size: 1.1rem;
}

.tiptap h4,
.tiptap h5,
.tiptap h6 {
  font-size: 1rem;
}

/* Code and preformatted text styles */
.tiptap code {
  background-color: rgb(227, 199, 255);
  border-radius: 0.4rem;
  color: black;
  font-size: 0.85rem;
  padding: 0.25em 0.3em;
}

.tiptap pre {
  background: #232B3B;
  border-bottom-left-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
  color: white;
  font-family: "JetBrainsMono", monospace;
  margin: 1rem 0;
  padding: 0.75rem 1rem;
}

.tiptap pre code {
  background: none;
  color: inherit;
  font-size: 0.8rem;
  padding: 0;
}

.tiptap pre code .hljs-comment,
.tiptap pre code .hljs-quote {
  color: #ccc;
}

.tiptap pre code .hljs-variable,
.tiptap pre code .hljs-template-variable,
.tiptap pre code .hljs-attribute,
.tiptap pre code .hljs-tag,
.tiptap pre code .hljs-name,
.tiptap pre code .hljs-regexp,
.tiptap pre code .hljs-link,
.tiptap pre code .hljs-selector-id,
.tiptap pre code .hljs-selector-class {
  color: #f98181;
}

.tiptap pre code .hljs-number,
.tiptap pre code .hljs-meta,
.tiptap pre code .hljs-built_in,
.tiptap pre code .hljs-builtin-name,
.tiptap pre code .hljs-literal,
.tiptap pre code .hljs-type,
.tiptap pre code .hljs-params {
  color: #fbbc88;
}

.tiptap pre code .hljs-string,
.tiptap pre code .hljs-symbol,
.tiptap pre code .hljs-bullet {
  color: #b9f18d;
}

.tiptap pre code .hljs-title,
.tiptap pre code .hljs-section {
  color: #faf594;
}

.tiptap pre code .hljs-keyword,
.tiptap pre code .hljs-selector-tag {
  color: #70cff8;
}

.tiptap pre code .hljs-emphasis {
  font-style: italic;
}

.tiptap pre code .hljs-strong {
  font-weight: 700;
}

.tiptap blockquote {
  border-left: 3px solid var(--color-border-default);
  margin: 1.5rem 0;
  padding-left: 1rem;
}

.tiptap hr {
  border: none;
  border-top: 1px solid var(--color-border-muted);
  margin: 2rem 0;
}

.tiptap a {
  color: blue;
  cursor: pointer;
}

.tiptap a:hover {
  color: blue;
  text-decoration: underline blue;
  text-underline-offset: 0.2em;
  text-decoration-style: solid;
  text-decoration-skip-ink: none;
}

.tiptap p {
  margin: 16px 0;
  line-height: 1.5;
}

.tiptap p br {
  line-height: 1;
  display: block;
  margin: 4px 0;
}

/* Focus highlight */
.tiptap .has-focus {
  box-shadow: 0 0 0 2px #b3c8f5;
  background-color: var(--color-focus-bg);
  border-radius: 8px;
}

/* Override background color for focused code blocks */
.tiptap pre.has-focus {
  background-color: black;
}

.tiptap img {
  box-shadow: 0 0 0 1px var(--color-surface);
  border-radius: 8px;

  display: block;
  margin-left: auto;
  margin-right: auto;
  max-width: 100%;
  height: auto;
}

/* Table-specific styling */
.tiptap table {
  border-collapse: collapse;
  margin: 0;
  overflow: hidden;
  table-layout: fixed;
  width: 100%;
}

.tiptap table td,
.tiptap table th {
  border: 1px solid var(--color-border-default);
  box-sizing: border-box;
  min-width: 1em;
  padding: 6px 8px;
  position: relative;
  vertical-align: top;
}

.tiptap table td > *,
.tiptap table th > * {
  margin-bottom: 0;
}

.tiptap table th {
  background-color: var(--gray-1);
  font-weight: bold;
  text-align: left;
}

.tiptap table .selectedCell:after {
  background: var(--color-border-muted);
  content: "";
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  pointer-events: none;
  position: absolute;
  z-index: 2;
}

.tiptap table .column-resize-handle {
  background-color: var(--purple);
  bottom: -2px;
  pointer-events: none;
  position: absolute;
  right: -2px;
  top: 0;
  width: 4px;
}

.tiptap .tableWrapper {
  margin: 1.5rem 0;
  overflow-x: auto;
}

.tiptap.resize-cursor {
  cursor: ew-resize;
  cursor: col-resize;
}

/* Task list specific styles */
.tiptap ul[data-type="taskList"] {
  margin-left: 0;
  padding: 0;
}

.tiptap ul[data-type="taskList"] li {
  align-items: flex-start;
  display: flex;
}

.tiptap ul[data-type="taskList"] li > label {
  flex: 0 0 auto;
  margin-right: 0.5rem;
  user-select: none;
}

.tiptap ul[data-type="taskList"] li > div {
  flex: 1 1 auto;
}

.tiptap ul[data-type="taskList"] input[type="checkbox"] {
  cursor: pointer;
}

.tiptap ul[data-type="taskList"] ul[data-type="taskList"] {
  margin: 0;
}

.tiptap-image {
  margin: 16px 0;
}

.tiptap-image figcaption {
  font-size: 0.8em;
  text-align: center;
  margin-top: 4px;
  color: #666;
}

/* Remove focus outline of editor */
/* https://github.com/ueberdosis/tiptap/issues/526 */
.ProseMirror:focus {
  outline: none;
}
</style>
