<template>
  <IconButton
    class="bookmark-button size-6 min-w-6 rounded-full p-0"
    :icon="isBookmarked ? iconKey.favoriteFilled : iconKey.favorite"
    :disabled="isUpdating"
    :aria-label="isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'"
    :title="isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'"
    @click="toggleBookmark"
  />
</template>

<script setup lang="ts">
import { toggleMemoBookmark } from '../../resource/command/toggleMemoBookmark';

import IconButton from '~/app/elements/IconButton.vue';
import { useBookmarkListReadModel } from '~/app/features/memo-browsing';
import { iconKey } from '~/utils/icon';

const props = defineProps<{
  workspaceSlug: string;
  memoSlug: string;
}>();

const toast = useToast();
const bookmarkListVM = useBookmarkListReadModel();
const isUpdating = ref(false);
const isBookmarked = computed(() => bookmarkListVM.value.data.items.some(
  memo => memo.slug_title === props.memoSlug,
));

const toggleBookmark = async () => {
  if (isUpdating.value) return;

  isUpdating.value = true;
  try {
    await toggleMemoBookmark({
      workspaceSlug: props.workspaceSlug,
      memoSlug: props.memoSlug,
      isBookmarked: isBookmarked.value,
    });
  }
  catch {
    toast.add({
      title: 'Failed to update bookmark.',
      description: 'Please try again',
      color: 'error',
      icon: iconKey.failed,
    });
  }
  finally {
    isUpdating.value = false;
  }
};
</script>

<style scoped>
.bookmark-button {
  border-radius: 9999px;
}
</style>
