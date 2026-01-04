<template>
  <div>
    <NuxtRouteAnnouncer />

    <UApp>
      <TitleBar />
      <NuxtPage class="h-screen pt-[3rem]" />
      <ImagePreviewDialog />
    </UApp>
  </div>
</template>

<script setup lang="ts">
import TitleBar from '~/app/chrome/TitleBar.vue';
import ImagePreviewDialog from '~/app/features/memo/editor/ImagePreviewDialog/Index.vue';
import { command } from '~/external/tauri/command';
import { handleError } from '~/utils/error';

const bootstrapResourceState = async () => {
  const { bootstrapResourceState: boot } = await import('./resource-state/index');
  boot();
};

const router = useRouter();
const route = useRoute();
const toast = useToast();

onMounted(async () => {
  try {
    const config = await command.config.get();
    const shouldRedirect = await needsSetup(config);
    if (shouldRedirect) {
      await router.replace('/_setup');
      return;
    }
    bootstrapResourceState();
  }
  catch (error) {
    const appError = handleError(error);
    toast.add({
      title: 'Failed to load config.',
      description: appError.message,
      color: 'error',
    });
  }
});

const needsSetup = async (config: { database_path: string; asset_dir_path: string; setup_complete: boolean }) => {
  if (route.path === '/_setup') {
    return false;
  }

  const hasPaths = config.database_path.length > 0 && config.asset_dir_path.length > 0;
  if (!config.setup_complete || !hasPaths) {
    return true;
  }

  try {
    await command.config.validate();
    return false;
  }
  catch {
    return true;
  }
};
</script>
