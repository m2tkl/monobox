import { describe, expect, it } from 'vitest';

import { getTabShortcutAction } from './tabShortcut';

function keydown(key: string, options: KeyboardEventInit) {
  return new KeyboardEvent('keydown', { key, ...options });
}

describe('tab shortcut mapping', () => {
  it('uses Command on macOS', () => {
    expect(getTabShortcutAction(keydown('t', { metaKey: true }), true)).toBe('new');
    expect(getTabShortcutAction(keydown('T', { metaKey: true, shiftKey: true }), true)).toBe('restore');
    expect(getTabShortcutAction(keydown('w', { metaKey: true }), true)).toBe('close');
    expect(getTabShortcutAction(keydown('t', { ctrlKey: true }), true)).toBeNull();
  });

  it('uses Ctrl on Windows and other non-macOS platforms', () => {
    expect(getTabShortcutAction(keydown('t', { ctrlKey: true }), false)).toBe('new');
    expect(getTabShortcutAction(keydown('T', { ctrlKey: true, shiftKey: true }), false)).toBe('restore');
    expect(getTabShortcutAction(keydown('w', { ctrlKey: true }), false)).toBe('close');
    expect(getTabShortcutAction(keydown('t', { metaKey: true }), false)).toBeNull();
  });

  it('keeps Ctrl+Tab navigation on both platforms and ignores other modifiers', () => {
    expect(getTabShortcutAction(keydown('Tab', { ctrlKey: true }), true)).toBe('next');
    expect(getTabShortcutAction(keydown('Tab', { ctrlKey: true, shiftKey: true }), false)).toBe('previous');
    expect(getTabShortcutAction(keydown('t', { ctrlKey: true, altKey: true }), false)).toBeNull();
    expect(getTabShortcutAction(keydown('w', { ctrlKey: true, shiftKey: true }), false)).toBeNull();
  });
});
