<template>
  <UModal
    v-model:open="state.open"
    fullscreen
  >
    <template #content>
      <UCard
        class="h-full w-full flex flex-col"
        :ui="{
          header: 'shrink-0',
          body: 'flex-1 min-h-0 sm:p-0 p-0 overflow-hidden',
          footer: 'shrink-0',
        }"
      >
        <template #header>
          <header class="flex flex-wrap items-center justify-between gap-3">
            <!-- Dummy element for initial focus to prevent showing tooltip unexpectedly -->
            <div
              ref="initialFocusEl"
              tabindex="-1"
            />
            <p
              v-if="state.alt"
              class="max-w-full flex-1 truncate text-sm text-[var(--color-gray-666)]"
            >
              {{ state.alt }}
            </p>

            <div class="ml-auto flex items-center gap-1">
              <UTooltip text="Zoom out">
                <UButton
                  :icon="iconKey.zoomOut"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  :disabled="!canZoomOut"
                  @click="zoomOut"
                />
              </UTooltip>
              <UTooltip text="Zoom in">
                <UButton
                  :icon="iconKey.zoomIn"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  :disabled="!canZoomIn"
                  @click="zoomIn"
                />
              </UTooltip>
              <UTooltip text="Reset">
                <UButton
                  :icon="iconKey.zoomReset"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  :disabled="zoom === 1"
                  @click="resetZoom"
                />
              </UTooltip>
              <UButton
                :icon="iconKey.close"
                variant="ghost"
                color="neutral"
                size="sm"
                @click="state.open = false"
              />
            </div>
          </header>
        </template>

        <div
          ref="imageContainer"
          :class="[
            'h-full w-full overflow-hidden bg-[var(--color-surface-elevated)]',
            isPanning ? 'cursor-grabbing' : 'cursor-grab',
          ]"
          @wheel="handleWheel"
          @pointerdown="onPointerDown"
        >
          <img
            v-if="state.src"
            ref="imgEl"
            :src="state.src"
            :alt="state.alt"
            class="block select-none max-w-none max-h-none"
            draggable="false"
            :style="transformImageStyle"
            @load="onImageLoad"
          >
        </div>

        <template #footer>
          <div class="flex items-center h-8">
            <USlider
              v-model="currentZoomPercent"
              color="neutral"
              size="sm"
              :max="500"
              :min="50"
            />
            <span class="w-12 text-right text-xs text-[var(--color-gray-666)]">
              {{ currentZoomPercent }} %
            </span>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useImagePanZoom } from './useImagePanZoom';
import { useImagePreview } from './useImagePreview';

import { iconKey } from '~/utils/icon';

const { state } = useImagePreview();
const initialFocusEl = ref<HTMLDivElement | null>(null);

const {
  zoom,
  currentZoomPercent,
  canZoomIn,
  canZoomOut,
  imageContainer,
  imgEl,
  isPanning,
  transformImageStyle,
  zoomIn,
  zoomOut,
  resetZoom,
  handleWheel,
  onPointerDown,
  onImageLoad,
} = useImagePanZoom({
  state,
  initialFocusEl,
});
</script>
