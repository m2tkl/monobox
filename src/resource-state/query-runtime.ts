import type { AppEvent } from './app-event';

type EventName = Extract<keyof AppEvent, string>;

type ActiveQuery = {
  event: EventName;
  matches: (payload: unknown) => boolean;
  refetch: () => Promise<unknown>;
};

const activeQueries = new Map<EventName, Set<ActiveQuery>>();

export function registerActiveQuery<K extends EventName>(query: {
  event: K;
  matches: (payload: AppEvent[K]) => boolean;
  refetch: () => Promise<unknown>;
}): () => void {
  let queries = activeQueries.get(query.event);
  if (!queries) {
    queries = new Set<ActiveQuery>();
    activeQueries.set(query.event, queries);
  }

  const entry: ActiveQuery = {
    event: query.event,
    matches: payload => query.matches(payload as AppEvent[K]),
    refetch: query.refetch,
  };

  queries.add(entry);

  return () => {
    const current = activeQueries.get(query.event);
    current?.delete(entry);
    if (current && current.size === 0) {
      activeQueries.delete(query.event);
    }
  };
}

export async function invalidateByEvent<K extends EventName>(
  event: K,
  payload: AppEvent[K],
): Promise<void> {
  const queries = activeQueries.get(event);
  if (!queries || queries.size === 0) {
    return;
  }

  const tasks: Array<Promise<unknown>> = [];

  for (const query of queries) {
    if (query.matches(payload)) {
      tasks.push(query.refetch());
    }
  }

  await Promise.allSettled(tasks);
}
