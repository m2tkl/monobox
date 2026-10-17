import { afterEach, describe, expect, it, vi } from 'vitest';

import { openSearchLauncher, registerSearchLauncher } from './searchLauncher';

describe('searchLauncher', () => {
  let unregister: (() => void) | null = null;

  afterEach(() => {
    unregister?.();
    unregister = null;
  });

  it('forwards the requested tab destination to the registered palette', () => {
    const open = vi.fn();
    unregister = registerSearchLauncher(open);

    openSearchLauncher({ destination: 'new-tab' });

    expect(open).toHaveBeenCalledWith({ destination: 'new-tab' });
  });
});
