/**
 * Utility functions to detect modifier key states from mouse and keyboard events.
 */

/**
 * Flag to determine if the current platform is macOS.
 */
const isMac
  = typeof navigator !== 'undefined'
    && navigator.userAgent.toUpperCase().includes('MAC OS X');

/**
 * Determines whether any modifier key (Shift, Ctrl, Alt, or Meta/Cmd) is pressed during a mouse event.
 *
 * @param event - The MouseEvent object.
 * @returns `true` if any modifier key is pressed; otherwise, `false`.
 */
export const isModifierKeyPressed = (event: MouseEvent) => {
  return event.shiftKey || event.ctrlKey || event.altKey || event.metaKey;
};

/**
 * Determines whether the OS-specific "command key" is pressed during a keyboard event.
 *
 * On macOS, this checks for the Meta (Cmd) key.
 * On other platforms, this checks for the Ctrl key.
 *
 * @param event - The KeyboardEvent object.
 * @returns `true` if the OS-specific command key is pressed; otherwise, `false`.
 */
export const isCmdKey = (event: KeyboardEvent) => isMac ? event.metaKey : event.ctrlKey;
