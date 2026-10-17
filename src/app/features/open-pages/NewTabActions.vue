<template>
  <AppButton
    class="open-pages__add sidebar-link mt-2"
    :icon="iconKey.add"
    color="neutral"
    variant="ghost"
    block
    aria-label="New tab"
    @click="startNewTab"
  />
</template>

<script setup lang="ts">
import { getTabPageLocation, NEW_TAB_PAGE } from './openPages';
import { useOpenPagesStore } from './openPagesStore';

import AppButton from '~/app/elements/AppButton.vue';
import { iconKey } from '~/utils/icon';

const props = defineProps<{
  workspaceSlug: string;
}>();

const router = useRouter();
const openPagesStore = useOpenPagesStore();

async function startNewTab() {
  openPagesStore.createTab(props.workspaceSlug);
  await router.replace(getTabPageLocation(props.workspaceSlug, NEW_TAB_PAGE));
}
</script>

<style scoped>
.open-pages__add {
  min-height: 1.75rem;
  justify-content: center;
}
</style>
