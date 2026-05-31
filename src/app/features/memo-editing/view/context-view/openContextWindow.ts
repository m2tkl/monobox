import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

type OpenContextWindowInput = {
  path: string;
  title: string;
};

export function openContextWindow(input: OpenContextWindowInput) {
  const label = `context-${Date.now()}`;

  return new WebviewWindow(label, {
    url: input.path,
    title: input.title,
    width: 760,
    height: 900,
    minWidth: 420,
    minHeight: 520,
    decorations: false,
    dragDropEnabled: false,
  });
}
