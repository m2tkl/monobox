import { computed } from 'vue';

import { CREATED_QUERY_SOURCE_BLANK, CREATED_QUERY_SOURCE_NAMED } from '../../createdQuery';

type UseNewMemoTemplateQueryOptions = {
  route: {
    query: Record<string, unknown>;
  };
};

/**
 * Exposes query-derived values that MemoEditing uses to decide whether the
 * current page load should behave as a "start from template" entry.
 */
export function useNewMemoTemplateQuery(options: UseNewMemoTemplateQueryOptions) {
  // Used by MemoEditing to decide whether title autofocus should run for a
  // just-created blank memo.
  const createdQueryValue = computed(() =>
    typeof options.route.query.created === 'string'
      ? options.route.query.created
      : undefined,
  );

  // Used by template-application logic to limit template handling to the new
  // memo entry flow.
  const isNewMemoCreationFlow = computed(() =>
    createdQueryValue.value === CREATED_QUERY_SOURCE_BLANK
    || createdQueryValue.value === CREATED_QUERY_SOURCE_NAMED,
  );

  // Used by template-application logic to auto-apply a requested template from
  // the route query.
  const requestedTemplateSlug = computed(() =>
    typeof options.route.query.template === 'string'
      ? options.route.query.template
      : undefined,
  );

  // Used by template-application logic to skip the default template branch
  // when the user explicitly opted out.
  const shouldSkipDefaultTemplate = computed(() => options.route.query.skipDefaultTemplate === 'true');

  return {
    createdQueryValue,
    isNewMemoCreationFlow,
    requestedTemplateSlug,
    shouldSkipDefaultTemplate,
  };
}
