<template>
  <div
    class="image-skeleton-shell"
    :class="[containerClass, showSkeleton ? 'image-skeleton-shell-loading' : 'image-skeleton-shell-ready']"
  >
    <div
      v-if="showSkeleton"
      class="image-skeleton-placeholder"
      :class="skeletonClass"
      aria-hidden="true"
    />
    <img
      :src="src"
      :alt="alt"
      :class="[imgClass, showSkeleton ? 'image-skeleton-img-loading' : 'image-skeleton-img-ready']"
      @load="handleLoad"
      @error="handleError"
    >
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  src: string;
  alt?: string;
  containerClass?: string;
  imgClass?: string;
  skeletonClass?: string;
}>(), {
  alt: '',
  containerClass: '',
  imgClass: '',
  skeletonClass: '',
});

const isLoaded = ref(false);
const hasError = ref(false);

const showSkeleton = computed(() => !isLoaded.value && !hasError.value);

watch(() => props.src, () => {
  isLoaded.value = false;
  hasError.value = false;
});

const handleLoad = () => {
  isLoaded.value = true;
};

const handleError = () => {
  hasError.value = true;
};
</script>

<style scoped>
.image-skeleton-shell {
  position: relative;
  width: 100%;
}

.image-skeleton-placeholder {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background:
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--color-surface-elevated) 92%, var(--color-border-light)) 0%,
      color-mix(in srgb, var(--color-surface-elevated) 72%, white) 50%,
      color-mix(in srgb, var(--color-surface-elevated) 92%, var(--color-border-light)) 100%
    );
  background-size: 200% 100%;
  animation: image-skeleton-shimmer 1.2s linear infinite;
}

.image-skeleton-img-loading {
  opacity: 0;
}

.image-skeleton-img-ready {
  opacity: 1;
  transition: opacity 0.18s ease-out;
}

@keyframes image-skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}
</style>
