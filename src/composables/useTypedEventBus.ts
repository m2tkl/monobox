import type { EventPayloads } from '~/types/event-types';

type EventMap = EventPayloads;
type EventKey = keyof EventMap;

const listeners = new Map<string, Set<(payload: unknown) => void>>();
const logger = useConsoleLogger('Event');

/**
 * Emits an event with the given name and payload,
 * invoking all registered listeners for that event.
 *
 * @param name - The name of the event to emit.
 * @param payload - The payload associated with the event.
 */
export function emitEvent<K extends EventKey>(
  name: K,
  payload: EventMap[K],
) {
  logger.log(`${name} emitted.`, payload);
  listeners.get(name)?.forEach(fn => fn(payload));
}

/**
 * Registers a handler function for the specified event name.
 * The handler will be called whenever the event is emitted.
 * The handler is automatically removed when the component is unmounted.
 *
 * @param name - The name of the event to listen for.
 * @param handler - The function to call when the event is emitted.
 */
export function onEvent<K extends EventKey>(
  name: K,
  handler: (payload: EventMap[K]) => void,
) {
  if (!listeners.has(name)) {
    listeners.set(name, new Set());
    logger.log(`${name} is registered.`);
  }
  (listeners.get(name) as Set<(payload: EventMap[K]) => void>).add(handler);

  onUnmounted(() => {
    (listeners.get(name) as Set<(payload: EventMap[K]) => void>)?.delete(handler);
  });
}
