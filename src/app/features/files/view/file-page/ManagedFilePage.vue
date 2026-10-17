<template>
  <NuxtLayout name="default">
    <template #main>
      <AppPageFrame
        contained
        fill
        inner-class="file-page"
      >
        <LoadingSpinner v-if="isLoading" />

        <div
          v-else-if="!detail"
          class="file-page__empty"
        >
          This file could not be found.
        </div>

        <template v-else>
          <AppPageHeader
            :title="detail.display_name"
            :description="fileTypeLabel"
            :icon="iconKey.documentAttachment"
          >
            <template #actions>
              <AppButton
                :icon="iconKey.openPanel"
                color="neutral"
                variant="outline"
                :loading="isOpening"
                @click="openExternally"
              >
                Open externally
              </AppButton>
            </template>
          </AppPageHeader>

          <div class="file-page__layout">
            <section
              class="file-page__preview"
              aria-label="File preview"
            >
              <img
                v-if="previewUrl && !previewFailed"
                :src="previewUrl"
                :alt="detail.display_name"
                @error="previewFailed = true"
              >
              <div
                v-else
                class="file-page__cover"
              >
                <UIcon
                  :name="iconKey.documentAttachment"
                  class="file-page__cover-icon"
                />
                <strong>{{ detail.display_name }}</strong>
                <span>{{ previewLabel }}</span>
              </div>
            </section>

            <aside class="file-page__context">
              <section class="file-page__panel">
                <h2>File information</h2>
                <dl>
                  <div>
                    <dt>Type</dt>
                    <dd>{{ fileTypeLabel }}</dd>
                  </div>
                  <div>
                    <dt>Imported</dt>
                    <dd>{{ formattedImportedAt }}</dd>
                  </div>
                  <div v-if="detail.url">
                    <dt>URL</dt>
                    <dd class="break-all">
                      {{ detail.url }}
                    </dd>
                  </div>
                </dl>
              </section>

              <section class="file-page__panel">
                <h2>Memo</h2>
                <p
                  v-if="detail.note"
                  class="whitespace-pre-wrap"
                >
                  {{ detail.note }}
                </p>
                <p
                  v-else
                  class="file-page__muted"
                >
                  No memo has been added.
                </p>
              </section>

              <section class="file-page__panel">
                <h2>Related memos</h2>
                <ul
                  v-if="detail.related_memos.length"
                  class="file-page__links"
                >
                  <li
                    v-for="memo in detail.related_memos"
                    :key="memo.memo_id"
                  >
                    <NuxtLink :to="`/${memo.workspace_slug_name}/${memo.memo_slug_title}`">
                      {{ memo.title }}
                    </NuxtLink>
                  </li>
                </ul>
                <p
                  v-else
                  class="file-page__muted"
                >
                  No related memos.
                </p>
              </section>
            </aside>
          </div>
        </template>
      </AppPageFrame>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { convertFileSrc, isTauri } from '@tauri-apps/api/core';

import { isImageFile } from './filePreview';

import AppButton from '~/app/elements/AppButton.vue';
import AppPageFrame from '~/app/elements/layout/AppPageFrame.vue';
import AppPageHeader from '~/app/elements/layout/AppPageHeader.vue';
import LoadingSpinner from '~/app/elements/status/LoadingSpinner.vue';
import { useManagedFileDetailReadModel } from '~/app/features/files/resource/read-model';
import { createFileTabPage } from '~/app/features/open-pages/openPages';
import { useOpenPagesStore } from '~/app/features/open-pages/openPagesStore';
import { command } from '~/resources/command';
import { iconKey } from '~/utils/icon';
import { getEncodedWorkspaceSlugFromPath } from '~/utils/route';

const route = useRoute();
const toast = useToast();
const openPagesStore = useOpenPagesStore();
const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) ?? '');
const fileId = computed(() => String(route.params.fileId ?? ''));
const fileVM = useManagedFileDetailReadModel(workspaceSlug, fileId);
const detail = computed(() => fileVM.value.data.detail);
const isLoading = computed(() => fileVM.value.flags.isLoading);
const previewUrl = ref('');
const previewFailed = ref(false);
const isOpening = ref(false);

const fileTypeLabel = computed(() => {
  if (detail.value?.type === 'external_link') return 'Shared link';
  if (detail.value?.type === 'local_directory') return 'Folder';
  return 'File';
});
const formattedImportedAt = computed(() => {
  if (!detail.value?.imported_at) return 'Unknown';
  const date = new Date(detail.value.imported_at);
  return Number.isNaN(date.getTime()) ? detail.value.imported_at : date.toLocaleString();
});
const previewLabel = computed(() => {
  if (previewFailed.value) return 'Preview could not be displayed.';
  if (detail.value?.type === 'local_directory') return 'Open this folder to browse its contents.';
  if (detail.value?.type === 'external_link') return 'Open this link in your browser.';
  if (isImageFile(detail.value?.display_name ?? '')) return 'Image preview is unavailable.';
  return 'Preview is not available for this file type.';
});

watch(detail, async (nextDetail) => {
  previewUrl.value = '';
  previewFailed.value = false;
  if (!nextDetail || !workspaceSlug.value) return;

  openPagesStore.openInActiveTab(
    workspaceSlug.value,
    createFileTabPage(nextDetail.id, nextDetail.display_name),
  );

  if (nextDetail.type !== 'local_file' || !isImageFile(nextDetail.display_name) || !isTauri()) return;
  try {
    const target = await command.file.resolveOpenTarget(nextDetail.id);
    if (target.open_kind === 'path') previewUrl.value = convertFileSrc(target.value);
  }
  catch {
    previewFailed.value = true;
  }
}, { immediate: true });

async function openExternally() {
  if (!detail.value) return;
  isOpening.value = true;
  try {
    await command.file.openManagedFile(detail.value.id);
  }
  catch {
    toast.add({ title: 'Failed to open file.', color: 'error' });
  }
  finally {
    isOpening.value = false;
  }
}
</script>

<style scoped>
.file-page {
  display: flex;
  min-height: 0;
  height: 100%;
  flex-direction: column;
  overflow: hidden;
}

.file-page__layout {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(16rem, 0.8fr);
  min-height: 0;
  flex: 1;
  gap: 1rem;
}

.file-page__preview,
.file-page__panel {
  border: 1px solid var(--color-border-light);
  border-radius: 0.75rem;
  background: var(--color-surface-elevated);
}

.file-page__preview {
  display: flex;
  min-height: 20rem;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.file-page__preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.file-page__cover {
  display: flex;
  max-width: 28rem;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  text-align: center;
  color: var(--color-text-secondary);
}

.file-page__cover-icon {
  width: 4rem;
  height: 4rem;
  color: var(--color-text-muted);
}

.file-page__context {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
}

.file-page__panel {
  padding: 1rem;
}

.file-page__panel h2 {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  font-weight: 700;
}

.file-page__panel dl,
.file-page__panel p {
  margin: 0;
  font-size: 0.8125rem;
}

.file-page__panel dl > div {
  display: grid;
  grid-template-columns: 5rem minmax(0, 1fr);
  gap: 0.5rem;
  padding: 0.25rem 0;
}

.file-page__panel dt,
.file-page__muted {
  color: var(--color-text-muted);
}

.file-page__links {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.8125rem;
}

.file-page__links a {
  display: block;
  padding: 0.375rem 0.5rem;
  border-radius: 0.375rem;
}

.file-page__links a:hover {
  background: var(--color-sidebar-item-hover);
}

.file-page__empty {
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
}

@media (max-width: 820px) {
  .file-page__layout {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }

  .file-page__context {
    overflow: visible;
  }
}
</style>
