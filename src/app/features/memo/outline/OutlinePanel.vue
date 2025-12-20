<template>
  <div
    class="scrollbar border-right flex h-full w-[250px] shrink-0 flex-col gap-3"
    style="background-color: var(--color-background)"
  >
    <OutlineView
      :outline="outline"
      :active-heading-id="activeHeadingId"
      :active-ancestor-headings="activeAncestorHeadings"
      @click="(id: string, title: string) => onClickHeading(id, title)"
      @copy-link="(id: string, text: string) => onCopyLink(id, text)"
    />
  </div>
</template>

<script setup lang="ts">
import OutlineView from '~/app/features/memo/outline/OutlineView.vue';

type Heading = { id: string; level: number; text: string };

const props = defineProps<{
  outline: Heading[];
  activeHeadingId?: string;
  activeAncestorHeadings: Heading[];

  // Info for recent history and URL building
  memoTitle: string;
  memoSlug: string;
  workspaceSlug: string;
  routePath: string;

  // Handlers provided by page
  focusHeading: (id: string) => void;
  navigateToHeading: (id: string) => void;
  copyLinkToHeading: (fullUrl: string, titleWithHeading: string) => void;
}>();

const recentStore = useRecentMemoStore();

const onClickHeading = (id: string, title: string) => {
  props.focusHeading(id);
  props.navigateToHeading(id);
  recentStore.addMemo(`${props.memoTitle} › ${title}`, props.memoSlug, props.workspaceSlug, `#${id}`);
};

const onCopyLink = (id: string, text: string) => {
  const fullUrl = `${props.routePath}#${id}`;
  const titleWithHeading = `${props.routePath}#${text}`;
  props.copyLinkToHeading(fullUrl, titleWithHeading);
};
</script>
