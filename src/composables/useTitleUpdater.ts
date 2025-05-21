import { getCurrentWindow } from '@tauri-apps/api/window';
import { watch } from 'vue';

export function useTitleUpdater() {
  const store = useWorkspaceStore();
  const appWindow = getCurrentWindow();

  watch(() => store.workspace, async (workspace) => {
    await appWindow.setTitle(workspace?.name ?? 'monobox');
  });
}
