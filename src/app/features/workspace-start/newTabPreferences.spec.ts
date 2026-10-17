import { describe, expect, it } from 'vitest';

import {
  getDefaultNewTabSectionKeys,
  parseNewTabSectionKeys,
} from './newTabPreferences';

describe('new-tab section preferences', () => {
  it('defaults to Focus, Inbox, Waiting, and Recent when those statuses exist', () => {
    expect(getDefaultNewTabSectionKeys([
      { id: 1, name: '📥 Inbox' },
      { id: 2, name: '🎯 Now' },
      { id: 3, name: '🤚 Waiting' },
    ])).toEqual(['focus', 'status:1', 'status:3', 'recent']);
  });

  it('ignores invalid persisted values and removes duplicates', () => {
    expect(parseNewTabSectionKeys('["focus","status:4","focus","bad"]'))
      .toEqual(['focus', 'status:4']);
    expect(parseNewTabSectionKeys('{"focus":true}')).toBeNull();
  });
});
