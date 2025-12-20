import { mergeAttributes, type Extensions } from '@tiptap/core';
import Focus from '@tiptap/extension-focus';
import Link from '@tiptap/extension-link';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import StarterKit from '@tiptap/starter-kit';

import * as CustomExtension from './extensions';

import type { NodeViewProps } from '@tiptap/vue-3';
import type { Component } from 'vue';

import { isInternalLink } from '~/utils/link';

// Re-export existing editor APIs for gradual migration
export * as EditorAction from './core/action';
// Backward-compatible named exports for common actions
export { setLink, unsetLink } from './core/action';
export * as EditorQuery from './core/query';
export * as EditorDom from './core/dom';
export * as EditorSelector from './core/selector';
export * as EditorUtil from './core/util';
export * as EditorMsg from './core/msg';
export type { EditorMsg as EditorMsgType } from './core/msg';
export { dispatchEditorMsg } from './core/dispatcher';
export * as CustomExtension from './extensions';

// Serializer helpers for consumers
export { convertEditorJsonToHtml } from './serializer/html';
export { customMarkdownSerializer, convertToMarkdown } from './serializer/markdown';

type BuildExtensionsOptions = {
  CodeBlockComponent: Component<NodeViewProps>;
};

/**
 * Factory to build extentions for editor
 */
export function buildExtensions(options: BuildExtensionsOptions): Extensions {
  const { CodeBlockComponent } = options;

  const extensions = [
    StarterKit.configure({ heading: false, codeBlock: false }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { target: null },
    }).extend({
      inclusive: false,
      renderHTML({ HTMLAttributes }) {
        const href = HTMLAttributes.href;
        if (!isInternalLink(href)) {
          HTMLAttributes.class = `${HTMLAttributes.class || ''} external-link`.trim();
        }
        return ['a', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
      },
    }),
    CustomExtension.imageExtention(),
    CustomExtension.headingExtension(),
    CustomExtension.codeBlockExtension(CodeBlockComponent),
    CustomExtension.codeBlockNavExtension(),

    Focus.configure({ className: 'has-focus', mode: 'deepest' }),
    TaskList,
    TaskItem.configure({ nested: true, HTMLAttributes: { class: 'custom-task-item' } }),
    CustomExtension.CustomTab,
  ] as unknown as Extensions;

  return extensions;
}
