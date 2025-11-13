import { textblockTypeInputRule } from '@tiptap/core';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { type NodeViewProps, VueNodeViewRenderer } from '@tiptap/vue-3';
import { createLowlight } from 'lowlight';

// Load all pre-bundled languages from lowlight to ensure broad highlighting support
// without requiring highlight.js as a dependency.
const lowlight = createLowlight();

export const codeBlockExtension = (node: Component<NodeViewProps>) => CodeBlockLowlight.extend({
  addNodeView() {
    return VueNodeViewRenderer(node);
  },
  // NOTE: Do NOT add plugins here; separate navigation extension handles arrows.
  addInputRules() {
    const parent = this.parent?.() ?? [];
    const fenceWithLang = /^```([a-zA-Z0-9_+-]+)?\s$/;
    const tildeWithLang = /^~~~([a-zA-Z0-9_+-]+)?\s$/;
    return [
      ...parent,
      textblockTypeInputRule({
        find: fenceWithLang,
        type: this.type,
        getAttributes: match => ({ language: (match as RegExpMatchArray)[1] || '' }),
      }),
      textblockTypeInputRule({
        find: tildeWithLang,
        type: this.type,
        getAttributes: match => ({ language: (match as RegExpMatchArray)[1] || '' }),
      }),
    ];
  },
  addAttributes() {
    return {
      ...this.parent?.(),
      // Internal attribute to force re-render when dynamically loading languages
      refresh: {
        default: 0,
        parseHTML: () => 0,
        renderHTML: () => ({}),
      },
      name: {
        default: '',
        parseHTML: element => element.getAttribute('name'),
        renderHTML: (attributes) => {
          return {
            name: attributes.name,
          };
        },
      },
    };
  },
}).configure({ lowlight });
