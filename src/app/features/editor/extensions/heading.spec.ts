import StarterKit from '@tiptap/starter-kit';
import { Editor as VueEditor } from '@tiptap/vue-3';
import { Fragment, Slice } from 'prosemirror-model';
import { describe, it, expect } from 'vitest';

import { headingExtension, removeHeadingIdOnPastePlugin } from './heading';

describe('editor/extensions/heading - removeHeadingIdOnPastePlugin', () => {
  const createEditor = () =>
    new VueEditor({
      extensions: [StarterKit.configure({ heading: false }), headingExtension()],
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x' }] }] },
    });

  it('removes id attribute from pasted heading nodes', () => {
    const editor = createEditor();
    const { schema } = editor;

    const heading = schema.nodes.heading.create(
      { id: 'abc', level: 2 },
      schema.text('Title'),
    );
    const slice = new Slice(Fragment.fromArray([heading]), 0, 0);

    const transform = removeHeadingIdOnPastePlugin.props.transformPasted;
    expect(typeof transform).toBe('function');
    const out = transform!(slice);

    const outNode = out.content.child(0);
    expect(outNode.type.name).toBe('heading');
    expect(outNode.attrs.id).toBeNull();

    editor.destroy();
  });

  it('removes id in nested structures (e.g., blockquote -> heading)', () => {
    const editor = createEditor();
    const { schema } = editor;

    const heading = schema.nodes.heading.create(
      { id: 'xyz', level: 3 },
      schema.text('Nested'),
    );
    const blockquote = schema.nodes.blockquote.create(null, Fragment.fromArray([heading]));
    const slice = new Slice(Fragment.fromArray([blockquote]), 0, 0);

    const transform = removeHeadingIdOnPastePlugin.props.transformPasted;
    const out = transform!(slice);

    const outBQ = out.content.child(0);
    const child = outBQ.firstChild;
    expect(outBQ.type.name).toBe('blockquote');
    expect(child?.type.name).toBe('heading');
    expect(child?.attrs.id).toBeNull();

    editor.destroy();
  });
});
