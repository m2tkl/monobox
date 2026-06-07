import { emit, listen } from '@tauri-apps/api/event';

import type { UnlistenFn } from '@tauri-apps/api/event';
import type { ChangeRef } from '~/resources/changes';

const RESOURCE_CHANGES_EVENT = 'monobox:resource:changes';
const originId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

type ResourceChangesPayload = {
  originId: string;
  changes: ChangeRef[];
};

// This adapter is evaluated outside the Tauri WebView in SSR/dev tooling/tests.
// Treat non-Tauri runtimes as no-op instead of letting Tauri-specific IPC leak out.
function isRunningInTauri() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

function isResourceChangesPayload(payload: unknown): payload is ResourceChangesPayload {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as Partial<ResourceChangesPayload>;
  return typeof candidate.originId === 'string' && Array.isArray(candidate.changes);
}

export async function broadcastResourceChanges(changes: ReadonlyArray<ChangeRef>): Promise<void> {
  if (!isRunningInTauri()) {
    return;
  }

  await emit<ResourceChangesPayload>(RESOURCE_CHANGES_EVENT, {
    originId,
    changes: [...changes],
  });
}

export async function listenResourceChanges(
  handler: (changes: ReadonlyArray<ChangeRef>) => Promise<void> | void,
): Promise<UnlistenFn | null> {
  if (!isRunningInTauri()) {
    return null;
  }

  return listen<ResourceChangesPayload>(RESOURCE_CHANGES_EVENT, async (event) => {
    if (!isResourceChangesPayload(event.payload) || event.payload.originId === originId) {
      return;
    }

    await handler(event.payload.changes);
  });
}
