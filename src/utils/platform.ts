/**
 * Flags to determine if the current platform
 */

export const isMac
  = typeof navigator !== 'undefined'
    && navigator.userAgent.toUpperCase().includes('MAC OS X');

export const isWindows
    = typeof navigator !== 'undefined'
      && navigator.userAgent.includes('Windows');
