import { onEvent } from './eventBus';

import type { AppEvent } from '../events';

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

  for (const rule of rules) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const off = onEvent(rule.on as Extract<keyof AppEvent, string>, (payload: any) => {
      const key = rule.debounceMs ? `${rule.on}:${JSON.stringify(payload)}` : '';
      const exec = () => {
        void rule.run(payload);
      };
      if (rule.debounceMs && rule.debounceMs > 0) {
        const previous = timers.get(key);
        if (previous) window.clearTimeout(previous);
        const id = window.setTimeout(() => {
          timers.delete(key);
          exec();
        }, rule.debounceMs);
        timers.set(key, id);
      }
      else {
        exec();
      }
    });
    offs.push(off);
  }

  return () => {
    offs.forEach(off => off());
  };
}
