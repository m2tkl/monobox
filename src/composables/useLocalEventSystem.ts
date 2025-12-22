type EventMap = Record<string, unknown>;

export type LocalEventRule<E extends EventMap, K extends keyof E & string = keyof E & string> = {
  on: K;
  description: string;
  run: (payload: E[K], ctx: { emit: <T extends keyof E & string>(name: T, payload: E[T]) => Promise<void> }) => Promise<unknown> | unknown;
};

export type LocalEventOverviewItem<E extends EventMap> = {
  event: keyof E & string;
  description: string;
};

export function useLocalEventSystem<E extends EventMap>(rules: ReadonlyArray<LocalEventRule<E>>) {
  const ruleMap = new Map<keyof E & string, Array<LocalEventRule<E>>>();

  for (const rule of rules) {
    const list = ruleMap.get(rule.on) ?? [];
    list.push(rule);
    ruleMap.set(rule.on, list);
  }

  const overview: LocalEventOverviewItem<E>[] = rules.map(rule => ({
    event: rule.on,
    description: rule.description,
  }));

  const emit = async <K extends keyof E & string>(name: K, payload: E[K]) => {
    const list = ruleMap.get(name);
    if (!list) {
      return;
    }

    for (const rule of list) {
      await rule.run(payload, { emit });
    }
  };

  return {
    emit,
    overview,
  };
}
