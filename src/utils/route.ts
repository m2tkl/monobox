import { encodeForSlug } from './slug';

import type { RouteLocationNormalizedLoaded, RouteRecordNormalized } from 'vue-router';

/**
 * Background / Rationale
 *
 * - Vue Router exposes `route.params` as URL-decoded values (e.g., `Hello%20World` → `Hello World`).
 * - Many parts of this app expect slug strings (spaces become `_`, reserved symbols percent-encoded) when
 *   building API paths or identifiers.
 * - We previously introduced `getEncodedParamFromPath` to extract an already-encoded segment from `route.path`,
 *   but differences in path representation when navigating via browser back/forward made this approach brittle
 *   and led to "page not found" issues in certain cases.
 *
 * Current approach:
 * - Always start from `route.params` and apply `encodeForSlug` right before use to normalize to slug form.
 * - This avoids discrepancies caused by navigation history and ensures callers always receive the expected slug.
 * - Prefer using `getEncodedParamsFromRoute()` to retrieve encoded `workspace` / `memo` slugs.
 */

/**
 * @deprecated
 * Kept for backward compatibility. Prefer `getEncodedParamsFromRoute` for new code.
 * This relies on `route.path` and may be affected by path representation differences
 * when navigating via browser history (e.g., appearing re-encoded).
 *
 * ---
 *
 * Get the encoded value of a dynamic param from the current `route.path`.
 *
 * Vue Router decodes `route.params`, so use this when you need the
 * original percent-encoded segment (e.g., to call APIs that expect
 * an already-encoded slug).
 *
 * Example:
 *   path: "/workspace-slug/Hello%20World" with route meta path "/:workspace/:memo"
 *   getEncodedParamFromPath(route, 'memo') => "Hello%20World"
 */
export function getEncodedParamFromPath(
  route: RouteLocationNormalizedLoaded,
  paramName: string,
): string | undefined {
  if (!route?.path || !route?.matched?.length) return undefined;

  // Use the deepest matched record (the current page component)
  const record: RouteRecordNormalized | undefined = route.matched[route.matched.length - 1];
  if (!record?.path) return undefined;

  const actualSegs = route.path.split('/').filter(Boolean);
  const patternSegs = record.path.split('/').filter(Boolean);

  // Find the index of the requested param in the route pattern
  const idx = patternSegs.findIndex((seg) => {
    if (!seg.startsWith(':')) return false;
    // Remove leading ':' and any modifiers or custom regex
    // e.g. ":memo", ":memo?", ":memo(.*)*" => name "memo"
    const nameWithRest = seg.slice(1);
    const name = nameWithRest.split(/[?(+*]/)[0];
    return name === paramName;
  });

  if (idx === -1) return undefined;

  // Align from the end to be robust to nested routes
  const offsetFromEnd = patternSegs.length - 1 - idx;
  const targetIndex = actualSegs.length - 1 - offsetFromEnd;
  if (targetIndex < 0 || targetIndex >= actualSegs.length) return undefined;

  return actualSegs[targetIndex];
}

/** Convenience accessors for common params (delegates to params-based API) */
export const getEncodedMemoSlugFromPath = (route: RouteLocationNormalizedLoaded) =>
  getEncodedParamsFromRoute(route).memo;

export const getEncodedWorkspaceSlugFromPath = (route: RouteLocationNormalizedLoaded) =>
  getEncodedParamsFromRoute(route).workspace;

/**
 * Return encoded slugs derived from `route.params`.
 *
 * Rationale:
 * - Vue Router decodes `route.params` by design.
 * - Callers expect already-encoded slug strings (to build API paths, etc.).
 * - Therefore we re-encode params using our domain-specific `encodeForSlug`.
 */
export function getEncodedParamsFromRoute(route: RouteLocationNormalizedLoaded): {
  workspace?: string;
  memo?: string;
} {
  const workspaceParam = route?.params?.workspace as string | undefined;
  const memoParam = route?.params?.memo as string | undefined;

  return {
    workspace: workspaceParam ? encodeForSlug(workspaceParam) : undefined,
    memo: memoParam ? encodeForSlug(memoParam) : undefined,
  };
}
