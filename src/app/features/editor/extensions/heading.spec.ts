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
    const out = transform!.call(removeHeadingIdOnPastePlugin, slice, editor.view);

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
    const out = transform!.call(removeHeadingIdOnPastePlugin, slice, editor.view);

    const outBQ = out.content.child(0);
    const child = outBQ.firstChild;
    expect(outBQ.type.name).toBe('blockquote');
    expect(child?.type.name).toBe('heading');
    expect(child?.attrs.id).toBeNull();

    editor.destroy();
  });

  it('resets collapsed state from pasted heading nodes', () => {
    const editor = createEditor();
    const { schema } = editor;

    const heading = schema.nodes.heading.create(
      { id: 'abc', level: 2, collapsed: true },
      schema.text('Title'),
    );
    const slice = new Slice(Fragment.fromArray([heading]), 0, 0);

    const transform = removeHeadingIdOnPastePlugin.props.transformPasted;
    const out = transform!.call(removeHeadingIdOnPastePlugin, slice, editor.view);

    const outNode = out.content.child(0);
    expect(outNode.attrs.id).toBeNull();
    expect(outNode.attrs.collapsed).toBe(false);

    editor.destroy();
  });

  it('toggles a heading section and hides content until the next peer heading', () => {
    const editor = new VueEditor({
      extensions: [StarterKit.configure({ heading: false }), headingExtension()],
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1, id: 'a' }, content: [{ type: 'text', text: 'A' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'A body' }] },
          { type: 'heading', attrs: { level: 2, id: 'b' }, content: [{ type: 'text', text: 'B' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'B body' }] },
          { type: 'heading', attrs: { level: 1, id: 'c' }, content: [{ type: 'text', text: 'C' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'C body' }] },
        ],
      },
    });

    const button = editor.view.dom.querySelector<HTMLButtonElement>('.custom-heading-fold-button');
    expect(button).not.toBeNull();
    button!.click();

    expect(editor.state.doc.child(0).attrs.collapsed).toBe(true);
    expect(editor.view.dom.querySelectorAll('.heading-collapsed-hidden')).toHaveLength(3);
    expect(editor.view.dom.querySelector('[id="c"]')?.classList.contains('heading-collapsed-hidden')).toBe(false);

    editor.view.dom.querySelector<HTMLButtonElement>('.custom-heading-fold-button')!.click();

    expect(editor.state.doc.child(0).attrs.collapsed).toBe(false);
    expect(editor.view.dom.querySelectorAll('.heading-collapsed-hidden')).toHaveLength(0);

    editor.destroy();
  });

  it('expands a collapsed heading without inserting a new block when pressing Enter from the heading', () => {
    const editor = new VueEditor({
      extensions: [StarterKit.configure({ heading: false }), headingExtension()],
      content: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1, id: 'a', collapsed: true },
            content: [{ type: 'text', text: 'A' }],
          },
          { type: 'paragraph', content: [{ type: 'text', text: 'A body' }] },
        ],
      },
    });

    editor.commands.setTextSelection(2);
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    const handled = editor.view.someProp('handleKeyDown', handler => handler(editor.view, event));

    expect(handled).toBe(true);
    expect(event.defaultPrevented).toBe(true);
    expect(editor.state.doc.child(0).attrs.collapsed).toBe(false);
    expect(editor.state.doc.childCount).toBe(2);
    expect(editor.view.dom.querySelectorAll('.heading-collapsed-hidden')).toHaveLength(0);

    editor.destroy();
  });
});
