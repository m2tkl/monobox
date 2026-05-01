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
  insertTable: vi.fn(),
  insertTableRowBefore: vi.fn(),
  insertTableRowAfter: vi.fn(),
  insertTableColumnBefore: vi.fn(),
  insertTableColumnAfter: vi.fn(),
  selectTableRow: vi.fn(),
  selectTableColumn: vi.fn(),
  deleteTableRow: vi.fn(),
  deleteTableColumn: vi.fn(),
  deleteEditorTable: vi.fn(),
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
    dispatchEditorMsg(editor, { type: 'insertTable' });
    dispatchEditorMsg(editor, { type: 'insertTableRowBefore' });
    dispatchEditorMsg(editor, { type: 'insertTableRowAfter' });
    dispatchEditorMsg(editor, { type: 'insertTableColumnBefore' });
    dispatchEditorMsg(editor, { type: 'insertTableColumnAfter' });
    dispatchEditorMsg(editor, { type: 'selectTableRow' });
    dispatchEditorMsg(editor, { type: 'selectTableColumn' });
    dispatchEditorMsg(editor, { type: 'deleteTableRow' });
    dispatchEditorMsg(editor, { type: 'deleteTableColumn' });
    dispatchEditorMsg(editor, { type: 'deleteTable' });
    dispatchEditorMsg(editor, { type: 'setLink', href: '/foo' });

    expect(Action.toggleBulletList).toHaveBeenCalledWith(editor);
    expect(Action.insertTable).toHaveBeenCalledWith(editor);
    expect(Action.insertTableRowBefore).toHaveBeenCalledWith(editor);
    expect(Action.insertTableRowAfter).toHaveBeenCalledWith(editor);
    expect(Action.insertTableColumnBefore).toHaveBeenCalledWith(editor);
    expect(Action.insertTableColumnAfter).toHaveBeenCalledWith(editor);
    expect(Action.selectTableRow).toHaveBeenCalledWith(editor);
    expect(Action.selectTableColumn).toHaveBeenCalledWith(editor);
    expect(Action.deleteTableRow).toHaveBeenCalledWith(editor);
    expect(Action.deleteTableColumn).toHaveBeenCalledWith(editor);
    expect(Action.deleteEditorTable).toHaveBeenCalledWith(editor);
    expect(Action.setLink).toHaveBeenCalledWith(editor, '/foo');
  });
});
