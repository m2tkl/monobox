<template>
  <div class="border-t memo-link-container p-0">
    <!-- Link Header -->
    <div
      class="sticky left-0 top-0 z-50 flex h-8 items-center gap-2 border-b memo-separator memo-link-header px-2 py-1 text-sm font-semibold"
      style="background-color: var(--color-surface)"
    >
      <UIcon :name="iconKey.link" />
      Links
    </div>

    <!-- Backlinks -->
    <div
      v-if="backLinks.length !== 0"
      class="my-4"
    >
      <ul class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 px-4">
        <li class="aspect-[1/1] rounded-lg">
          <TitleCard
            title="Links"
            card-type="text"
          />
        </li>

        <li
          v-for="memo in backLinks"
          :key="memo.id"
          class="aspect-[1/1] overflow-hidden rounded-lg"
        >
          <NuxtLink
            :to="buildMemoPath(memo.slug_title)"
            @click="(event: MouseEvent) => onMemoLinkClick(event, memo.slug_title, memo.title)"
          >
            <ThumbnailCard
              :title="truncateString(extractsTitleParts(memo.title).memoTitle, TITLE_TRUNCATE)"
              :context="extractsTitleParts(memo.title).context !== memoTitle ? extractsTitleParts(memo.title).context : undefined"
              :description="memo.description"
              :thumbnail-image="memo.thumbnail_image"
            />
          </NuxtLink>
        </li>
      </ul>
    </div>

    <!-- Forward links -->
    <div>
      <div v-if="forwardLinks.length !== 0">
        <ul class="flex flex-col gap-0">
          <li
            v-for="link in forwardLinks"
            :key="link.link_id"
          >
            <!-- Direct forward link -->
            <ul class="my-4 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 px-4">
              <li class="aspect-[1/1] overflow-hidden rounded-lg ">
                <NuxtLink
                  :to="buildMemoPath(link.slug_title)"
                  class="flex flex-col"
                  @click="(event: MouseEvent) => onMemoLinkClick(event, link.slug_title, link.title)"
                >
                  <TitleCard
                    :title="truncateString(extractsTitleParts(link.title).memoTitle, TITLE_TRUNCATE)"
                    :context="extractsTitleParts(link.title).context !== memoTitle ? extractsTitleParts(link.title).context : undefined"
                    card-type="link"
                  />
                </NuxtLink>
              </li>

              <!-- 2hop-link -->
              <li
                v-for="thl in twoHopLinks.filter(
                  (thl) => thl.link_id === link.link_id,
                )"
                :key="thl.link_id"
                class="aspect-[1/1] overflow-hidden rounded-lg"
              >
                <NuxtLink
                  :to="buildMemoPath(thl.slug_title)"
                  @click="(event: MouseEvent) => onMemoLinkClick(event, thl.slug_title, thl.title)"
                >
                  <ThumbnailCard
                    :title="truncateString(extractsTitleParts(thl.title).memoTitle, TITLE_TRUNCATE)"
                    :context="extractsTitleParts(thl.title).context !== link.title ? extractsTitleParts(thl.title).context : undefined"
                    :description="thl.description"
                    :thumbnail-image="thl.thumbnail_image"
                  />
                </NuxtLink>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>

    <div
      v-if="props.files.length !== 0"
      class="my-4"
    >
      <div class="mb-3 flex items-center gap-2 px-4 text-sm font-semibold memo-link-title">
        <UIcon :name="iconKey.documentAttachment" />
        Files
      </div>

      <ul class="flex flex-col gap-2 px-4">
        <li
          v-for="file in props.files"
          :key="file.id"
          class="overflow-hidden rounded-lg"
        >
          <button
            type="button"
            class="memo-file-row size-full text-left"
            @click="openManagedFile(file.id)"
          >
            <div class="memo-file-row__main">
              <UIcon
                :name="file.type === 'external_link' ? iconKey.link : iconKey.documentAttachment"
                class="memo-file-icon shrink-0"
              />
              <span class="memo-file-name">{{ file.display_name }}</span>
            </div>
            <UIcon
              name="carbon:launch"
              class="memo-file-open-icon shrink-0"
            />
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import ThumbnailCard from './ThumbnailCard.vue';
import TitleCard from './TitleCard.vue';

import type { MemoLinkedFileItem } from '~/models/file';
import type { Link } from '~/models/link';

import { getMemoLinkOpenIntent } from '~/app/features/memo-editing/memoLinkOpenIntent';
import { fileCommand } from '~/resources/file/commands';
import { handleError } from '~/utils/error';

const props = defineProps<{
  memoTitle: string;
  links: Array<Link>;
  files: Array<MemoLinkedFileItem>;
}>();

const emit = defineEmits<{
  'open-context': [path: string];
  'open-context-window': [path: string, title: string];
}>();

const TITLE_TRUNCATE = 32;

const route = useRoute();
const toast = useToast();
const buildMemoPath = (slug: string) => `/${route.params.workspace}/${slug}`;

const onMemoLinkClick = (event: MouseEvent, memoSlug: string, memoTitle: string) => {
  const intent = getMemoLinkOpenIntent(event);
  if (intent === 'navigate') {
    return;
  }

  event.preventDefault();
  if (intent === 'context-window') {
    emit('open-context-window', buildMemoPath(memoSlug), memoTitle);
    return;
  }

  emit('open-context', buildMemoPath(memoSlug));
};

const forwardLinks = computed(() =>
  props.links.filter(link => link.link_type === 'Forward'),
);
const backLinks = computed(() =>
  props.links.filter(link => link.link_type === 'Backward'),
);
const twoHopLinks = computed(() =>
  props.links.filter(link => link.link_type === 'TwoHop'),
);

const openManagedFile = async (fileId: string) => {
  try {
    await fileCommand.openManagedFile(fileId);
  }
  catch (error) {
    const appError = handleError(error);
    toast.add({
      title: 'Failed to open file.',
      description: appError.message,
      color: 'error',
    });
  }
};

function extractsTitleParts(title: string): { memoTitle: string; context: string } {
  const parts = title.split('/');
  const memoTitle = parts.pop() ?? title;
  return { memoTitle, context: parts.join('/') };
}
</script>

<style scoped>
.memo-file-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
  padding: 0.85rem 0.95rem;
  border: 1px solid var(--color-border-light);
  border-radius: 0.75rem;
  background-color: var(--color-surface-elevated);
  transition: background-color 0.18s ease, border-color 0.18s ease;
}

.memo-file-row:hover {
  background-color: color-mix(in srgb, var(--color-surface-hover) 82%, transparent);
  border-color: var(--color-border-hover);
}

.memo-file-row__main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.memo-file-icon {
  font-size: 1rem;
  color: var(--color-text-secondary);
}

.memo-file-name {
  min-width: 0;
  font-size: 0.92rem;
  font-weight: 500;
  color: var(--color-text-primary);
  text-align: left;
}

.memo-file-open-icon {
  color: var(--color-text-secondary);
}
</style>
