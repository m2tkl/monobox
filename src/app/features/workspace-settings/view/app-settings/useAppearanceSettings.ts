import { computed, ref } from 'vue';

import type { useToast } from '#imports';
import type { AppConfigPayload } from '~/external/tauri/commands/config';

import { command } from '~/external/tauri/command';
import { iconKey } from '~/utils/icon';

export function useAppearanceSettings(toast: Pick<ReturnType<typeof useToast>, 'add'>) {
  const savedWindowOpacity = ref(1);
  const windowOpacity = ref(1);
  const isWindowOpacitySaving = ref(false);

  const windowOpacityPercent = computed(() => Math.round(windowOpacity.value * 100));

  const isWindowOpacityDirty = computed(() => (
    Math.abs(windowOpacity.value - savedWindowOpacity.value) > 0.001
  ));

  const applyWindowOpacity = (opacity: number) => {
    document.documentElement.style.setProperty('--app-window-opacity', String(opacity));
  };

  const saveWindowOpacity = async () => {
    try {
      isWindowOpacitySaving.value = true;
      const config = await command.config.setAppWindowOpacity(windowOpacity.value);
      savedWindowOpacity.value = config.app_window_opacity;
      windowOpacity.value = config.app_window_opacity;
      applyWindowOpacity(config.app_window_opacity);
      toast.add({
        title: 'Saved window opacity.',
        duration: 1200,
        icon: iconKey.success,
      });
    }
    catch (error) {
      console.error(error);
      toast.add({
        title: 'Failed to save window opacity.',
        color: 'error',
        icon: iconKey.failed,
      });
    }
    finally {
      isWindowOpacitySaving.value = false;
    }
  };

  const initialize = (config: Pick<AppConfigPayload, 'app_window_opacity'>) => {
    savedWindowOpacity.value = config.app_window_opacity;
    windowOpacity.value = config.app_window_opacity;
    applyWindowOpacity(config.app_window_opacity);
  };

  return {
    windowOpacity,
    isWindowOpacitySaving,
    windowOpacityPercent,
    isWindowOpacityDirty,
    applyWindowOpacity,
    saveWindowOpacity,
    initialize,
  };
}
