<template>
  <div>
    <LoadingSpinner v-if="isLoading" />

    <div
      v-else
      class="space-y-6"
    >
      <UForm
        :state="formState"
        :validate="validate"
        class="space-y-6"
        @submit="onSubmit"
      >
        <div
          v-if="mode === 'setup' && setupView === 'existing'"
          class="space-y-4 pb-4"
        >
          <div class="space-y-2">
            <h4
              class="text-sm font-semibold"
              style="color: var(--color-text-primary)"
            >
              Existing storage configuration found
            </h4>
            <p
              class="text-xs"
              style="color: var(--color-text-secondary)"
            >
              You already have paths set. Most users keep these settings.
            </p>
            <div
              class="text-xs"
              style="color: var(--color-text-muted)"
            >
              <div class="flex gap-2">
                <span class="font-semibold">DB</span>
                <span>{{ formState.databasePath }}</span>
              </div>
              <div class="flex gap-2">
                <span class="font-semibold">Assets</span>
                <span>{{ formState.assetDirPath }}</span>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <AppButton
              type="button"
              :loading="isSaving"
              @click="continueWithCurrent"
            >
              Use these settings
            </AppButton>
            <AppButton
              type="button"
              :disabled="isSaving"
              @click="showCustom"
            >
              Change paths
            </AppButton>
          </div>
        </div>

        <div
          v-if="mode === 'setup' && setupView === 'choice'"
          class="space-y-4 pb-4"
        >
          <div class="space-y-2">
            <h4
              class="text-sm font-semibold"
              style="color: var(--color-text-primary)"
            >
              Choose storage location
            </h4>
            <p
              class="text-xs"
              style="color: var(--color-text-secondary)"
            >
              You can use the default App Data location or choose custom paths.
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <AppButton
              type="button"
              @click="showDefault"
            >
              Use default (App Data)
            </AppButton>
            <AppButton
              type="button"
              @click="showCustom"
            >
              Choose custom paths
            </AppButton>
          </div>
        </div>

        <div
          v-if="mode === 'setup' && setupView === 'default'"
          class="space-y-4 pb-4"
        >
          <div class="space-y-2">
            <h4
              class="text-sm font-semibold"
              style="color: var(--color-text-primary)"
            >
              Default storage location
            </h4>
            <p
              class="text-xs"
              style="color: var(--color-text-secondary)"
            >
              App Data will be used for both the database and assets.
            </p>
            <div
              class="text-xs"
              style="color: var(--color-text-muted)"
            >
              <div>{{ formState.databasePath }}</div>
              <div>{{ formState.assetDirPath }}</div>
            </div>
          </div>

          <div
            v-if="databaseCandidates.length > 0 || assetCandidates.length > 0"
            class="space-y-2"
          >
            <h4
              class="text-sm font-semibold"
              style="color: var(--color-text-primary)"
            >
              Existing data detected
            </h4>
            <p
              class="text-xs"
              style="color: var(--color-text-secondary)"
            >
              Default paths already contain data. You can keep the default setting.
            </p>

            <div class="mt-3 space-y-3">
              <div v-if="databaseCandidates.length > 0">
                <p
                  class="text-xs font-semibold"
                  style="color: var(--color-text-secondary)"
                >
                  Database
                </p>
                <div class="mt-1 flex flex-wrap gap-2">
                  <span
                    v-for="path in databaseCandidates"
                    :key="path"
                    class="text-xs"
                    style="color: var(--color-text-muted)"
                  >
                    {{ path }}
                  </span>
                </div>
              </div>

              <div v-if="assetCandidates.length > 0">
                <p
                  class="text-xs font-semibold"
                  style="color: var(--color-text-secondary)"
                >
                  Assets
                </p>
                <div class="mt-1 flex flex-wrap gap-2">
                  <span
                    v-for="path in assetCandidates"
                    :key="path"
                    class="text-xs"
                    style="color: var(--color-text-muted)"
                  >
                    {{ path }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <AppButton
              type="button"
              :loading="isSaving"
              @click="continueWithCurrent"
            >
              Continue with default
            </AppButton>
            <AppButton
              type="button"
              :disabled="isSaving"
              @click="showCustom"
            >
              Choose custom paths
            </AppButton>
          </div>
        </div>

        <div
          v-if="mode === 'settings' || setupView === 'custom'"
          class="space-y-6"
        >
          <UFormField
            label="Database file"
            name="databasePath"
            description="Select the database file to use."
          >
            <div class="flex gap-2">
              <UInput
                v-model="formState.databasePath"
                class="flex-1"
                placeholder="/path/to/data.db"
              />
              <AppButton
                type="button"
                @click="selectDatabasePath"
              >
                Browse
              </AppButton>
            </div>
          </UFormField>

          <UFormField
            label="Asset folder"
            name="assetDirPath"
            description="Select the folder to store assets."
          >
            <div class="flex gap-2">
              <UInput
                v-model="formState.assetDirPath"
                class="flex-1"
                placeholder="/path/to/_assets"
              />
              <AppButton
                type="button"
                @click="selectAssetDir"
              >
                Browse
              </AppButton>
            </div>
          </UFormField>

          <div
            v-if="mode === 'setup' && recommendedPaths"
            class="flex flex-wrap gap-2"
          >
            <AppButton
              type="button"
              size="xs"
              @click="applyRecommended"
            >
              Use default paths
            </AppButton>
          </div>
        </div>

        <div
          v-if="mode === 'settings' || setupView === 'custom'"
          class="flex items-center gap-2"
        >
          <AppButton
            type="submit"
            :loading="isSaving"
          >
            {{ mode === 'setup' ? 'Save and Continue' : 'Save' }}
          </AppButton>
          <AppButton
            type="button"
            :disabled="isSaving"
            @click="resetForm"
          >
            Reset
          </AppButton>
        </div>

        <div
          v-if="savedOnce"
          class="flex items-center gap-2"
        >
          <AppButton
            type="button"
            @click="restartApp"
          >
            Restart now
          </AppButton>
          <span
            class="text-xs"
            style="color: var(--color-text-muted)"
          >
            Restart required to apply storage changes.
          </span>
        </div>
      </UForm>
    </div>

    <UModal v-model:open="showMissingDialog">
      <template #header>
        <h3 class="text-sm font-semibold">
          Paths not found
        </h3>
      </template>
      <template #body>
        <p
          class="text-sm"
          style="color: var(--color-text-secondary)"
        >
          One or more selected paths do not exist. Create them and save the configuration?
        </p>
        <p
          v-if="missingDetail"
          class="mt-2 text-xs"
          style="color: var(--color-text-muted)"
        >
          {{ missingDetail }}
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <AppButton
            @click="showMissingDialog = false"
          >
            Cancel
          </AppButton>
          <AppButton
            :loading="isSaving"
            @click="saveWithCreate"
          >
            Create and Save
          </AppButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { open } from '@tauri-apps/plugin-dialog';
import { relaunch } from '@tauri-apps/plugin-process';

import AppButton from '~/app/ui/AppButton.vue';
import LoadingSpinner from '~/app/ui/LoadingSpinner.vue';
import { command } from '~/external/tauri/command';
import { handleError } from '~/utils/error';

type FormState = {
  databasePath: string;
  assetDirPath: string;
};

type ValidationError = {
  path: keyof FormState;
  message: string;
};

const props = defineProps<{
  mode: 'setup' | 'settings';
}>();

const emit = defineEmits<{
  saved: [];
}>();

const toast = useToast();

const isLoading = ref(true);
const isSaving = ref(false);
const savedOnce = ref(false);
const showMissingDialog = ref(false);
const missingDetail = ref('');

const databaseCandidates = ref<string[]>([]);
const assetCandidates = ref<string[]>([]);
const recommendedPaths = ref<FormState | null>(null);
const setupView = ref<'existing' | 'choice' | 'default' | 'custom'>('choice');

const initialState = ref<FormState>({
  databasePath: '',
  assetDirPath: '',
});

const formState = reactive<FormState>({
  databasePath: '',
  assetDirPath: '',
});

const validate = (state: FormState): ValidationError[] => {
  const errors: ValidationError[] = [];
  if (!state.databasePath) {
    errors.push({ path: 'databasePath', message: 'Database path is required.' });
  }
  if (!state.assetDirPath) {
    errors.push({ path: 'assetDirPath', message: 'Asset directory is required.' });
  }
  return errors;
};

const loadConfig = async () => {
  isLoading.value = true;
  try {
    const config = await command.config.get();
    initialState.value = {
      databasePath: config.database_path,
      assetDirPath: config.asset_dir_path,
    };
    formState.databasePath = config.database_path;
    formState.assetDirPath = config.asset_dir_path;

    if (props.mode === 'setup') {
      const [candidates, defaults] = await Promise.all([
        command.config.detect(),
        command.config.defaults(),
      ]);
      databaseCandidates.value = candidates.database_paths;
      assetCandidates.value = candidates.asset_dir_paths;
      recommendedPaths.value = {
        databasePath: defaults.database_path,
        assetDirPath: defaults.asset_dir_path,
      };
      const hasConfigValues = config.database_path.length > 0 || config.asset_dir_path.length > 0;
      setupView.value = hasConfigValues ? 'existing' : 'choice';
    }
  }
  catch (error) {
    const appError = handleError(error);
    toast.add({
      title: 'Failed to load config.',
      description: appError.message,
      color: 'error',
    });
  }
  finally {
    isLoading.value = false;
  }
};

const resetForm = () => {
  formState.databasePath = initialState.value.databasePath;
  formState.assetDirPath = initialState.value.assetDirPath;
};

const applyRecommended = () => {
  if (!recommendedPaths.value) {
    return;
  }
  formState.databasePath = recommendedPaths.value.databasePath;
  formState.assetDirPath = recommendedPaths.value.assetDirPath;
};

const showDefault = () => {
  applyRecommended();
  setupView.value = 'default';
};

const showCustom = () => {
  setupView.value = 'custom';
};

const continueWithCurrent = async () => {
  await saveConfig(false);
};

const parseConfigError = (error: unknown) => {
  const appError = handleError(error);
  const [code, message] = appError.message.split(':', 2);
  return {
    code,
    message: message ?? appError.message,
  };
};

const saveConfig = async (createMissing: boolean) => {
  isSaving.value = true;
  try {
    await command.config.save({
      databasePath: formState.databasePath,
      assetDirPath: formState.assetDirPath,
      setupComplete: true,
      createMissing,
    });

    initialState.value = {
      databasePath: formState.databasePath,
      assetDirPath: formState.assetDirPath,
    };

    showMissingDialog.value = false;
    missingDetail.value = '';

    toast.add({
      title: 'Config saved.',
      description: 'Restart the app to apply changes.',
    });
    savedOnce.value = true;
    emit('saved');
  }
  catch (error) {
    const { code, message } = parseConfigError(error);
    if (code === 'DB_FILE_MISSING' || code === 'DB_PARENT_MISSING' || code === 'ASSET_DIR_MISSING') {
      missingDetail.value = message;
      showMissingDialog.value = true;
      return;
    }

    toast.add({
      title: 'Failed to save config.',
      description: message,
      color: 'error',
    });
  }
  finally {
    isSaving.value = false;
  }
};

const restartApp = async () => {
  try {
    await relaunch();
  }
  catch (error) {
    const appError = handleError(error);
    toast.add({
      title: 'Failed to restart.',
      description: appError.message,
      color: 'error',
    });
  }
};

const onSubmit = async () => {
  await saveConfig(false);
};

const saveWithCreate = async () => {
  await saveConfig(true);
};

const selectDatabasePath = async () => {
  const result = await open({
    multiple: false,
    directory: false,
  });
  if (typeof result === 'string') {
    formState.databasePath = result;
  }
};

const selectAssetDir = async () => {
  const result = await open({
    multiple: false,
    directory: true,
  });
  if (typeof result === 'string') {
    formState.assetDirPath = result;
  }
};

onMounted(loadConfig);
</script>
