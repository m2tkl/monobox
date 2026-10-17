import { describe, expect, it } from 'vitest';

import {
  createTabHistory,
  createFileTabPage,
  currentHistoryPage,
  findActiveWorkspaceTab,
  findWorkspaceToolPage,
  getStandaloneWorkspaceViewUrl,
  isStandaloneWorkspaceView,
  moveTabHistory,
  pushTabHistory,
  reorderWorkspaceTabs,
  replaceTabPage,
  resetTabPage,
  type OpenTab,
} from './openPages';

const tab = (id: string, workspaceSlug = 'work'): OpenTab => ({
  id,
  workspaceSlug,
  memoSlug: id,
  hash: '#original',
  title: id,
  createdAt: 1,
});

describe('tab operations', () => {
  it('replaces the active tab page without changing tab order', () => {
    const result = replaceTabPage([tab('one'), tab('two')], 'one', {
      memoSlug: 'replacement',
      hash: '#details',
      title: 'Replacement',
    });

    expect(result.map(item => item.id)).toEqual(['one', 'two']);
    expect(result[0]).toEqual({
      ...tab('one'),
      memoSlug: 'replacement',
      routePath: '',
      hash: '#details',
      title: 'Replacement',
    });
  });

  it('stores a workspace tool page in a tab without treating it as a memo', () => {
    const result = replaceTabPage([tab('one'), tab('two')], 'one', {
      memoSlug: null,
      routePath: '/_files',
      title: 'Files',
    });

    expect(result.map(item => item.id)).toEqual(['one', 'two']);
    expect(result[0]).toMatchObject({
      memoSlug: null,
      routePath: '/_files',
      hash: '',
      title: 'Files',
    });
  });

  it('recognizes an individual file as a tab page', () => {
    expect(findWorkspaceToolPage('/_files/file%201')).toEqual({
      memoSlug: null,
      routePath: '/_files/file%201',
      title: 'File',
    });
  });

  it('builds a file tab location without treating the file as a memo', () => {
    expect(createFileTabPage('file / 1', 'Report.pdf')).toEqual({
      memoSlug: null,
      routePath: '/_files/file%20%2F%201',
      title: 'Report.pdf',
    });
  });

  it('reorders tabs only inside the selected workspace', () => {
    const result = reorderWorkspaceTabs([
      tab('one'),
      tab('other', 'another-workspace'),
      tab('two'),
      tab('three'),
    ], 'work', 'one', 'three', 'after');

    expect(result.map(item => item.id)).toEqual(['two', 'other', 'three', 'one']);
  });

  it('does nothing when a drag target is invalid', () => {
    const tabs = [tab('one'), tab('two')];
    expect(reorderWorkspaceTabs(tabs, 'work', 'one', 'missing', 'before')).toBe(tabs);
  });

  it('resets the active tab to New tab without changing its order', () => {
    const result = resetTabPage([tab('one'), tab('two')], 'one');

    expect(result.map(item => item.id)).toEqual(['one', 'two']);
    expect(result[0]).toEqual({
      ...tab('one'),
      memoSlug: null,
      routePath: '/_new-tab',
      hash: '',
      title: 'New tab',
    });
  });

  it('keeps navigation history independent for each tab', () => {
    const firstInitial = createTabHistory({ memoSlug: 'a', title: 'A' });
    const second = createTabHistory({ memoSlug: 'x', title: 'X' });
    const first = pushTabHistory(firstInitial, { memoSlug: 'b', title: 'B' });

    const firstAfterBack = moveTabHistory(first, -1);

    expect(currentHistoryPage(firstAfterBack)?.memoSlug).toBe('a');
    expect(currentHistoryPage(second)?.memoSlug).toBe('x');
  });

  it('discards only the active tab forward history after a new navigation', () => {
    let history = createTabHistory({ memoSlug: 'a', title: 'A' });
    history = pushTabHistory(history, { memoSlug: 'b', title: 'B' });
    history = pushTabHistory(history, { memoSlug: 'c', title: 'C' });
    history = moveTabHistory(history, -1);

    const result = pushTabHistory(history, { memoSlug: 'd', title: 'D' });

    expect(result.entries.map(page => page.memoSlug)).toEqual(['a', 'b', 'd']);
    expect(result.currentIndex).toBe(2);
  });

  it('updates the current page title without duplicating the history entry', () => {
    const history = createTabHistory({ memoSlug: 'a', hash: '#one', title: 'Loading' });

    const result = pushTabHistory(history, { memoSlug: 'a', hash: '#one', title: 'Resolved title' });

    expect(result.entries).toEqual([{
      memoSlug: 'a',
      routePath: '',
      hash: '#one',
      title: 'Resolved title',
    }]);
    expect(result.currentIndex).toBe(0);
  });

  it('resolves the title from the newly selected tab without waiting for navigation', () => {
    const tabs = [
      { ...tab('one'), title: 'First page' },
      { ...tab('two'), title: 'Second page' },
    ];

    expect(findActiveWorkspaceTab(tabs, { work: 'one' }, 'work')?.title).toBe('First page');
    expect(findActiveWorkspaceTab(tabs, { work: 'two' }, 'work')?.title).toBe('Second page');
  });

  it('recognizes workspace action destinations as standalone workspace views', () => {
    expect(isStandaloneWorkspaceView({
      path: '/work/_focus',
      query: {},
    }, 'work')).toBe(true);
    expect(isStandaloneWorkspaceView({
      path: '/work/_bookmarks',
      query: {},
    }, 'work')).toBe(true);
    expect(isStandaloneWorkspaceView({
      path: '/work/_kanban',
      query: {},
    }, 'work')).toBe(true);
    expect(isStandaloneWorkspaceView({
      path: '/work/_files',
      query: {},
    }, 'work')).toBe(true);
    expect(isStandaloneWorkspaceView({
      path: '/work/_calendar',
      query: {},
    }, 'work')).toBe(true);
    expect(isStandaloneWorkspaceView({
      path: '/work/memo',
      query: {},
    }, 'work')).toBe(false);
  });

  it('builds Chrome-style internal URLs for standalone workspace views', () => {
    expect(getStandaloneWorkspaceViewUrl({
      path: '/work/_focus',
      query: {},
    }, 'work')).toBe('monobox://focus');
    expect(getStandaloneWorkspaceViewUrl({
      path: '/work/_bookmarks',
      query: {},
    }, 'work')).toBe('monobox://bookmarks');
    expect(getStandaloneWorkspaceViewUrl({
      path: '/work/_kanban',
      query: {},
    }, 'work')).toBe('monobox://kanban');
    expect(getStandaloneWorkspaceViewUrl({
      path: '/work/_files',
      query: {},
    }, 'work')).toBe('monobox://files');
    expect(getStandaloneWorkspaceViewUrl({
      path: '/work/_calendar',
      query: {},
    }, 'work')).toBe('monobox://calendar');
    expect(getStandaloneWorkspaceViewUrl({
      path: '/work/memo',
      query: {},
    }, 'work')).toBeNull();
  });
});
