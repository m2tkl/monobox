<template>
  <NuxtLayout name="default">
    <template #main>
      <div class="flex h-full items-center justify-center px-4">
        <div class="flex flex-col items-center gap-3 text-center">
          <LoadingSpinner />
          <p
            class="text-sm"
            style="color: var(--color-text-secondary)"
          >
            Creating a new memo...
          </p>
        </div>
      </div>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { CREATED_QUERY_SOURCE_BLANK } from '~/app/features/memo/creation';
import { buildUntitledMemoTitle } from '~/app/features/memo/template';
import { useMemoCreateAction } from '~/app/features/memo/useMemoCreateAction';
import LoadingSpinner from '~/app/ui/LoadingSpinner.vue';
import { command } from '~/external/tauri/command';
import { getEncodedWorkspaceSlugFromPath } from '~/utils/route';

definePageMeta({
  path: '/:workspace/__new__',
  validate(route) {
    return route.params.workspace !== '_setting';
  },
});

const route = useRoute();
const router = useRouter();
const { createMemo } = useMemoCreateAction();
const workspaceSlug = computed(() => getEncodedWorkspaceSlugFromPath(route) || '');
const requestedTemplateSlug = computed(() =>
  typeof route.query.template === 'string'
    ? route.query.template
    : undefined,
);
const shouldSkipDefaultTemplate = computed(() => route.query.skipDefaultTemplate === 'true');

await usePageLoader(async () => {
  const workspaceMemos = await command.memo.list({ slugName: workspaceSlug.value });
  const newMemoTitle = buildUntitledMemoTitle(workspaceMemos.map(memo => memo.title));
  const newMemo = await createMemo({
    workspaceSlug: workspaceSlug.value,
    title: newMemoTitle,
  });
  await router.replace({
    path: `/${workspaceSlug.value}/${newMemo.slug_title}`,
    query: {
      created: CREATED_QUERY_SOURCE_BLANK,
      template: requestedTemplateSlug.value,
      skipDefaultTemplate: shouldSkipDefaultTemplate.value ? 'true' : undefined,
    },
  });
});
</script>
