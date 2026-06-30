import { describe, expect, it } from 'vitest';

import {
  buildShortcut,
  parseShortcut,
  shortcutKeyFromKeyboardEvent,
} from './shortcutBuilder';

describe('shortcutBuilder', () => {
  it('parses the saved accelerator string into editable parts', () => {
    expect(parseShortcut('CommandOrControl+Alt+Shift+M')).toEqual({
      modifier: true,
      alt: true,
      shift: true,
      key: 'M',
    });
  });

  it('builds the saved accelerator string in a stable modifier order', () => {
    expect(buildShortcut({
      modifier: true,
      alt: false,
      shift: true,
      key: 'n',
    })).toBe('CommandOrControl+Shift+N');
  });

  it('normalizes platform-specific modifier aliases to Modifier', () => {
    expect(parseShortcut('Ctrl+Option+Space')).toEqual({
      modifier: true,
      alt: true,
      shift: false,
      key: 'Space',
    });
  });

  it('records printable keys from keyboard events', () => {
    expect(shortcutKeyFromKeyboardEvent(new KeyboardEvent('keydown', { key: 'm' }))).toBe('M');
    expect(shortcutKeyFromKeyboardEvent(new KeyboardEvent('keydown', { key: 'F8' }))).toBe('F8');
  });

  it('ignores modifier-only keyboard events', () => {
    expect(shortcutKeyFromKeyboardEvent(new KeyboardEvent('keydown', { key: 'Shift' }))).toBeNull();
  });
});
