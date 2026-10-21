import { computed, ref } from 'vue';

import type { useToast } from '#imports';

import { command } from '~/external/tauri/command';
import { iconKey } from '~/utils/icon';

export function useMcpSettings(toast: Pick<ReturnType<typeof useToast>, 'add'>) {
  const mcpServerInfo = ref<Awaited<ReturnType<typeof command.config.mcpServerInfo>> | null>(null);
  const mcpServerRestartRequired = ref(false);

  const mcpServerStatus = computed(() => {
    if (!mcpServerInfo.value) return 'Unavailable';
    if (mcpServerRestartRequired.value) return 'Pending restart';
    if (!mcpServerInfo.value.setup_complete) return 'Setup incomplete';
    if (!mcpServerInfo.value.enabled) return 'Disabled';
    return 'Running inside this app';
  });

  const loadMcpServerInfo = async () => {
    try {
      mcpServerInfo.value = await command.config.mcpServerInfo();
      mcpServerRestartRequired.value = false;
    }
    catch (error) {
      console.error(error);
      mcpServerInfo.value = null;
    }
  };

  const copyMcpServerUrl = async () => {
    if (!mcpServerInfo.value) return;

    try {
      await navigator.clipboard.writeText(mcpServerInfo.value.url);
      toast.add({
        title: 'Copied MCP URL.',
        duration: 1200,
        icon: iconKey.success,
      });
    }
    catch (error) {
      console.error(error);
      toast.add({
        title: 'Failed to copy MCP URL.',
        color: 'error',
        icon: iconKey.failed,
      });
    }
  };

  const regenerateMcpServerUrl = async () => {
    try {
      mcpServerInfo.value = await command.config.regenerateMcpServerToken();
      mcpServerRestartRequired.value = true;
      toast.add({
        title: 'Generated a new MCP URL.',
        description: 'Restart monobox, then update Codex to the new URL.',
        duration: 2500,
        icon: iconKey.success,
      });
    }
    catch (error) {
      console.error(error);
      toast.add({
        title: 'Failed to regenerate MCP URL.',
        color: 'error',
        icon: iconKey.failed,
      });
    }
  };

  return {
    mcpServerInfo,
    mcpServerRestartRequired,
    mcpServerStatus,
    loadMcpServerInfo,
    copyMcpServerUrl,
    regenerateMcpServerUrl,
  };
}
