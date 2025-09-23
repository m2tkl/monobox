import type { RouteLocationNormalizedLoaded, RouteRecordNormalized } from 'vue-router';

/**
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

/** Convenience accessor for common params */
export const getEncodedMemoSlugFromPath = (route: RouteLocationNormalizedLoaded) =>
  getEncodedParamFromPath(route, 'memo');

export const getEncodedWorkspaceSlugFromPath = (route: RouteLocationNormalizedLoaded) =>
  getEncodedParamFromPath(route, 'workspace');
