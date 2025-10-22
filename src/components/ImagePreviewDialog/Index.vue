<template>
  <UModal
    v-model:open="state.open"
    fullscreen
  >
    <template #content>
      <UCard
        class="h-full w-full"
      >
        <template #header>
          <header class="flex flex-wrap items-center justify-between gap-3">
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
                  size="xs"
                  :disabled="!canZoomOut"
                  @click="zoomOut"
                />
              </UTooltip>
              <UTooltip text="Zoom in">
                <UButton
                  :icon="iconKey.zoomIn"
                  variant="ghost"
                  size="xs"
                  :disabled="!canZoomIn"
                  @click="zoomIn"
                />
              </UTooltip>
              <UTooltip text="Reset">
                <UButton
                  :icon="iconKey.zoomReset"
                  variant="ghost"
                  size="xs"
                  :disabled="zoom === 1"
                  @click="resetZoom"
                />
              </UTooltip>
              <UButton @click="state.open = false">
                Close
              </UButton>
            </div>
          </header>
        </template>

        <div class="flex flex-col h-full w-full">
          <div
            ref="imageContainer"
            :class="[
              'h-[calc(80vh-64px)] overflow-hidden rounded-lg bg-[var(--color-surface-elevated)]',
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
        </div>

        <template #footer>
          <div class="flex items-center h-8">
            <USlider
              v-model="currentZoomPercent"
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
import { useImagePreview } from './useImagePreview';

import { iconKey } from '~/utils/icon';

const { state } = useImagePreview();

// Zoom bounds used by buttons/slider; keep in sync with slider min/max below
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.15;

const zoom = ref(1);
const imageContainer = ref<HTMLDivElement | null>(null);
const imgEl = ref<HTMLImageElement | null>(null);

const naturalWidth = ref(0);
const naturalHeight = ref(0);
const containerWidth = ref(0);
const containerHeight = ref(0);

const clamp = (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

const currentZoomPercent = computed({
  get: () => Math.round(zoom.value * 100),
  set: (value: number) => {
    setZoom(value / 100);
  },
});

const canZoomIn = computed(() => zoom.value < MAX_ZOOM - 0.01);
const canZoomOut = computed(() => zoom.value > MIN_ZOOM + 0.01);

// Measure scroll container size; call on open, image load, and window resize
const updateContainerSize = () => {
  const el = imageContainer.value;
  if (!el) {
    return;
  }

  containerWidth.value = el.clientWidth;
  containerHeight.value = el.clientHeight;

  // Keep content within bounds on resize
  clampTranslate();
};

// Fit scale keeps the initial view fully inside the container (no scrollbars)
const fitScale = computed(() => {
  if (!naturalWidth.value || !naturalHeight.value || !containerWidth.value || !containerHeight.value)
    return 1;
  const scaleW = containerWidth.value / naturalWidth.value;
  const scaleH = containerHeight.value / naturalHeight.value;
  return Math.min(1, scaleW, scaleH);
});

// Transform-based pan/zoom
const scaledWidth = computed(() => naturalWidth.value * (fitScale.value * zoom.value));
const scaledHeight = computed(() => naturalHeight.value * (fitScale.value * zoom.value));

const tx = ref(0);
const ty = ref(0);

const transformImageStyle = computed(() => ({
  width: `${naturalWidth.value}px`,
  height: `${naturalHeight.value}px`,
  maxWidth: 'none',
  maxHeight: 'none',
  transform: `translate(${tx.value}px, ${ty.value}px) scale(${fitScale.value * zoom.value})`,
  transformOrigin: '0 0',
}));

// Center image in viewport using translate
const centerContent = () => {
  const cw = containerWidth.value;
  const ch = containerHeight.value;
  tx.value = (cw - scaledWidth.value) / 2;
  ty.value = (ch - scaledHeight.value) / 2;
};

/**
 * Clamps translate so the image stays usable:
 * - If the scaled image is smaller than the container on an axis, keep it centered on that axis.
 * - If it’s larger, allow panning on that axis but clamp within the container bounds.
 */
const clampTranslate = () => {
  const cw = containerWidth.value;
  const ch = containerHeight.value;
  const sw = scaledWidth.value;
  const sh = scaledHeight.value;
  if (sw <= cw) {
    tx.value = (cw - sw) / 2;
  }
  else {
    const minX = cw - sw;
    const maxX = 0;
    tx.value = Math.min(Math.max(tx.value, minX), maxX);
  }
  if (sh <= ch) {
    ty.value = (ch - sh) / 2;
  }
  else {
    const minY = ch - sh;
    const maxY = 0;
    ty.value = Math.min(Math.max(ty.value, minY), maxY);
  }
};

// setZoom(value, anchorViewport?): zoom centered at viewport anchor using transform
const setZoom = (
  value: number,
  anchorViewport?: { x: number; y: number },
) => {
  const el = imageContainer.value;
  const s = fitScale.value * zoom.value || 1; // current scale
  const newZoom = clamp(Number(value.toFixed(2)));
  if (!el) {
    zoom.value = newZoom;
    return;
  }
  const vx = anchorViewport ? anchorViewport.x : el.clientWidth / 2;
  const vy = anchorViewport ? anchorViewport.y : el.clientHeight / 2;
  // Content-space anchor (unscaled image coords)
  const ax = (vx - tx.value) / s;
  const ay = (vy - ty.value) / s;
  zoom.value = newZoom;
  const s2 = fitScale.value * zoom.value || 1;
  tx.value = vx - ax * s2;
  ty.value = vy - ay * s2;
  clampTranslate();
};

watch(
  () => state.value.open,
  (open) => {
    if (open) {
      zoom.value = 1;
      nextTick(() => {
        updateContainerSize();
        nextTick(() => centerContent());
      });
    }
    else {
      zoom.value = 1;
      if (state.value.src || state.value.alt) {
        state.value.src = '';
        state.value.alt = '';
      }
    }
  },
);

const zoomIn = () => {
  setZoom(zoom.value + ZOOM_STEP);
};

const zoomOut = () => {
  setZoom(zoom.value - ZOOM_STEP);
};

const resetZoom = () => {
  setZoom(1);
};

// rAF-driven smooth zoom with faster response
const isZoomAnimating = ref(false);
let zoomRafId = 0;
let lastWheelAt = 0;
const zoomTarget = ref(1);
// Last cursor anchor in viewport coords (within container)
const lastAnchor = reactive({ x: 0, y: 0, has: false });

const wheelToZoomFactor = (event: WheelEvent) => {
  // Normalize delta to pixels (deltaMode: 0=pixel,1=line,2=page)
  const base = event.deltaMode === 1
    ? 16
    : event.deltaMode === 2
      ? (containerHeight.value || 800)
      : 1;
  const deltaPx = event.deltaY * base;
  // Increase sensitivity (k): larger k -> faster zoom
  const k = 0.012;
  return Math.exp(-deltaPx * k);
};

const stepZoomAnimation = () => {
  // Move quickly toward target (higher blend for faster response)
  const diff = zoomTarget.value - zoom.value;
  if (Math.abs(diff) < 0.0005) {
    isZoomAnimating.value = false;
    zoomTarget.value = zoom.value;
    return;
  }
  const next = zoom.value + diff * 0.8;
  setZoom(next, lastAnchor.has ? { x: lastAnchor.x, y: lastAnchor.y } : undefined);
  if (performance.now() - lastWheelAt > 50) {
    // No recent wheel input; snap to target and stop
    setZoom(zoomTarget.value, lastAnchor.has ? { x: lastAnchor.x, y: lastAnchor.y } : undefined);
    isZoomAnimating.value = false;
    return;
  }
  zoomRafId = requestAnimationFrame(stepZoomAnimation);
};

// Intercept Ctrl/Meta + wheel only (pinch-zoom gesture); otherwise let normal scrolling work
// Normalize wheel deltas to pixels
const wheelDeltaPixels = (event: WheelEvent) => {
  const base = event.deltaMode === 1
    ? 16
    : event.deltaMode === 2
      ? (containerHeight.value || 800)
      : 1;
  let dx = event.deltaX * base;
  let dy = event.deltaY * base;
  // Some browsers map Shift+Wheel to horizontal by putting value in deltaY
  if (dx === 0 && event.shiftKey && dy !== 0) {
    dx = dy;
    dy = 0;
  }
  return { dx, dy };
};

const handleWheel = (event: WheelEvent) => {
  const el = imageContainer.value;
  if (!el) return;

  if (event.ctrlKey || event.metaKey) {
    // Zoom (pinch / Ctrl+wheel)
    event.preventDefault();
    const rect = el.getBoundingClientRect();
    const vx = Math.max(0, Math.min(el.clientWidth, event.clientX - rect.left));
    const vy = Math.max(0, Math.min(el.clientHeight, event.clientY - rect.top));
    lastAnchor.x = vx;
    lastAnchor.y = vy;
    lastAnchor.has = true;
    if (!isZoomAnimating.value) {
      zoomTarget.value = zoom.value;
    }
    const factor = wheelToZoomFactor(event);
    zoomTarget.value = clamp(zoomTarget.value * factor);
    lastWheelAt = performance.now();
    if (!isZoomAnimating.value) {
      isZoomAnimating.value = true;
      zoomRafId = requestAnimationFrame(stepZoomAnimation);
    }
    return;
  }

  // Pan with wheel/trackpad
  event.preventDefault();
  const { dx, dy } = wheelDeltaPixels(event);
  // Natural scroll: positive deltaY scrolls down (content moves up)
  tx.value -= dx;
  ty.value -= dy;
  clampTranslate();
};

// Pointer-based panning
const isPanning = ref(false);
let panPointerId: number | null = null;
let panStartX = 0;
let panStartY = 0;
let panStartTx = 0;
let panStartTy = 0;

const onPointerDown = (e: PointerEvent) => {
  if (e.button !== 0) return; // left only
  const el = imageContainer.value;
  if (!el) return;
  panPointerId = e.pointerId;
  (e.target as Element).setPointerCapture?.(e.pointerId);
  isPanning.value = true;
  panStartX = e.clientX;
  panStartY = e.clientY;
  panStartTx = tx.value;
  panStartTy = ty.value;
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp, { once: true });
};

const onPointerMove = (e: PointerEvent) => {
  if (!isPanning.value || (panPointerId !== null && e.pointerId !== panPointerId)) return;
  const dx = e.clientX - panStartX;
  const dy = e.clientY - panStartY;
  tx.value = panStartTx + dx;
  ty.value = panStartTy + dy;
  clampTranslate();
};

const onPointerUp = (_e: PointerEvent) => {
  isPanning.value = false;
  panPointerId = null;
  window.removeEventListener('pointermove', onPointerMove);
};

const onImageLoad = () => {
  if (!imgEl.value) {
    return;
  }

  naturalWidth.value = imgEl.value.naturalWidth;
  naturalHeight.value = imgEl.value.naturalHeight;

  nextTick(() => {
    updateContainerSize();
    nextTick(() => centerContent());
  });
};

onMounted(() => {
  // updateContainerSize();
  window.addEventListener('resize', updateContainerSize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateContainerSize);
  if (zoomRafId) cancelAnimationFrame(zoomRafId);
});
</script>
