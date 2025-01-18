const isMac = window?.navigator.userAgent.toUpperCase().indexOf('MAC OS X') >= 0;
export const isCmdKey = (event: KeyboardEvent) => isMac ? event.metaKey : event.ctrlKey;
