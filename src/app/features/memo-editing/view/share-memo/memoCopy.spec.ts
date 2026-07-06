import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useMemoCopy } from './memoCopy';

import type { JSONContent } from '@tiptap/vue-3';

const mocks = vi.hoisted(() => ({
  dialogSave: vi.fn(),
  writeHtml: vi.fn(),
  writeText: vi.fn(),
  saveMarkdown: vi.fn(),
  saveMarkdownAsset: vi.fn(),
  getSelectedNode: vi.fn(),
  convertEditorJsonToHtml: vi.fn(),
  convertToMarkdown: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  save: mocks.dialogSave,
}));

vi.mock('~/external/tauri/clipboard', () => ({
  writeHtml: mocks.writeHtml,
  writeText: mocks.writeText,
}));

vi.mock('~/external/tauri/command', () => ({
  command: {
    asset: {
      readImageAsDataUrl: vi.fn(),
    },
    textExport: {
      saveMarkdown: mocks.saveMarkdown,
      saveMarkdownAsset: mocks.saveMarkdownAsset,
    },
  },
}));

vi.mock('~/app/features/editor', () => ({
  EditorQuery: {
    getSelectedNode: mocks.getSelectedNode,
  },
  convertEditorJsonToHtml: mocks.convertEditorJsonToHtml,
  convertToMarkdown: mocks.convertToMarkdown,
}));

describe('memoCopy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('useConsoleLogger', () => ({
      error: vi.fn(),
    }));
  });

  const setupSelectedText = () => {
    const selectedJson: JSONContent = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Selection' }] },
      ],
    };
    const selectedNode = {
      toJSON: () => selectedJson,
    };
    const editor = {
      schema: {
        nodeFromJSON: vi.fn((json: JSONContent) => json),
      },
    };
    mocks.getSelectedNode.mockReturnValue(selectedNode);

    return { editor, selectedJson };
  };

  it('copies selected markdown to the clipboard without opening the markdown export dialog', async () => {
    const { editor } = setupSelectedText();
    mocks.convertToMarkdown.mockReturnValue('Selection');

    const result = await useMemoCopy().copySelectedTextAsMarkdown(editor as never);

    expect(result).toEqual({ ok: true, data: undefined });
    expect(mocks.dialogSave).not.toHaveBeenCalled();
    expect(mocks.saveMarkdown).not.toHaveBeenCalled();
    expect(mocks.writeText).toHaveBeenCalledWith('Selection');
  });

  it('copies selected HTML to the clipboard', async () => {
    const { editor, selectedJson } = setupSelectedText();
    mocks.convertEditorJsonToHtml.mockReturnValue('<p>Selection</p>');

    const result = await useMemoCopy().copySelectedTextAsHtml(editor as never);

    expect(result).toEqual({ ok: true, data: undefined });
    expect(mocks.convertEditorJsonToHtml).toHaveBeenCalledWith(selectedJson);
    expect(mocks.writeHtml).toHaveBeenCalledWith('<p>Selection</p>');
  });

  it('copies selected text using the requested format', async () => {
    const { editor } = setupSelectedText();
    mocks.convertToMarkdown.mockReturnValue('Selection');
    mocks.convertEditorJsonToHtml.mockReturnValue('<p>Selection</p>');

    await useMemoCopy().copySelectedText(editor as never, 'markdown');
    await useMemoCopy().copySelectedText(editor as never, 'html');

    expect(mocks.writeText).toHaveBeenCalledWith('Selection');
    expect(mocks.writeHtml).toHaveBeenCalledWith('<p>Selection</p>');
  });

  it('copies heading links with the same page hash intact', async () => {
    const result = await useMemoCopy().copyLinkToHeading('/workspace/alpha#section', '/workspace/alpha#Section');

    expect(result).toEqual({ ok: true, data: undefined });
    expect(mocks.writeHtml).toHaveBeenCalledWith('<a href="/workspace/alpha#section">/workspace/alpha#Section</a>');
  });
});
