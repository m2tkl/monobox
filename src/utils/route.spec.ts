import { describe, it, expect } from 'vitest';

import { getEncodedMemoSlugFromPath, getEncodedWorkspaceSlugFromPath, getEncodedParamsFromRoute } from './route';

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

describe('getEncodedParamsFromRoute', () => {
  it('encodes memo and workspace from params', () => {
    const route = makeRoute('/ws/Hello_World', '/:workspace/:memo', { workspace: 'ws', memo: 'Hello World' });
    const { workspace, memo } = getEncodedParamsFromRoute(route);
    expect(workspace).toBe('ws');
    expect(memo).toBe('Hello_World');
  });

  it('applies symbol encoding for memo', () => {
    const route = makeRoute('/my-ws/Note%23One', '/:workspace/:memo', { workspace: 'my-ws', memo: 'Note#One' });
    const { workspace, memo } = getEncodedParamsFromRoute(route);
    expect(workspace).toBe('my-ws');
    expect(memo).toBe('Note%23One');
  });

  it('supports optional param values', () => {
    const route = makeRoute('/ws/Note%3F', '/:workspace/:memo?', { workspace: 'ws', memo: 'Note?' });
    const { memo } = getEncodedParamsFromRoute(route);
    expect(memo).toBe('Note%3F');
  });

  it('returns undefined when param missing', () => {
    const route = makeRoute('/ws', '/:workspace', { workspace: 'ws' });
    const { memo } = getEncodedParamsFromRoute(route);
    expect(memo).toBeUndefined();
  });

  it('shortcut helpers return encoded strings', () => {
    const route = makeRoute('/my-ws/こんにちは_世界', '/:workspace/:memo', { workspace: 'my-ws', memo: 'こんにちは 世界' });
    expect(getEncodedWorkspaceSlugFromPath(route)).toBe('my-ws');
    expect(getEncodedMemoSlugFromPath(route)).toBe('こんにちは_世界');
  });
});
