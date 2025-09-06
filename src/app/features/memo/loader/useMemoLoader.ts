import { loadMemoData } from '~/composables/loadMemoData';

/**
 * Feature-scoped loader for memo page.
 * Wraps loadMemoData and centralizes 404 handling.
 */
export function useMemoLoader(workspaceSlug: string, memoSlug: string) {
  const { loading, error, ready } = loadMemoData(workspaceSlug, memoSlug);

  if (error.value) {
    showError({ statusCode: 404, statusMessage: 'Page not found', message: `Memo ${memoSlug} not found.` });
  }

  return { loading, error, ready };
}
