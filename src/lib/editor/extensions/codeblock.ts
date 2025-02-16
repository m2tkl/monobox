import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { type NodeViewProps, VueNodeViewRenderer } from '@tiptap/vue-3';
import xml from 'highlight.js/lib/languages/xml';
import { all, createLowlight } from 'lowlight';

const lowlight = createLowlight(all);
lowlight.register('html', xml);
lowlight.register('vue', xml);

export const codeBlockExtension = (node: Component<NodeViewProps>) => CodeBlockLowlight.extend({
  addNodeView() {
    return VueNodeViewRenderer(node);
  },
  addAttributes() {
    return {
      ...this.parent?.(),
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
