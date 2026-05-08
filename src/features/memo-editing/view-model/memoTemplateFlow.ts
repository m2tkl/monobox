import { computed, nextTick, ref } from 'vue';

import { CREATED_QUERY_SOURCE_BLANK, CREATED_QUERY_SOURCE_NAMED } from '../createdQuery';
import { getDefaultMemoTemplate } from '../views/template/template';

import type { Ref } from 'vue';
import type { LocationQueryRaw, Router } from 'vue-router';
import type { MemoTemplateIndexItem } from '~/models/memoTemplate';

type UseMemoTemplateFlowOptions = {
  route: {
    path: string;
    hash: string;
    query: Record<string, unknown>;
  };
  router: Router;
  availableTemplates: Ref<MemoTemplateIndexItem[]>;
};

export function useMemoTemplateFlow(options: UseMemoTemplateFlowOptions) {
  const isTemplatePickerDismissed = ref(false);
  const hasAttemptedDefaultTemplate = ref(false);

  const createdQueryValue = computed(() =>
    typeof options.route.query.created === 'string'
      ? options.route.query.created
      : undefined,
  );
  const isNewMemoCreationFlow = computed(() =>
    createdQueryValue.value === CREATED_QUERY_SOURCE_BLANK
    || createdQueryValue.value === CREATED_QUERY_SOURCE_NAMED,
  );
  const requestedTemplateSlug = computed(() =>
    typeof options.route.query.template === 'string'
      ? options.route.query.template
      : undefined,
  );
  const shouldSkipDefaultTemplate = computed(() => options.route.query.skipDefaultTemplate === 'true');
  const hasDefaultMemoTemplate = computed(() => getDefaultMemoTemplate(options.availableTemplates.value) != null);
  const shouldShowTemplatePicker = computed(() =>
    isNewMemoCreationFlow.value
    && !isTemplatePickerDismissed.value
    && !shouldSkipDefaultTemplate.value
    && requestedTemplateSlug.value == null
    && !hasDefaultMemoTemplate.value
    && options.availableTemplates.value.length > 0,
  );

  async function clearCreatedQueryFlag() {
    if (
      createdQueryValue.value == null
      && requestedTemplateSlug.value == null
      && !shouldSkipDefaultTemplate.value
    ) {
      return;
    }

    const {
      created: _created,
      template: _template,
      skipDefaultTemplate: _skipDefaultTemplate,
      ...nextQuery
    } = options.route.query;
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

  function focusTitleFieldIfNeeded(
    focusTitleField: (selectAll?: boolean) => void,
  ) {
    if (createdQueryValue.value !== CREATED_QUERY_SOURCE_BLANK) {
      return;
    }

    nextTick(() => {
      window.setTimeout(() => {
        focusTitleField(true);
      }, 50);
    });
  }

  return {
    isTemplatePickerDismissed,
    hasAttemptedDefaultTemplate,
    createdQueryValue,
    isNewMemoCreationFlow,
    requestedTemplateSlug,
    shouldSkipDefaultTemplate,
    hasDefaultMemoTemplate,
    shouldShowTemplatePicker,
    clearCreatedQueryFlag,
    focusTitleFieldIfNeeded,
  };
}
