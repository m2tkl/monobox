import { loadResource } from './infra/loadResource';
import { useResourceManager } from './infra/useResourceManager';

import type { AppEvent } from './events';
import type { ResourceSnapshot } from './infra/types';
import type { ComputedRef } from 'vue';

type EventName = Extract<keyof AppEvent, string>;

export type QueryDependency<Args, K extends EventName = EventName> = {
  event: K;
  match: (payload: AppEvent[K], args: Args) => boolean;
};

export type AnyQueryDependency<Args> = {
  [K in EventName]: QueryDependency<Args, K>;
}[EventName];

export type QueryDefinition<Args, Data> = {
  key: (args: Args) => readonly unknown[];
  load: (args: Args) => Promise<Data>;
  dependencies?: ReadonlyArray<AnyQueryDependency<Args>>;
};

export type DefinedQuery<Args, Data> = QueryDefinition<Args, Data> & {
  read(args: Args): ComputedRef<ResourceSnapshot<Data>>;
  fetch(args: Args): Promise<Data>;
};

export function defineQuery<Args, Data>(definition: QueryDefinition<Args, Data>): DefinedQuery<Args, Data> {
  return {
    ...definition,
    read(args: Args): ComputedRef<ResourceSnapshot<Data>> {
      return useResourceManager().selectSnapshot<Data>(definition.key(args));
    },
    fetch(args: Args): Promise<Data> {
      return loadResource(definition.key(args), () => definition.load(args));
    },
  };
}
