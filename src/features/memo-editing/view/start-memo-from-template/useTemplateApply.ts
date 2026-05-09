import { computed, nextTick, ref, watch } from 'vue';

import type { Editor } from '@tiptap/core';
import type { Ref, ComputedRef } from 'vue';
import type { RouteLocationNormalizedLoaded, Router, LocationQueryRaw } from 'vue-router';
import type { MemoTemplateIndexItem } from '~/models/memoTemplate';

import { fetchMemoTemplate, getDefaultMemoTemplate, parseTemplateContent } from '~/features/memo-templates';

type UseTemplateApplyOptions = {
  editor: Ref<Editor | undefined>;
  hasMemo: ComputedRef<boolean>;
  workspaceSlug: Ref<string>;
  route: RouteLocationNormalizedLoaded;
  router: Router;
  availableTemplates: Ref<MemoTemplateIndexItem[]>;
  isNewMemoCreationFlow: ComputedRef<boolean>;
  requestedTemplateSlug: ComputedRef<string | undefined>;
  shouldSkipDefaultTemplate: ComputedRef<boolean>;
  clearCreatedQueryFlag: () => Promise<void>;
  focusTitleFieldForNewMemo: () => void;
  toast: ReturnType<typeof useToast>;
  logger: { error: (error: unknown) => void };
};

/**
 * Drives the start-from-template UI in MemoEditing: it decides when to apply a
 * requested/default template and exposes the state that the inline template UI
 * uses while the apply action is running.
 */
export function useTemplateApply(options: UseTemplateApplyOptions) {
  const hasAttemptedDefaultTemplate = ref(false);
  const isTemplatePickerDismissed = ref(false);

  // Used by the inline template buttons in MemoEditing to disable repeated
  // clicks and show a loading indicator while a template is being applied.
  const isApplyingTemplate = ref(false);

  // Used by the inline template buttons in MemoEditing to show which template
  // is currently being applied.
  const selectedTemplateId = ref<number>();
  const hasDefaultMemoTemplate = computed(() => getDefaultMemoTemplate(options.availableTemplates.value) != null);
  const shouldShowTemplatePicker = computed(() =>
    options.isNewMemoCreationFlow.value
    && !isTemplatePickerDismissed.value
    && !options.shouldSkipDefaultTemplate.value
    && options.requestedTemplateSlug.value == null
    && !hasDefaultMemoTemplate.value
    && options.availableTemplates.value.length > 0,
  );
  const isEditorBodyEmpty = computed(() => Boolean(options.editor.value?.isEmpty));
  const shouldShowInlineTemplateSuggestions = computed(() =>
    shouldShowTemplatePicker.value && isEditorBodyEmpty.value,
  );

  // Used by MemoEditing's inline template buttons to apply the chosen template
  // into the editor body.
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

      isTemplatePickerDismissed.value = true;
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
      || isTemplatePickerDismissed.value
      || !options.isNewMemoCreationFlow.value
      || isApplyingTemplate.value
    ) {
      return;
    }

    isTemplatePickerDismissed.value = true;
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
      if (hasAttemptedDefaultTemplate.value) {
        return;
      }

      if (!options.isNewMemoCreationFlow.value) {
        return;
      }

      if (!options.editor.value) {
        return;
      }

      if (templateSlug) {
        hasAttemptedDefaultTemplate.value = true;
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
          isTemplatePickerDismissed.value = false;
        }
        return;
      }

      if (skipDefaultTemplate) {
        hasAttemptedDefaultTemplate.value = true;
        isTemplatePickerDismissed.value = true;
        await options.clearCreatedQueryFlag();
        options.focusTitleFieldForNewMemo();
        return;
      }

      const defaultTemplate = getDefaultMemoTemplate(options.availableTemplates.value);
      if (!defaultTemplate) {
        hasAttemptedDefaultTemplate.value = true;
        return;
      }

      hasAttemptedDefaultTemplate.value = true;
      await applyTemplate(defaultTemplate.slug_name, { toastTitle: 'Default template applied' });
    },
    { immediate: true },
  );

  return {
    // Consumed by MemoEditing to control the inline template button loading
    // state.
    isApplyingTemplate,

    // Consumed by MemoEditing to mark the specific template button that is in
    // progress.
    selectedTemplateId,

    // Consumed by MemoEditing to decide whether to render the inline template
    // suggestion block under the editor.
    shouldShowInlineTemplateSuggestions,

    // Consumed by MemoEditing when the user clicks a template suggestion.
    applyTemplate,
  };
}
