import { onEvent } from './eventBus';

import type { AppEvent } from '../app-event';

export type Rule<E extends AppEvent, K extends keyof E & string = keyof E & string> = {
  on: K;
  run: (payload: E[K]) => Promise<unknown> | unknown;
  debounceMs?: number;
};

export type AnyRule<E extends AppEvent> = {
  [K in keyof E & string]: {
    on: K;
    run: (payload: E[K]) => Promise<unknown> | unknown;
    debounceMs?: number;
  }
}[keyof E & string];

export function startOrchestrator<E extends AppEvent>(rules: ReadonlyArray<AnyRule<E>>) {
  const timers = new Map<string, number>();
  const offs: Array<() => void> = [];

  for (const r of rules) {
    // Cast event name to the global AppEvent key type to satisfy onEvent's generic
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const off = onEvent(r.on as Extract<keyof AppEvent, string>, (payload: any) => {
      const key = r.debounceMs ? `${r.on}:${JSON.stringify(payload)}` : '';
      const exec = () => {
        void r.run(payload);
      };
      if (r.debounceMs && r.debounceMs > 0) {
        const prev = timers.get(key);
        // Use window.clearTimeout to ensure DOM timer typing (number) is used
        if (prev) window.clearTimeout(prev);
        const id = window.setTimeout(() => {
          timers.delete(key);
          exec();
        }, r.debounceMs);
        timers.set(key, id);
      }
      else {
        exec();
      }
    });
    offs.push(off);
  }

  return () => {
    offs.forEach(f => f());
  };
}
