import type { AppEvent } from '../app-event';

type EventKey = Extract<keyof AppEvent, string>;
type Handler<K extends EventKey> = (payload: AppEvent[K]) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const listeners = new Map<EventKey, Set<Handler<any>>>();

export function emitEvent<K extends EventKey>(name: K, payload: AppEvent[K]): void {
  const set = listeners.get(name);

  if (!set) {
    return;
  }

  for (const fn of set) {
    (fn as Handler<K>)(payload);
  }
}

export function onEvent<K extends EventKey>(name: K, handler: Handler<K>): () => void {
  let set = listeners.get(name);

  if (!set) {
    set = new Set();
    listeners.set(name, set);
  }

  (set as Set<Handler<K>>).add(handler);

  return () => {
    const s = listeners.get(name) as Set<Handler<K>> | undefined;
    s?.delete(handler);

    if (s && s.size === 0) {
      listeners.delete(name);
    }
  };
}
