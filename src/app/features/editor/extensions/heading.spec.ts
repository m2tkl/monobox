import StarterKit from '@tiptap/starter-kit';
import { Editor as VueEditor } from '@tiptap/vue-3';
import { Fragment, Slice } from 'prosemirror-model';
import { describe, it, expect } from 'vitest';

import { foldHeadingSectionsPluginKey, headingExtension, removeHeadingIdOnPastePlugin } from './heading';

describe('editor/extensions/heading - removeHeadingIdOnPastePlugin', () => {
  const createEditor = () =>
    new VueEditor({
      extensions: [StarterKit.configure({ heading: false }), headingExtension()],
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x' }] }] },
    });

  function clickHeadingFoldControl(editor: VueEditor, id: string) {
    const heading = editor.view.dom.querySelector<HTMLElement>(`[id="${id}"]`);
    expect(heading).not.toBeNull();
    heading!.getBoundingClientRect = () => ({
      x: 100,
      y: 40,
      width: 200,
      height: 24,
      top: 40,
      right: 300,
      bottom: 64,
      left: 100,
      toJSON: () => ({}),
    });
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      button: 0,
      clientX: 88,
      clientY: 49,
    });
    Object.defineProperty(event, 'target', { value: heading });
    editor.view.someProp('handleDOMEvents', handlers => handlers.click?.(editor.view, event));
  }

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

  it('does not persist collapsed state on pasted heading nodes', () => {
    const editor = createEditor();
    const { schema } = editor;

    const heading = schema.nodes.heading.create(
      { id: 'abc', level: 2 },
      schema.text('Title'),
    );
    const slice = new Slice(Fragment.fromArray([heading]), 0, 0);

    const transform = removeHeadingIdOnPastePlugin.props.transformPasted;
    const out = transform!.call(removeHeadingIdOnPastePlugin, slice, editor.view);

    const outNode = out.content.child(0);
    expect(outNode.attrs.id).toBeNull();
    expect(outNode.attrs.collapsed).toBeUndefined();

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

    clickHeadingFoldControl(editor, 'a');

    expect(foldHeadingSectionsPluginKey.getState(editor.state)?.has('a')).toBe(true);
    expect(JSON.stringify(editor.getJSON())).not.toContain('collapsed');
    expect(editor.view.dom.querySelectorAll('.heading-collapsed-hidden')).toHaveLength(3);
    expect(editor.view.dom.querySelector('[id="c"]')?.classList.contains('heading-collapsed-hidden')).toBe(false);

    clickHeadingFoldControl(editor, 'a');

    expect(foldHeadingSectionsPluginKey.getState(editor.state)?.has('a')).toBe(false);
    expect(editor.view.dom.querySelectorAll('.heading-collapsed-hidden')).toHaveLength(0);

    editor.destroy();
  });

  it('draws the fold control without inserting a widget into heading text positions', () => {
    const editor = new VueEditor({
      extensions: [StarterKit.configure({ heading: false }), headingExtension()],
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1, id: 'a' }, content: [{ type: 'text', text: 'A' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'A body' }] },
        ],
      },
    });

    const decorationSet = editor.view.someProp('decorations', decorations => decorations(editor.state));
    const foldableHeadingDecoration = decorationSet
      ?.find(0, 3)
      .find(decoration => decoration.from === 0 && decoration.to === 3);

    expect(foldableHeadingDecoration?.from).toBe(0);
    expect(foldableHeadingDecoration?.to).toBe(3);
    expect(editor.view.dom.querySelector('.custom-heading-fold-button')).toBeNull();
    expect(editor.view.dom.querySelector('[id="a"]')?.classList.contains('custom-heading-foldable')).toBe(true);

    editor.destroy();
  });

  it('restores folded headings from frontend state without persisting them to JSON', () => {
    const storageKey = `heading-spec-${crypto.randomUUID()}`;
    const content = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1, id: 'a' }, content: [{ type: 'text', text: 'A' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'A body' }] },
      ],
    };
    const createPersistentEditor = () => new VueEditor({
      extensions: [
        StarterKit.configure({ heading: false }),
        headingExtension({ getFoldStorageKey: () => storageKey }),
      ],
      content,
    });

    const firstEditor = createPersistentEditor();
    clickHeadingFoldControl(firstEditor, 'a');

    expect(foldHeadingSectionsPluginKey.getState(firstEditor.state)?.has('a')).toBe(true);
    expect(JSON.stringify(firstEditor.getJSON())).not.toContain('collapsed');
    firstEditor.destroy();

    const secondEditor = createPersistentEditor();

    expect(foldHeadingSectionsPluginKey.getState(secondEditor.state)?.has('a')).toBe(true);
    expect(secondEditor.view.dom.querySelectorAll('.heading-collapsed-hidden')).toHaveLength(1);
    expect(JSON.stringify(secondEditor.getJSON())).not.toContain('collapsed');

    secondEditor.destroy();
  });

  it('expands a collapsed heading without inserting a new block when pressing Enter from the heading', () => {
    const editor = new VueEditor({
      extensions: [StarterKit.configure({ heading: false }), headingExtension()],
      content: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1, id: 'a' },
            content: [{ type: 'text', text: 'A' }],
          },
          { type: 'paragraph', content: [{ type: 'text', text: 'A body' }] },
        ],
      },
    });

    editor.view.dispatch(
      editor.state.tr.setMeta(foldHeadingSectionsPluginKey, {
        type: 'toggle',
        key: 'a',
      }),
    );
    editor.commands.setTextSelection(2);
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    const handled = editor.view.someProp('handleKeyDown', handler => handler(editor.view, event));

    expect(handled).toBe(true);
    expect(event.defaultPrevented).toBe(true);
    expect(foldHeadingSectionsPluginKey.getState(editor.state)?.has('a')).toBe(false);
    expect(editor.state.doc.childCount).toBe(2);
    expect(JSON.stringify(editor.getJSON())).not.toContain('collapsed');
    expect(editor.view.dom.querySelectorAll('.heading-collapsed-hidden')).toHaveLength(0);

    editor.destroy();
  });
});
