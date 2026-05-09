import type { LocationQueryRaw, Router } from 'vue-router';

type ClearNewMemoTemplateQueryInput = {
  route: {
    path: string;
    hash: string;
    query: Record<string, unknown>;
  };
  router: Router;
};

/**
 * Used by MemoEditing/start-from-template flows after handling `created`,
 * `template`, or `skipDefaultTemplate` query params so the page does not repeat
 * the same start-up behavior on the next render.
 */
export async function clearNewMemoTemplateQuery(input: ClearNewMemoTemplateQueryInput) {
  const {
    created: _created,
    template: _template,
    skipDefaultTemplate: _skipDefaultTemplate,
    ...nextQuery
  } = input.route.query;

  const normalizedQuery: LocationQueryRaw = {};
  for (const [key, value] of Object.entries(nextQuery)) {
    normalizedQuery[key] = value as string | string[] | null | undefined;
  }

  await input.router.replace({
    path: input.route.path,
    query: normalizedQuery,
    hash: input.route.hash,
  });
}
