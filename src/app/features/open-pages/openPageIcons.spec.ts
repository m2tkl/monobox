import { describe, expect, it } from 'vitest';

import { getOpenPageIcon } from './openPageIcons';

import { iconKey } from '~/utils/icon';

describe('getOpenPageIcon', () => {
  it.each([
    ['/_new-tab', iconKey.add],
    ['/_focus', iconKey.focus],
    ['/_bookmarks', iconKey.bookmark],
    ['/_kanban', iconKey.kanban],
    ['/_search', iconKey.fullSearch],
    ['/_inbox', iconKey.inbox],
    ['/_files', iconKey.folder],
    ['/_files/file-id', iconKey.documentAttachment],
    ['/_calendar', iconKey.calendar],
    ['/_future-tool', iconKey.pageLink],
  ])('returns the tool icon for %s', (routePath, icon) => {
    expect(getOpenPageIcon({ memoSlug: null, routePath })).toBe(icon);
  });

  it('does not decorate a regular memo tab', () => {
    expect(getOpenPageIcon({ memoSlug: 'memo', routePath: undefined })).toBeUndefined();
  });
});
