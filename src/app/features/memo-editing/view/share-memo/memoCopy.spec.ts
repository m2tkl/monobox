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
  convertToMarkdown: mocks.convertToMarkdown,
}));

describe('memoCopy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('useConsoleLogger', () => ({
      error: vi.fn(),
    }));
  });

  it('copies selected markdown to the clipboard without opening the markdown export dialog', async () => {
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
    mocks.convertToMarkdown.mockReturnValue('Selection');

    const result = await useMemoCopy().copySelectedTextAsMarkdown(editor as never);

    expect(result).toEqual({ ok: true, data: undefined });
    expect(mocks.dialogSave).not.toHaveBeenCalled();
    expect(mocks.saveMarkdown).not.toHaveBeenCalled();
    expect(mocks.writeText).toHaveBeenCalledWith('Selection');
  });

  it('copies heading links with the same page hash intact', async () => {
    const result = await useMemoCopy().copyLinkToHeading('/workspace/alpha#section', '/workspace/alpha#Section');

    expect(result).toEqual({ ok: true, data: undefined });
    expect(mocks.writeHtml).toHaveBeenCalledWith('<a href="/workspace/alpha#section">/workspace/alpha#Section</a>');
  });
});
