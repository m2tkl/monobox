<template>
  <UCard
    class="aspect-[1/1] card-interactive"
    :ui="{
      header: 'px-3 pt-3 pb-0 sm:px-3',
      body: 'px-3 pb-4 pt-1 sm:p-3',
      root: 'overflow-hidden',
    }"
  >
    <template #header>
      <div class="flex items-start gap-2">
        <h3 class="min-w-0 flex-1 truncate-multiline text-sm font-semibold memo-link-title">
          {{ title }}
        </h3>
        <UIcon
          v-if="isBookmarked"
          :name="iconKey.bookmarkFilled"
          class="bookmark-icon shrink-0"
        />
      </div>
      <p
        v-if="context"
        class="truncate-multiline text-xs memo-link-description"
      >
        @{{ context }}
      </p>
    </template>
    <ImageWithSkeleton
      v-if="thumbnailImage"
      :src="transformImageSrc(thumbnailImage)"
      :alt="title"
      container-class="thumbnail-image-shell"
      img-class="thumbnail-image"
      skeleton-class="thumbnail-image-skeleton"
    />
    <p
      v-for="(p, index) in truncateString(description ? description : '', 128)?.split('\n')"
      v-else
      :key="`${index}:${p}`"
      class="truncate-multiline text-sm memo-link-description"
    >
      {{ p }}
    </p>
  </UCard>
</template>

<script setup lang="ts">
import ImageWithSkeleton from '~/app/elements/ImageWithSkeleton.vue';
import { iconKey } from '~/utils/icon';

defineProps<{
  title: string;
  context?: string;
  description: string | undefined | null;
  thumbnailImage: string | undefined | null;
  isBookmarked?: boolean;
}>();
</script>

<style scoped>
.bookmark-icon {
  color: var(--color-primary);
  font-size: 1rem;
}

/* Completely hide any dividers in the card */
:deep(.divide-y > *) {
  border-top: none !important;
  border-bottom: none !important;
}

:deep(.divide-gray-200 > *) {
  border-top: none !important;
}

:deep([class*="divide-"]) {
  border: none !important;
}

/* Force hide all borders and dividers */
:deep(*) {
  border-top: none !important;
  border-bottom: none !important;
}

:deep(.card > *) {
  border: none !important;
}

:deep(.card-header) {
  border-bottom: none !important;
}

:deep(.card-body) {
  border-top: none !important;
}

.thumbnail-image-shell {
  min-height: 120px;
}

.thumbnail-image {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 0.5rem;
}

.thumbnail-image-skeleton {
  min-height: 120px;
  border-radius: 0.5rem;
}
</style>
