import { computed } from 'vue';

import { CREATED_QUERY_SOURCE_BLANK, CREATED_QUERY_SOURCE_NAMED } from '../../createdQuery';

import type { Ref } from 'vue';
import type { MemoTemplateIndexItem } from '~/models/memoTemplate';

import { getDefaultMemoTemplate } from '~/features/memo-templates';

export type TemplateStartIntent =
  | { type: 'idle' }
  | { type: 'show-template-picker' }
  | { type: 'skip-default-template' }
  | { type: 'requested-template'; templateSlug: string }
  | { type: 'default-template'; templateSlug: string };

type UseTemplateStartIntentOptions = {
  route: {
    query: Record<string, unknown>;
  };
  availableTemplates: Ref<MemoTemplateIndexItem[]>;
};

/**
 * Computes the single start intent that MemoEditing uses to decide what the
 * "new memo from template" entry should do on first load.
 */
export function useTemplateStartIntent(options: UseTemplateStartIntentOptions) {
  const createdQueryValue = computed(() =>
    typeof options.route.query.created === 'string'
      ? options.route.query.created
      : undefined,
  );

  // Used by MemoEditing to focus the title only for blank-memo creation.
  const shouldFocusNewMemoTitle = computed(() => createdQueryValue.value === CREATED_QUERY_SOURCE_BLANK);

  // Used by MemoEditing/useTemplateApply as the single source of truth for the
  // initial template-start behavior.
  const startIntent = computed<TemplateStartIntent>(() => {
    const isNewMemoCreationFlow = createdQueryValue.value === CREATED_QUERY_SOURCE_BLANK
      || createdQueryValue.value === CREATED_QUERY_SOURCE_NAMED;
    if (!isNewMemoCreationFlow) {
      return { type: 'idle' };
    }

    const requestedTemplateSlug = typeof options.route.query.template === 'string'
      ? options.route.query.template
      : undefined;
    if (requestedTemplateSlug) {
      return { type: 'requested-template', templateSlug: requestedTemplateSlug };
    }

    if (options.route.query.skipDefaultTemplate === 'true') {
      return { type: 'skip-default-template' };
    }

    const defaultTemplate = getDefaultMemoTemplate(options.availableTemplates.value);
    if (defaultTemplate) {
      return { type: 'default-template', templateSlug: defaultTemplate.slug_name };
    }

    if (options.availableTemplates.value.length > 0) {
      return { type: 'show-template-picker' };
    }

    return { type: 'idle' };
  });

  return {
    startIntent,
    shouldFocusNewMemoTitle,
  };
}
