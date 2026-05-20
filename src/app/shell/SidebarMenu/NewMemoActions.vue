<template>
  <div
    v-if="workspaceSlug"
    class="w-full"
  >
    <UButtonGroup
      orientation="horizontal"
      class="w-full"
    >
      <AppButton
        class="flex-1 justify-start"
        :icon="iconKey.add"
        :loading="isNavigating"
        color="neutral"
        variant="outline"
        @click="goToNewMemo()"
      >
        New memo
      </AppButton>

      <UDropdownMenu
        :items="templateMenuItems"
        :content="{
          align: 'end',
          side: 'bottom',
          sideOffset: 8,
        }"
      >
        <AppButton
          variant="outline"
          color="neutral"
          :icon="iconKey.chevronDown"
          aria-label="Choose template"
        />
      </UDropdownMenu>
    </UButtonGroup>
  </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';
import type { MemoTemplateIndexItem } from '~/models/memoTemplate';

import { command } from '~/external/tauri/command';
import { sortMemoTemplates } from '~/features/memo-templates';
import { iconKey } from '~/utils/icon';
import { getEncodedWorkspaceSlugFromPath } from '~/utils/route';

const route = useRoute();
const router = useRouter();

const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');
const templates = ref<MemoTemplateIndexItem[]>([]);
const isNavigating = ref(false);

const templateMenuItems = computed<DropdownMenuItem[][]>(() => {
  const items: DropdownMenuItem[][] = [[
    {
      label: 'Blank memo',
      onSelect: () => {
        void goToNewMemo({ skipDefaultTemplate: true });
      },
    },
  ]];

  if (templates.value.length > 0) {
    items.push(
      templates.value.map(template => ({
        label: template.is_default ? `${template.name} (Default)` : template.name,
        onSelect: () => {
          void goToNewMemo({ templateSlug: template.slug_name });
        },
      })),
    );
  }

  return items;
});

async function loadTemplates() {
  if (!workspaceSlug.value) {
    templates.value = [];
    return;
  }

  const nextTemplates = await command.memoTemplate.list({ slugName: workspaceSlug.value });
  templates.value = sortMemoTemplates(nextTemplates);
}

async function goToNewMemo(options?: { templateSlug?: string; skipDefaultTemplate?: boolean }) {
  if (!workspaceSlug.value) {
    return;
  }

  isNavigating.value = true;
  try {
    await router.push({
      path: `/${workspaceSlug.value}/__new__`,
      query: {
        template: options?.templateSlug,
        skipDefaultTemplate: options?.skipDefaultTemplate ? 'true' : undefined,
      },
    });
  }
  finally {
    isNavigating.value = false;
  }
}

watch(
  () => route.fullPath,
  () => {
    void loadTemplates();
  },
  { immediate: true },
);
</script>
