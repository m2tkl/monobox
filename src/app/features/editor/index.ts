import { mergeAttributes, type Extensions } from '@tiptap/core';
import Focus from '@tiptap/extension-focus';
import Link from '@tiptap/extension-link';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { Plugin } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import { find } from 'linkifyjs';

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
export * as EditorFocus from './core/focus';
export * as EditorDoc from './core/doc';
export * as EditorMsg from './core/command';
export type { EditorMsg as EditorMsgType } from './core/command';
export type { EditorCommandHandler, EditorCommandHandlerMap } from './core/command';
export { createEditorDispatcher, dispatchEditorMsg } from './core/command';
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
      addProseMirrorPlugins() {
        const parentPlugins = this.parent?.() ?? [];

        return [
          ...parentPlugins,
          new Plugin({
            props: {
              handlePaste: (view, event) => {
                const clipboardData = event.clipboardData;
                if (!clipboardData || clipboardData.files.length > 0) {
                  return false;
                }

                const html = clipboardData.getData('text/html');
                if (html) {
                  return false;
                }

                const text = clipboardData.getData('text/plain');
                const link = find(text, { defaultProtocol: this.options.defaultProtocol })
                  .find(item => item.isLink && item.value === text);

                if (!link) {
                  return false;
                }

                const target = isInternalLink(link.href) ? null : '_blank';
                const mark = this.type.create({ href: link.href, target });
                const tr = view.state.tr.replaceSelectionWith(view.state.schema.text(text, [mark]), false);
                view.dispatch(tr.scrollIntoView());
                return true;
              },
            },
          }),
        ];
      },
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
    CustomExtension.markdownPasteExtension,
    CustomExtension.codeBlockExtension(CodeBlockComponent),
    CustomExtension.codeBlockNavExtension(),
    CustomExtension.tableExtension(),
    CustomExtension.tableRowExtension(),
    CustomExtension.tableHeaderExtension(),
    CustomExtension.tableCellExtension(),

    Focus.configure({ className: 'has-focus', mode: 'deepest' }),
    TaskList,
    TaskItem.configure({ nested: true, HTMLAttributes: { class: 'custom-task-item' } }),
    CustomExtension.CustomTab,
  ] as unknown as Extensions;

  return extensions;
}
