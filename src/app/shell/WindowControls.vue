<template>
  <div
    v-if="showControls"
    :class="[
      'window-controls',
      { macos: isMacOS, windows: !isMacOS },
    ]"
    :style="isMacOS ? { order: -1 } : { order: 1 }"
  >
    <!-- macOS style controls (left side) -->
    <template v-if="isMacOS">
      <button
        class="control-button close-button macos-close"
        @click="closeWindow"
      >
        <div class="control-icon">
          ×
        </div>
      </button>
      <button
        class="control-button minimize-button macos-minimize"
        @click="minimizeWindow"
      >
        <div class="control-icon">
          −
        </div>
      </button>
      <button
        class="control-button maximize-button macos-maximize"
        @click="toggleMaximize"
      >
        <div class="control-icon">
          ⤢
        </div>
      </button>
    </template>

    <!-- Windows style controls (right side) -->
    <template v-else>
      <button
        class="control-button minimize-button windows-minimize"
        @click="minimizeWindow"
      >
        <div class="control-icon">
          −
        </div>
      </button>
      <button
        class="control-button maximize-button windows-maximize"
        @click="toggleMaximize"
      >
        <div class="control-icon">
          ⧉
        </div>
      </button>
      <button
        class="control-button close-button windows-close"
        @click="closeWindow"
      >
        <div class="control-icon">
          ×
        </div>
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { getCurrentWindow } from '@tauri-apps/api/window';
import { platform } from '@tauri-apps/plugin-os';
import { ref, onMounted } from 'vue';

const appWindow = getCurrentWindow();
const isMacOS = ref(false);
const showControls = ref(true);

onMounted(async () => {
  // Detect platform
  try {
    const platformName = platform();
    isMacOS.value = platformName === 'macos';
  }
  catch (error) {
    console.warn('Failed to get platform info:', error);
    // Fallback to user agent detection
    isMacOS.value = navigator.userAgent.includes('Mac');
  }
});

const closeWindow = async () => {
  try {
    await appWindow.close();
  }
  catch (error) {
    console.error('Failed to close window:', error);
  }
};

const minimizeWindow = async () => {
  try {
    await appWindow.minimize();
  }
  catch (error) {
    console.error('Failed to minimize window:', error);
  }
};

const toggleMaximize = async () => {
  try {
    const isFullScreen = await appWindow.isFullscreen();
    await appWindow.setFullscreen(!isFullScreen);
  }
  catch (error) {
    console.error('Failed to toggle maximize:', error);
  }
};
</script>

<style scoped>
.window-controls {
  display: flex;
  align-items: center;
  gap: 0;
  height: 100%;
  user-select: none;
  -webkit-app-region: no-drag;
}

.window-controls.macos {
  gap: 8px;
}

.window-controls.windows {
  gap: 0;
}

.control-button {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 12px;
  font-weight: 400;
}

/* macOS style buttons */
.window-controls.macos {
  padding-left: 16px;
}

.window-controls.macos .control-button {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  position: relative;
}

.window-controls.macos .control-button .control-icon {
  opacity: 0;
  transition: opacity 0.2s ease;
  font-size: 9px;
  line-height: 1;
  color: rgba(0, 0, 0, 0.7);
}

.window-controls.macos:hover .control-button .control-icon {
  opacity: 1;
}

.macos-close {
  background-color: #ff5f57;
}

.macos-close:hover {
  background-color: #ff4741;
}

.macos-minimize {
  background-color: #ffbd2e;
}

.macos-minimize:hover {
  background-color: #ffaa00;
}

.macos-maximize {
  background-color: #28ca42;
}

.macos-maximize:hover {
  background-color: #1eb534;
}

/* Windows style buttons */
.window-controls.windows .control-button {
  width: 46px;
  height: 100%;
  color: var(--color-text-muted);
}

.window-controls.windows .control-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.window-controls.windows .control-button .control-icon {
  font-size: 16px;
  line-height: 1;
}

.windows-close:hover {
  background-color: #e81123 !important;
  color: white;
}

/* Dark theme adjustments */
@media (prefers-color-scheme: dark) {
  .window-controls.macos .control-button .control-icon {
    color: rgba(255, 255, 255, 0.8);
  }

  .window-controls.windows .control-button:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
}
</style>
