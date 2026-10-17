<template>
  <NuxtLayout name="default">
    <template #main>
      <AppPageFrame
        contained
        class="new-tab-page"
        inner-class="new-tab-page__inner"
      >
        <header class="new-tab-page__header">
          <div>
            <p class="new-tab-page__eyebrow">
              Start working
            </p>
            <h1 class="new-tab-page__title">
              New tab
            </h1>
          </div>
          <AppButton
            :icon="iconKey.setting"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="isCustomizeOpen = true"
          >
            Customize
          </AppButton>
        </header>

        <div class="new-tab-page__search-actions">
          <NewTabSearchLauncher
            class="new-tab-page__search"
            @open="openSearchPalette"
          />
          <AppButton
            class="new-tab-page__random"
            :icon="iconKey.shuffle"
            color="neutral"
            variant="outline"
            size="xl"
            square
            :disabled="workspaceMemos.length === 0"
            aria-label="Random memo"
            title="Random memo"
            @click="openRandomMemo"
          />
        </div>

        <div class="new-tab-page__sections">
          <NewTabSectionPanel
            v-for="section in visibleSections"
            :key="section.key"
            :section="section"
            :workspace-slug="workspaceSlug"
            :compact-item-limit="COMPACT_SECTION_ITEM_LIMIT"
            :bookmarked-memo-ids="bookmarkedMemoIds"
          />
        </div>
      </AppPageFrame>
    </template>

    <template #actions>
      <SearchPalette
        ref="searchPaletteRef"
        :workspace-slug="workspaceSlug"
        :memos="workspaceMemos"
        type="search"
        shortcut-symbol="k"
        search-modes
      />

      <AppDialog
        v-model:open="isCustomizeOpen"
        title="Customize new tab"
        description="Choose the sections shown when a new tab opens."
      >
        <div class="new-tab-customize">
          <AppCheckbox
            v-for="option in sectionOptions"
            :key="option.key"
            :model-value="selectedSectionKeys.includes(option.key)"
            :label="option.label"
            @update:model-value="toggleSection(option.key, $event)"
          />
        </div>
        <template #footer>
          <div class="new-tab-customize__footer">
            <AppButton
              color="neutral"
              variant="ghost"
              @click="restoreDefaults"
            >
              Reset
            </AppButton>
            <AppButton @click="isCustomizeOpen = false">
              Done
            </AppButton>
          </div>
        </template>
      </AppDialog>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import NewTabSearchLauncher from './NewTabSearchLauncher.vue';
import NewTabSectionPanel from './NewTabSectionPanel.vue';
import {
  getDefaultNewTabSectionKeys,
  newTabPreferencesKey,
  parseNewTabSectionKeys,
  type NewTabSectionKey,
} from '../newTabPreferences';
import { buildNewTabSections, getNewTabSectionOptions } from '../useNewTabSections';

import AppButton from '~/app/elements/AppButton.vue';
import AppCheckbox from '~/app/elements/AppCheckbox.vue';
import AppPageFrame from '~/app/elements/layout/AppPageFrame.vue';
import AppDialog from '~/app/elements/overlays/AppDialog.vue';
import {
  useBookmarkListReadModel,
  useFocusListReadModel,
  useGlobalStatusBoardReadModel,
  useWorkspaceMemosReadModel,
} from '~/app/features/memo-browsing';
import { getTabPageLocation } from '~/app/features/open-pages/openPages';
import { useOpenPagesStore } from '~/app/features/open-pages/openPagesStore';
import { pickRandomMemoPage } from '~/app/features/open-pages/randomMemoPage';
import { SearchPalette } from '~/app/features/search';
import { iconKey } from '~/utils/icon';
import { getEncodedWorkspaceSlugFromPath } from '~/utils/route';

const COMPACT_SECTION_ITEM_LIMIT = 6;
const route = useRoute();
const router = useRouter();
const workspaceSlug = getEncodedWorkspaceSlugFromPath(route)!;
const openPagesStore = useOpenPagesStore();
const bookmarksVM = useBookmarkListReadModel();
const focusVM = useFocusListReadModel();
const statusVM = useGlobalStatusBoardReadModel();
const workspaceMemosVM = useWorkspaceMemosReadModel();
const searchPaletteRef = ref<InstanceType<typeof SearchPalette> | null>(null);
const isCustomizeOpen = ref(false);
const selectedSectionKeys = ref<NewTabSectionKey[]>([]);
const hasStoredPreferences = ref(false);
const preferencesReady = ref(false);

const workspaceMemos = computed(() => workspaceMemosVM.value.data.items);
const bookmarkedMemoIds = computed(() => bookmarksVM.value.data.items.map(memo => memo.id));
const statuses = computed(() => statusVM.value.data.statuses);
const sectionOptions = computed(() => getNewTabSectionOptions(statuses.value));
const visibleSections = computed(() => buildNewTabSections({
  selectedKeys: selectedSectionKeys.value,
  statuses: statuses.value,
  focusItems: focusVM.value.data.activeItems,
  assignedItems: statusVM.value.data.assignedItems,
  recentItems: workspaceMemos.value,
}));

function restoreDefaults() {
  selectedSectionKeys.value = getDefaultNewTabSectionKeys(statuses.value);
}

function loadPreferences() {
  const stored = typeof localStorage === 'undefined'
    ? null
    : parseNewTabSectionKeys(localStorage.getItem(newTabPreferencesKey(workspaceSlug)));
  hasStoredPreferences.value = !!stored;
  selectedSectionKeys.value = stored ?? getDefaultNewTabSectionKeys(statuses.value);
  preferencesReady.value = true;
}

function toggleSection(key: NewTabSectionKey, enabled: boolean | undefined) {
  if (enabled && !selectedSectionKeys.value.includes(key)) {
    selectedSectionKeys.value = [...selectedSectionKeys.value, key];
  }
  else if (!enabled && selectedSectionKeys.value.length > 1) {
    selectedSectionKeys.value = selectedSectionKeys.value.filter(item => item !== key);
  }
}

function openSearchPalette(initialTerm = '') {
  searchPaletteRef.value?.openCommandPalette(initialTerm);
}

async function openRandomMemo() {
  const page = pickRandomMemoPage(workspaceMemos.value);
  if (!page) return;

  openPagesStore.openInActiveTab(workspaceSlug, page);
  await router.push(getTabPageLocation(workspaceSlug, page));
}

onMounted(loadPreferences);

watch(statuses, () => {
  if (preferencesReady.value && !hasStoredPreferences.value) restoreDefaults();
});

watch(selectedSectionKeys, (keys) => {
  if (preferencesReady.value && typeof localStorage !== 'undefined' && keys.length > 0) {
    localStorage.setItem(newTabPreferencesKey(workspaceSlug), JSON.stringify(keys));
  }
}, { deep: true });
</script>

<style scoped>
.new-tab-page {
  min-height: 100%;
}

.new-tab-page :deep(.new-tab-page__inner) {
  max-width: 72rem;
  padding: clamp(2rem, 6vh, 5rem) clamp(0.5rem, 3vw, 2rem) 3rem;
}

.new-tab-page__header,
.new-tab-customize__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.new-tab-page__eyebrow {
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.new-tab-page__title {
  color: var(--color-text-primary);
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 700;
}

.new-tab-page__search-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.new-tab-page__search {
  min-width: 0;
  flex: 1;
}

.new-tab-page__random {
  width: 3.25rem;
  height: 3.25rem;
  flex-shrink: 0;
  border-radius: 9999px;
}

.new-tab-page__sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.new-tab-customize {
  display: grid;
  gap: 0.75rem;
  min-width: min(24rem, 80vw);
}

.new-tab-customize__footer {
  gap: 0.5rem;
}

@media (max-width: 640px) {
  .new-tab-page__header {
    align-items: flex-end;
  }
}
</style>
