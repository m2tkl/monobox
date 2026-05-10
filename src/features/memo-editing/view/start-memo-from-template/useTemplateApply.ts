import { computed, nextTick, ref, watch } from 'vue';

import type { TemplateStartIntent } from './useTemplateStartIntent';
import type { Editor } from '@tiptap/core';
import type { Ref, ComputedRef } from 'vue';
import type { RouteLocationNormalizedLoaded, Router, LocationQueryRaw } from 'vue-router';
import type { MemoTemplateIndexItem } from '~/models/memoTemplate';

import { fetchMemoTemplate, parseTemplateContent } from '~/features/memo-templates';

type UseTemplateApplyOptions = {
  editor: Ref<Editor | undefined>;
  hasMemo: ComputedRef<boolean>;
  workspaceSlug: Ref<string>;
  route: RouteLocationNormalizedLoaded;
  router: Router;
  availableTemplates: Ref<MemoTemplateIndexItem[]>;
  startIntent: ComputedRef<TemplateStartIntent>;
  clearTemplateStartQuery: () => Promise<void>;
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
  const isTemplatePickerDismissed = ref(false);
  const handledStartIntentKey = ref<string>();

  // Used by the inline template buttons in MemoEditing to disable repeated
  // clicks and show a loading indicator while a template is being applied.
  const isApplyingTemplate = ref(false);

  // Used by the inline template buttons in MemoEditing to show which template
  // is currently being applied.
  const selectedTemplateId = ref<number>();
  const shouldShowTemplatePicker = computed(() =>
    options.startIntent.value.type === 'show-template-picker'
    && !isTemplatePickerDismissed.value
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
      await options.clearTemplateStartQuery();
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
      || options.startIntent.value.type !== 'show-template-picker'
      || isApplyingTemplate.value
    ) {
      return;
    }

    isTemplatePickerDismissed.value = true;
    await options.clearTemplateStartQuery();
  });

  const startIntentKey = computed(() => {
    const intent = options.startIntent.value;

    if (intent.type === 'requested-template' || intent.type === 'default-template') {
      return `${intent.type}:${intent.templateSlug}`;
    }

    return intent.type;
  });

  watch(
    [
      options.startIntent,
      startIntentKey,
      options.editor,
    ],
    async ([intent, intentKey]) => {
      if (handledStartIntentKey.value === intentKey) {
        return;
      }

      if (!options.editor.value) {
        return;
      }

      if (intent.type === 'requested-template') {
        handledStartIntentKey.value = intentKey;
        const isApplied = await applyTemplate(intent.templateSlug);
        if (!isApplied) {
          handledStartIntentKey.value = undefined;
          isTemplatePickerDismissed.value = false;
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
        }
        return;
      }

      if (intent.type === 'skip-default-template') {
        handledStartIntentKey.value = intentKey;
        isTemplatePickerDismissed.value = true;
        await options.clearTemplateStartQuery();
        options.focusTitleFieldForNewMemo();
        return;
      }

      if (intent.type === 'default-template') {
        handledStartIntentKey.value = intentKey;
        await applyTemplate(intent.templateSlug, { toastTitle: 'Default template applied' });
        return;
      }

      if (intent.type === 'show-template-picker') {
        return;
      }

      if (intent.type === 'idle') {
        handledStartIntentKey.value = intentKey;
        return;
      }

      const _exhaustiveCheck: never = intent;
      void _exhaustiveCheck;
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
