<template>
  <div
    ref="outlineRef"
    class="hide-scrollbar h-full overflow-y-auto bg-slate-100"
  >
    <div
      class="sticky left-0 top-0 z-50 flex h-8 items-center gap-1.5 border-b-2 border-slate-400  bg-[--slate] px-2 py-1.5 text-sm text-gray-700"
    >
      <UIcon :name="iconKey.tree" />
      Outline
    </div>

    <ul class="flex flex-col">
      <li
        v-for="item in items"
        :key="item.text"
      >
        <div
          class="group relative flex min-h-8 cursor-pointer items-center border-slate-300 px-2 py-1.5 text-sm text-gray-700 hover:bg-blue-100 hover:text-gray-900"
          :class="{ 'bg-blue-200 font-bold': activeHeadingId === item.id,
                    'bg-slate-200': activeAncestorHeadingIds.includes(item.id ?? ''), // ancestor highlight
          }"
          :data-id="item.id"

          @click="item.id && emits('click', item.id)"
        >
          <span :class="indent(item.level)" />
          <span class="pr-1 text-xs font-semibold text-gray-400">{{ '#'.repeat(item.level) }}</span>
          <span
            v-if="item"
            class="text-wrap"
          >
            {{ item.text }}
          </span>

          <!-- Link copy -->
          <IconButton
            v-if="item.id"
            :icon="iconKey.link"
            class="absolute right-1 rounded bg-transparent p-1 text-xs opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            @click.stop="emits('copy-link', item.id, item.text)"
          />
        </div>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  items: Array<{
    id: string | null;
    text: string;
    level: number;
  }>;
  activeHeadingId?: string;
}>();

const emits = defineEmits<{
  (e: 'click', id: string): void;
  (e: 'copy-link', id: string, text: string): void;
}>();

const indentStyle: Record<number, string> = {
  1: '',
  2: 'pl-4',
  3: 'pl-8',
  4: 'pl-12',
  5: 'pl-16',
  6: 'pl-20',
};

const indent = (level: number) => indentStyle[level] ?? '';

// Reference to control the outline auto scroll
const outlineRef = ref<HTMLElement | null>(null);

watch(() => props.activeHeadingId, (newId) => {
  if (!newId || !outlineRef.value) return;

  const outlineContaiiner = outlineRef.value;
  const activeOutlineItem = outlineRef.value.querySelector(`[data-id="${newId}"]`);

  if (activeOutlineItem) {
    const tocHeadingHeight = 48;
    const offset = 48;

    // Get the bounding rectangles of the active ToC item and the ToC container
    const itemRect = activeOutlineItem.getBoundingClientRect();
    const containerRect = outlineContaiiner.getBoundingClientRect();

    // Check if the active item is out of the visible range
    const isAbove = itemRect.top < containerRect.top + tocHeadingHeight + offset;
    const isBelow = itemRect.bottom > containerRect.bottom - offset;

    if (isAbove || isBelow) {
      const currentScrollTop = outlineContaiiner.scrollTop;
      const itemTopRelativeToContainer = itemRect.top - containerRect.top;

      // Determine the new scroll position
      const targetScrollTop = isAbove
        ? currentScrollTop + itemTopRelativeToContainer - (tocHeadingHeight + offset)
        : currentScrollTop + (itemRect.bottom - containerRect.bottom) + offset;

      outlineContaiiner.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth',
      });
    }
  }
});

/**
 * Computes the list of ancestor heading IDs for the currently active heading.
 *
 * Starting from the active heading, this function walks backwards through the list of headings,
 * collecting all headings that have a lower level (i.e., higher in the document structure).
 * It stops when it reaches the top-level heading (level 1).
 *
 * @returns An array of heading IDs representing the ancestors of the active heading,
 *          ordered from closest parent to farthest (i.e., immediate parent first).
 */
const activeAncestorHeadingIds = computed(() => {
  if (!props.activeHeadingId) return [];

  const index = props.items.findIndex(item => item.id === props.activeHeadingId);
  if (index === -1) return [];

  const ancestors: string[] = [];
  let currentLevel = props.items[index].level;

  for (let i = index - 1; i >= 0; i--) {
    const item = props.items[i];
    if (item.level < currentLevel && item.id) {
      ancestors.push(item.id);
      currentLevel = item.level;

      if (currentLevel === 1) break;
    }
  }

  return ancestors;
});
</script>
