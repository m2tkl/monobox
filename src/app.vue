<template>
  <div>
    <NuxtRouteAnnouncer />

    <NuxtPage />

    <UNotifications />
  </div>
</template>

<script setup lang="ts">
import { getCurrentWindow } from '@tauri-apps/api/window';

const appWindow = getCurrentWindow();
const store = useWorkspaceStore();
watch(() => store.workspace, async () => {
  if (store.workspace) {
    await appWindow.setTitle(store.workspace.name);
  }
  else {
    await appWindow.setTitle('monobox');
  }
});
</script>

<style>
:root {
  --purple-light: rgb(227, 199, 255);
  --black: black;
  --white: white;
  --gray-3: #555;
  --gray-2: #888;
  --slate: #e2e8f0;
  --slate-75: #e2e8f0bf
}

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
/* Webkit（Chrome, Edge, Safariなど） */
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
.tiptap {
  :first-child {
    margin-top: 0;
  }

  /* List styles */
  ul,
  ol {
    padding: 0 1.5rem;
    margin: 0.4rem 1rem 0.4rem 0.4rem;
  }

  ul {
    list-style-type: circle;
  }

  ol {
    list-style-type: decimal;
  }

  ul li p,
  ol li p {
    margin-top: 0.25em;
    margin-bottom: 0.25em;
  }

  /* Heading styles */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    line-height: 1.1;
    margin-top: 2.0rem;
    margin-bottom: 0.5rem;
    text-wrap: pretty;
  }

  h1,
  h2 {
    margin-top: 2.0rem;
    margin-bottom: 1.0rem;
  }

  h1 {
    font-size: 1.4rem;
  }

  h2 {
    font-size: 1.2rem;
  }

  h3 {
    font-size: 1.1rem;
  }

  h4,
  h5,
  h6 {
    font-size: 1rem;
  }

  /* Code and preformatted text styles */
  code {
    background-color: var(--purple-light);
    border-radius: 0.4rem;
    color: var(--black);
    font-size: 0.85rem;
    padding: 0.25em 0.3em;
  }

  pre {
    background: #232B3B;
    border-bottom-left-radius: 0.5rem;
    border-bottom-right-radius: 0.5rem;
    color: var(--white);
    font-family: "JetBrainsMono", monospace;
    margin: 1rem 0;
    padding: 0.75rem 1rem;
  }

  pre code {
    background: none;
    color: inherit;
    font-size: 0.8rem;
    padding: 0;
  }

  pre code .hljs-comment,
  pre code .hljs-quote {
    color: #ccc;
  }

  pre code .hljs-variable,
  pre code .hljs-template-variable,
  pre code .hljs-attribute,
  pre code .hljs-tag,
  pre code .hljs-name,
  pre code .hljs-regexp,
  pre code .hljs-link,
  pre code .hljs-name,
  pre code .hljs-selector-id,
  pre code .hljs-selector-class {
    color: #f98181;
  }

  pre code .hljs-number,
  pre code .hljs-meta,
  pre code .hljs-built_in,
  pre code .hljs-builtin-name,
  pre code .hljs-literal,
  pre code .hljs-type,
  pre code .hljs-params {
    color: #fbbc88;
  }

  pre code .hljs-string,
  pre code .hljs-symbol,
  pre code .hljs-bullet {
    color: #b9f18d;
  }

  pre code .hljs-title,
  pre code .hljs-section {
    color: #faf594;
  }

  pre code .hljs-keyword,
  pre code .hljs-selector-tag {
    color: #70cff8;
  }

  pre code .hljs-emphasis {
    font-style: italic;
  }

  pre code .hljs-strong {
    font-weight: 700;
  }

  blockquote {
    border-left: 3px solid var(--gray-3);
    margin: 1.5rem 0;
    padding-left: 1rem;
  }

  hr {
    border: none;
    border-top: 1px solid var(--gray-2);
    margin: 2rem 0;
  }

  a {
    color: blue;
    cursor: pointer;
  }

  a:hover {
    color: blue;

    text-decoration: underline blue;
    text-underline-offset: 0.2em;
    text-decoration-style: solid;
    text-decoration-skip-ink: none;
  }

  p {
    margin: 16px 0;
    line-height: 1.5;
  }

  p br {
    line-height: 1;
    display: block;
    margin: 4px 0;
  }

  /* Focus highlight */
  .has-focus {
    box-shadow: 0 0 0 2px #b3c8f5;
    background-color: var(--slate);
    border-radius: 8px;
  }

  /* Override background color for focused code blocks */
  pre.has-focus {
    background-color: var(--black);
  }

  /* Table-specific styling */
  table {
    border-collapse: collapse;
    margin: 0;
    overflow: hidden;
    table-layout: fixed;
    width: 100%;

    td,
    th {
      border: 1px solid var(--gray-3);
      box-sizing: border-box;
      min-width: 1em;
      padding: 6px 8px;
      position: relative;
      vertical-align: top;

      >* {
        margin-bottom: 0;
      }
    }

    th {
      background-color: var(--gray-1);
      font-weight: bold;
      text-align: left;
    }

    .selectedCell:after {
      background: var(--gray-2);
      content: "";
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      pointer-events: none;
      position: absolute;
      z-index: 2;
    }

    .column-resize-handle {
      background-color: var(--purple);
      bottom: -2px;
      pointer-events: none;
      position: absolute;
      right: -2px;
      top: 0;
      width: 4px;
    }

  }

  .tableWrapper {
    margin: 1.5rem 0;
    overflow-x: auto;
  }

  &.resize-cursor {
    cursor: ew-resize;
    cursor: col-resize;
  }

  /* Task list specific styles */
  ul[data-type="taskList"] {
    /* list-style: none; */
    margin-left: 0;
    padding: 0;

    li {
      align-items: flex-start;
      display: flex;

      >label {
        flex: 0 0 auto;
        margin-right: 0.5rem;
        user-select: none;
      }

      >div {
        flex: 1 1 auto;
      }
    }

    input[type="checkbox"] {
      cursor: pointer;
    }

    ul[data-type="taskList"] {
      margin: 0;
    }
  }
}

/* Remove focus outline of editor */
/* https://github.com/ueberdosis/tiptap/issues/526 */
.ProseMirror:focus {
  outline: none;
}

/* Page transition */
/* .page-enter-active,
.page-leave-active {
  transition: all 0.1s;
}
.page-enter-from,
.page-leave-to {
  opacity: 0.8;
  filter: blur(0.05rem);
} */
</style>
