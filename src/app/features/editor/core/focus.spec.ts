import StarterKit from '@tiptap/starter-kit';
import { Editor as VueEditor } from '@tiptap/vue-3';
import { describe, it, expect } from 'vitest';

import { focusNodeById } from './focus';
import { foldHeadingSectionsPluginKey, headingExtension } from '../extensions/heading';

import type { Editor as CoreEditor } from '@tiptap/core';

describe('editor/core/focus', () => {
  it('focusNodeById moves the selection to the end of the node', () => {
    const editor = new VueEditor({
      extensions: [StarterKit.configure({ heading: false }), headingExtension()],
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1, id: 'h1' }, content: [{ type: 'text', text: 'Title' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Body' }] },
        ],
      },
    }) as unknown as CoreEditor;

    let pos: number | null = null;
    let nodeSize = 0;
    editor.state.doc.descendants((node, posIndex) => {
      if (node.attrs.id === 'h1') {
        pos = posIndex;
        nodeSize = node.nodeSize;
        return false;
      }
    });

    expect(pos).not.toBeNull();

    focusNodeById(editor, 'h1');

    const expectedPos = pos! + nodeSize - 1;
    expect(editor.state.selection.from).toBe(expectedPos);
    expect(editor.state.selection.to).toBe(expectedPos);
    editor.destroy();
  });

  it('focusNodeById keeps a visible collapsed target heading collapsed in view state', () => {
    const editor = new VueEditor({
      extensions: [StarterKit.configure({ heading: false }), headingExtension()],
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1, id: 'h1' }, content: [{ type: 'text', text: 'Title' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Body' }] },
        ],
      },
    }) as unknown as CoreEditor;

    editor.view.dispatch(
      editor.state.tr.setMeta(foldHeadingSectionsPluginKey, {
        type: 'toggle',
        key: 'h1',
      }),
    );
    focusNodeById(editor, 'h1');

    expect(foldHeadingSectionsPluginKey.getState(editor.state)?.has('h1')).toBe(true);
    expect(JSON.stringify(editor.getJSON())).not.toContain('collapsed');
    editor.destroy();
  });

  it('focusNodeById reveals collapsed ancestor headings that hide the target', () => {
    const editor = new VueEditor({
      extensions: [StarterKit.configure({ heading: false }), headingExtension()],
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1, id: 'h1' }, content: [{ type: 'text', text: 'Parent' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Parent body' }] },
          { type: 'heading', attrs: { level: 2, id: 'h2' }, content: [{ type: 'text', text: 'Child' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Child body' }] },
        ],
      },
    }) as unknown as CoreEditor;

    let pos: number | null = null;
    let nodeSize = 0;
    editor.state.doc.descendants((node, posIndex) => {
      if (node.attrs.id === 'h2') {
        pos = posIndex;
        nodeSize = node.nodeSize;
        return false;
      }
    });

    editor.view.dispatch(
      editor.state.tr.setMeta(foldHeadingSectionsPluginKey, {
        type: 'toggle',
        key: 'h1',
      }),
    );
    focusNodeById(editor, 'h2');

    expect(foldHeadingSectionsPluginKey.getState(editor.state)?.has('h1')).toBe(false);
    expect(JSON.stringify(editor.getJSON())).not.toContain('collapsed');
    expect(editor.state.selection.from).toBe(pos! + nodeSize - 1);
    editor.destroy();
  });
});
