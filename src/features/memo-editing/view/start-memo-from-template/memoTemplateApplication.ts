import { computed, nextTick, ref, watch } from 'vue';

import type { Editor } from '@tiptap/core';
import type { Ref, ComputedRef } from 'vue';
import type { RouteLocationNormalizedLoaded, Router, LocationQueryRaw } from 'vue-router';
import type { MemoTemplateIndexItem } from '~/models/memoTemplate';

import { fetchMemoTemplate, getDefaultMemoTemplate, parseTemplateContent } from '~/features/memo-templates';

type UseMemoTemplateApplicationOptions = {
  editor: Ref<Editor | undefined>;
  hasMemo: ComputedRef<boolean>;
  workspaceSlug: Ref<string>;
  route: RouteLocationNormalizedLoaded;
  router: Router;
  availableTemplates: Ref<MemoTemplateIndexItem[]>;
  isTemplatePickerDismissed: Ref<boolean>;
  hasAttemptedDefaultTemplate: Ref<boolean>;
  isNewMemoCreationFlow: ComputedRef<boolean>;
  requestedTemplateSlug: ComputedRef<string | undefined>;
  shouldSkipDefaultTemplate: ComputedRef<boolean>;
  shouldShowTemplatePicker: ComputedRef<boolean>;
  clearCreatedQueryFlag: () => Promise<void>;
  focusTitleFieldForNewMemo: () => void;
  toast: ReturnType<typeof useToast>;
  logger: { error: (error: unknown) => void };
};

export function useMemoTemplateApplication(options: UseMemoTemplateApplicationOptions) {
  const isApplyingTemplate = ref(false);
  const selectedTemplateId = ref<number>();
  const isEditorBodyEmpty = computed(() => Boolean(options.editor.value?.isEmpty));
  const shouldShowInlineTemplateSuggestions = computed(() =>
    options.shouldShowTemplatePicker.value && isEditorBodyEmpty.value,
  );

  const applyTemplate = async (templateSlug: string, applyOptions?: { toastTitle?: string }) => {
    if (!options.editor.value || !options.hasMemo.value) {
      return false;
    }

    isApplyingTemplate.value = true;

    try {
      const templateMemo = await fetchMemoTemplate({
        workspaceSlug: options.workspaceSlug.value,
        templateSlug,
      });
      options.editor.value.commands.setContent(parseTemplateContent(templateMemo));
      const templateId = templateMemo.id;
      selectedTemplateId.value = templateId;
      await nextTick();

      options.isTemplatePickerDismissed.value = true;
      await options.clearCreatedQueryFlag();
      options.toast.add({
        title: applyOptions?.toastTitle ?? 'Template applied',
        icon: iconKey.success,
        duration: 1000,
      });
      return true;
    }
    catch (error) {
      options.logger.error(error);
      options.toast.add({
        title: 'Failed to apply template',
        description: 'Please try again',
        color: 'error',
        icon: iconKey.failed,
      });
      return false;
    }
    finally {
      isApplyingTemplate.value = false;
      selectedTemplateId.value = undefined;
    }
  };

  watch(isEditorBodyEmpty, async (isEmpty) => {
    if (
      isEmpty
      || options.isTemplatePickerDismissed.value
      || !options.isNewMemoCreationFlow.value
      || isApplyingTemplate.value
    ) {
      return;
    }

    options.isTemplatePickerDismissed.value = true;
    await options.clearCreatedQueryFlag();
  });

  watch(
    [
      options.isNewMemoCreationFlow,
      options.requestedTemplateSlug,
      options.shouldSkipDefaultTemplate,
      options.availableTemplates,
      options.editor,
    ],
    async ([, templateSlug, skipDefaultTemplate]) => {
      if (options.hasAttemptedDefaultTemplate.value) {
        return;
      }

      if (!options.isNewMemoCreationFlow.value) {
        return;
      }

      if (!options.editor.value) {
        return;
      }

      if (templateSlug) {
        options.hasAttemptedDefaultTemplate.value = true;
        const isApplied = await applyTemplate(templateSlug);
        if (!isApplied) {
          const { template: _template, ...nextQuery } = options.route.query;
          const normalizedQuery: LocationQueryRaw = {};
          for (const [key, value] of Object.entries(nextQuery)) {
            normalizedQuery[key] = value as string | string[] | null | undefined;
          }
          await options.router.replace({
            path: options.route.path,
            query: normalizedQuery,
            hash: options.route.hash,
          });
          options.isTemplatePickerDismissed.value = false;
        }
        return;
      }

      if (skipDefaultTemplate) {
        options.hasAttemptedDefaultTemplate.value = true;
        options.isTemplatePickerDismissed.value = true;
        await options.clearCreatedQueryFlag();
        options.focusTitleFieldForNewMemo();
        return;
      }

      const defaultTemplate = getDefaultMemoTemplate(options.availableTemplates.value);
      if (!defaultTemplate) {
        options.hasAttemptedDefaultTemplate.value = true;
        return;
      }

      options.hasAttemptedDefaultTemplate.value = true;
      await applyTemplate(defaultTemplate.slug_name, { toastTitle: 'Default template applied' });
    },
    { immediate: true },
  );

  return {
    isApplyingTemplate,
    selectedTemplateId,
    shouldShowInlineTemplateSuggestions,
    applyTemplate,
  };
}
