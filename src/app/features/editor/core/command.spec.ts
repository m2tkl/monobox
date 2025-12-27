import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as Action from './action';
import { createEditorDispatcher, dispatchEditorMsg } from './command';

import type { EditorCommandHandlerMap, EditorMsg } from './command';

vi.mock('./action', () => ({
  setLink: vi.fn(),
  toggleHeading: vi.fn(),
  toggleStyle: vi.fn(),
  toggleBulletList: vi.fn(),
  toggleOrderedList: vi.fn(),
  toggleBlockQuote: vi.fn(),
  toggleCode: vi.fn(),
  unsetLink: vi.fn(),
  resetStyle: vi.fn(),
}));

describe('editor/core/command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createEditorDispatcher routes a message to the matching handler', () => {
    const handlers = {
      toggleStyle: vi.fn(),
    } as unknown as EditorCommandHandlerMap;
    const dispatch = createEditorDispatcher(handlers);
    const editor = {} as unknown as Parameters<typeof dispatch>[0];

    const msg: EditorMsg = { type: 'toggleStyle', style: 'bold' };
    dispatch(editor, msg);

    expect(handlers.toggleStyle).toHaveBeenCalledTimes(1);
    expect(handlers.toggleStyle).toHaveBeenCalledWith(editor, msg);
  });

  it('dispatchEditorMsg uses default handlers', () => {
    const editor = {} as unknown as Parameters<typeof dispatchEditorMsg>[0];

    dispatchEditorMsg(editor, { type: 'toggleBulletList' });
    dispatchEditorMsg(editor, { type: 'setLink', href: '/foo' });

    expect(Action.toggleBulletList).toHaveBeenCalledWith(editor);
    expect(Action.setLink).toHaveBeenCalledWith(editor, '/foo');
  });
});
