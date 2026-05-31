import { isMac } from '~/utils/platform';

export type MemoLinkOpenIntent = 'navigate' | 'context-view' | 'context-window';

export const getMemoLinkOpenIntent = (event: MouseEvent): MemoLinkOpenIntent => {
  if (event.shiftKey) {
    return 'context-window';
  }

  if (isMac ? event.metaKey : event.ctrlKey) {
    return 'context-view';
  }

  return 'navigate';
};
