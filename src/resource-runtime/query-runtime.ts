import { broadcastResourceChanges } from './resource-events';

import type { ChangeRef } from '~/resources/changes';

import { resolveAffectedResources } from '~/resources/affects';
import { serializeResourceRef, type ResourceRef } from '~/resources/refs';

type ActiveQuery = {
  resource: string;
  refetch: () => Promise<unknown>;
};

const activeQueries = new Map<string, Set<ActiveQuery>>();

export function registerActiveQuery(query: {
  resources: ReadonlyArray<ResourceRef>;
  refetch: () => Promise<unknown>;
}): () => void {
  const entries: Array<{ resource: string; query: ActiveQuery }> = [];

  for (const resource of query.resources) {
    const serializedResource = serializeResourceRef(resource);
    let queries = activeQueries.get(serializedResource);
    if (!queries) {
      queries = new Set<ActiveQuery>();
      activeQueries.set(serializedResource, queries);
    }

    const entry: ActiveQuery = {
      resource: serializedResource,
      refetch: query.refetch,
    };

    queries.add(entry);
    entries.push({ resource: serializedResource, query: entry });
  }

  return () => {
    for (const entry of entries) {
      const current = activeQueries.get(entry.resource);
      current?.delete(entry.query);
      if (current && current.size === 0) {
        activeQueries.delete(entry.resource);
      }
    }
  };
}

type PublishResourceChangesOptions = {
  notifyOtherWindows?: boolean;
};

export async function publishResourceChanges(
  changes: ReadonlyArray<ChangeRef>,
  { notifyOtherWindows = true }: PublishResourceChangesOptions = {},
): Promise<void> {
  const impactedResources = resolveAffectedResources(changes);
  const tasks: Array<Promise<unknown>> = [];
  const scheduled = new Set<ActiveQuery>();

  for (const resource of impactedResources) {
    const queries = activeQueries.get(serializeResourceRef(resource));
    if (!queries || queries.size === 0) {
      continue;
    }

    for (const query of queries) {
      if (scheduled.has(query)) {
        continue;
      }
      scheduled.add(query);
      tasks.push(query.refetch());
    }
  }

  await Promise.allSettled(tasks);

  if (notifyOtherWindows) {
    await broadcastResourceChanges(changes);
  }
}
