import { describe, it, expect } from 'vitest';

import { getEncodedParamFromPath, getEncodedMemoSlugFromPath, getEncodedWorkspaceSlugFromPath } from './route';

import type { RouteLocationNormalizedLoaded } from 'vue-router';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeRoute = (path: string, pattern: string, params: Record<string, any> = {}): RouteLocationNormalizedLoaded => {
  return {
    path,
    params,
    hash: '',
    fullPath: path,
    name: undefined,
    query: {},
    redirectedFrom: undefined,
    meta: {},
    matched: [
      {
        path: pattern,
        meta: {},
        components: {},
        instances: {},
        name: undefined,
        props: {},
        children: [],
        aliasOf: undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    ],
  } as unknown as RouteLocationNormalizedLoaded;
};

describe('getEncodedParamFromPath', () => {
  it('extracts encoded memo slug from simple pattern', () => {
    const route = makeRoute('/ws/Hello%20World', '/:workspace/:memo', { workspace: 'ws', memo: 'Hello World' });
    expect(getEncodedParamFromPath(route, 'memo')).toBe('Hello%20World');
    expect(getEncodedMemoSlugFromPath(route)).toBe('Hello%20World');
  });

  it('extracts encoded workspace slug from simple pattern', () => {
    const route = makeRoute('/my-ws/Note%23One', '/:workspace/:memo', { workspace: 'my-ws', memo: 'Note#One' });
    expect(getEncodedParamFromPath(route, 'workspace')).toBe('my-ws');
    expect(getEncodedWorkspaceSlugFromPath(route)).toBe('my-ws');
  });

  it('works with optional param modifiers', () => {
    const route = makeRoute('/ws/Note%3F', '/:workspace/:memo?', { workspace: 'ws', memo: 'Note?' });
    expect(getEncodedParamFromPath(route, 'memo')).toBe('Note%3F');
  });

  it('returns undefined if param not found', () => {
    const route = makeRoute('/ws/abc', '/:workspace/:memo', { workspace: 'ws', memo: 'abc' });
    expect(getEncodedParamFromPath(route, 'missing')).toBeUndefined();
  });
});
