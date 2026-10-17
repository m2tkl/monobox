import type { TabPage } from './openPages';

import { iconKey } from '~/utils/icon';

const workspaceToolIcons: Record<string, string> = {
  '/_new-tab': iconKey.add,
  '/_focus': iconKey.focus,
  '/_bookmarks': iconKey.bookmark,
  '/_kanban': iconKey.kanban,
  '/_search': iconKey.fullSearch,
  '/_inbox': iconKey.inbox,
  '/_files': iconKey.folder,
  '/_calendar': iconKey.calendar,
};

export function getOpenPageIcon(page: Pick<TabPage, 'memoSlug' | 'routePath'>) {
  if (page.memoSlug || !page.routePath) return undefined;
  if (/^\/_files\/[^/]+$/.test(page.routePath)) return iconKey.documentAttachment;
  return workspaceToolIcons[page.routePath]
    ?? (page.routePath.startsWith('/_') ? iconKey.pageLink : undefined);
}
