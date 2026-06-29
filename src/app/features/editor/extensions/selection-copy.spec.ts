import { Editor } from '@tiptap/core';
import { describe, expect, it, vi } from 'vitest';

import { serializeSelectionToMarkdown, type SelectionCopyFormat } from './selection-copy';
import { buildExtensions } from '../index';

function createEditor(format: () => SelectionCopyFormat = () => 'html') {
  return new Editor({
    extensions: buildExtensions({
      CodeBlockComponent: {} as never,
      getSelectionCopyFormat: format,
    }),
    content: `
      <h2>Heading</h2>
      <p><strong>Hello</strong> world</p>
    `,
  });
}

function createCopyEvent() {
  const data = new Map<string, string>();

  return {
    clipboardData: {
      clearData: vi.fn(() => data.clear()),
      setData: vi.fn((type: string, value: string) => data.set(type, value)),
      getData: (type: string) => data.get(type) ?? '',
    },
    preventDefault: vi.fn(),
  } as unknown as ClipboardEvent & {
    clipboardData: DataTransfer & {
      clearData: ReturnType<typeof vi.fn>;
      setData: ReturnType<typeof vi.fn>;
      getData: (type: string) => string;
    };
    preventDefault: ReturnType<typeof vi.fn>;
  };
}

describe('editor/extensions/selection-copy', () => {
  it('serializes the current selection to markdown', () => {
    const editor = createEditor();

    editor.commands.setTextSelection({ from: 1, to: editor.state.doc.content.size });

    expect(serializeSelectionToMarkdown(editor.state)).toBe('### Heading\n\n**Hello** world');
  });

  it('writes markdown to clipboard data when markdown copy is enabled', () => {
    const editor = createEditor(() => 'markdown');
    const event = createCopyEvent();

    editor.commands.setTextSelection({ from: 1, to: editor.state.doc.content.size });
    const handled = editor.view.someProp('handleDOMEvents', handlers => handlers.copy?.(editor.view, event));

    expect(handled).toBe(true);
    expect(event.clipboardData.getData('text/plain')).toBe('### Heading\n\n**Hello** world');
    expect(event.clipboardData.setData).toHaveBeenCalledWith('text/plain', '### Heading\n\n**Hello** world');
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('leaves default copy handling active when html copy is enabled', () => {
    const editor = createEditor(() => 'html');
    const event = createCopyEvent();

    editor.commands.setTextSelection({ from: 1, to: editor.state.doc.content.size });
    const handled = editor.view.someProp('handleDOMEvents', handlers => handlers.copy?.(editor.view, event));

    expect(handled).toBeUndefined();
    expect(event.clipboardData.setData).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});
