import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { FOCUS_PAGE } from './openPages';
import { useOpenPagesStore } from './openPagesStore';

describe('closed tab restoration', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('restores the tab, its workspace order, and its independent history', () => {
    const store = useOpenPagesStore();
    const firstId = store.createTab('work');
    store.openInActiveTab('work', { memoSlug: 'first', title: 'First' });
    store.openInActiveTab('work', { memoSlug: 'second', title: 'Second' });
    store.goBack('work');
    const laterId = store.createTab('work');
    store.openInActiveTab('work', { memoSlug: 'later', title: 'Later' });
    store.activate('work', firstId);

    const closeResult = store.close('work', firstId);
    expect(closeResult?.fallbackTab?.id).toBe(laterId);
    expect(store.activeTabIds.work).toBe(laterId);
    expect(store.histories[firstId]).toBeUndefined();

    const restored = store.restoreLastClosed('work');
    expect(restored?.id).toBe(firstId);
    expect(restored?.memoSlug).toBe('first');
    expect(store.tabs.filter(tab => tab.workspaceSlug === 'work').map(tab => tab.id))
      .toEqual([firstId, laterId]);
    expect(store.activeTabIds.work).toBe(firstId);
    expect(store.goForward('work')?.memoSlug).toBe('second');
  });

  it('restores the most recently closed tab in the current workspace only', () => {
    const store = useOpenPagesStore();
    const firstId = store.createTab('first');
    const secondId = store.createTab('second');
    store.close('first', firstId);
    store.close('second', secondId);

    expect(store.restoreLastClosed('first')?.id).toBe(firstId);
    expect(store.activeTabIds.first).toBe(firstId);
    expect(store.restoreLastClosed('first')).toBeNull();
    expect(store.restoreLastClosed('second')?.id).toBe(secondId);
  });

  it('does not record an invalid close', () => {
    const store = useOpenPagesStore();
    store.createTab('work');

    expect(store.close('work', 'missing')).toBeNull();
    expect(store.closedTabs).toEqual([]);
  });

  it('closes and restores the only tab in a workspace', () => {
    const store = useOpenPagesStore();
    const tabId = store.createTab('work');

    expect(store.close('work', tabId)).toMatchObject({ wasActive: true, fallbackTab: null });
    expect(store.activeTabIds.work).toBeNull();
    expect(store.restoreLastClosed('work')?.id).toBe(tabId);
    expect(store.activeTabIds.work).toBe(tabId);
  });

  it('discards persisted fixed-view tabs without closing the memo tabs', () => {
    const store = useOpenPagesStore();
    const memoTabId = store.createTab('work');
    store.openInActiveTab('work', { memoSlug: 'memo', title: 'Memo' });

    const kanbanTabId = store.createTab('work', {
      memoSlug: null,
      routePath: '/_kanban',
      title: 'Kanban',
    });
    store.createTab('other', {
      memoSlug: null,
      routePath: '/_focus',
      title: 'Focus',
    });

    store.discardFixedWorkspaceViewTabs('work');

    expect(store.tabs.some(tab => tab.id === kanbanTabId)).toBe(false);
    expect(store.tabs.find(tab => tab.id === memoTabId)?.memoSlug).toBe('memo');
    expect(store.tabs.some(tab => tab.workspaceSlug === 'other' && tab.routePath === '/_focus')).toBe(true);
    expect(store.activeTabIds.work).toBe(memoTabId);
    expect(store.histories[kanbanTabId]).toBeUndefined();
  });

  it('activates an existing selected memo tab instead of creating a duplicate', () => {
    const store = useOpenPagesStore();
    const firstId = store.openOrActivatePageTab('work', {
      memoSlug: 'selected',
      title: 'Selected memo',
    });
    store.createTab('work');

    const reopenedId = store.openOrActivatePageTab('work', {
      memoSlug: 'selected',
      title: 'Selected memo',
    });

    expect(reopenedId).toBe(firstId);
    expect(store.activeTabIds.work).toBe(firstId);
    expect(store.tabs.filter(tab => tab.memoSlug === 'selected')).toHaveLength(1);
  });

  it('returns the fixed-view opener when its active child tab closes', () => {
    const store = useOpenPagesStore();
    const previousTabId = store.createTab('work', { memoSlug: 'previous', title: 'Previous' });
    const childTabId = store.openOrActivatePageTab('work', { memoSlug: 'child', title: 'Child' });
    store.setActiveTabOpener('work', childTabId, FOCUS_PAGE);

    const result = store.close('work', childTabId);

    expect(result).toMatchObject({
      wasActive: true,
      fallbackTab: { id: previousTabId },
      openerPage: FOCUS_PAGE,
    });
    expect(store.activeTabOpeners.work).toBeUndefined();
  });

  it('forgets the fixed-view opener after explicitly switching tabs', () => {
    const store = useOpenPagesStore();
    const previousTabId = store.createTab('work', { memoSlug: 'previous', title: 'Previous' });
    const childTabId = store.openOrActivatePageTab('work', { memoSlug: 'child', title: 'Child' });
    store.setActiveTabOpener('work', childTabId, FOCUS_PAGE);

    store.activate('work', previousTabId);
    store.activate('work', childTabId);
    const result = store.close('work', childTabId);

    expect(result?.openerPage).toBeNull();
  });

  it('reconciles a deleted memo out of tabs, histories, and restore candidates', () => {
    const store = useOpenPagesStore();
    const survivingTabId = store.createTab('work', { memoSlug: 'surviving', title: 'Surviving' });
    store.openInActiveTab('work', { memoSlug: 'deleted', title: 'Deleted in history' });
    store.goBack('work');
    const deletedTabId = store.createTab('work', { memoSlug: 'deleted', title: 'Deleted' });
    store.setActiveTabOpener('work', deletedTabId, FOCUS_PAGE);
    const closedDeletedTabId = store.createTab('work', { memoSlug: 'deleted', title: 'Closed deleted' });
    store.close('work', closedDeletedTabId);
    store.activate('work', deletedTabId);
    store.setActiveTabOpener('work', deletedTabId, FOCUS_PAGE);

    const result = store.reconcileDeletedMemo('work', 'deleted');

    expect(result).toMatchObject({
      wasActive: true,
      fallbackTab: { id: survivingTabId },
      openerPage: FOCUS_PAGE,
    });
    expect(store.tabs.some(tab => tab.id === deletedTabId)).toBe(false);
    expect(store.histories[survivingTabId]?.entries.map(page => page.memoSlug))
      .toEqual(['surviving']);
    expect(store.closedTabs.some(item => item.tab.memoSlug === 'deleted')).toBe(false);
    expect(store.activeTabOpeners.work).toBeUndefined();
  });
});
