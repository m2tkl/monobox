import { loadResource } from './infra/loadResource';
import { useResourceManager } from './infra/useResourceManager';

import type { ResourceSnapshot } from './infra/types';
import type { ComputedRef } from 'vue';
import type { ResourceRef } from '~/resources/refs';

export type QueryDefinition<Args, Data> = {
  key: (args: Args) => readonly unknown[];
  resources: (args: Args) => ReadonlyArray<ResourceRef>;
  load: (args: Args) => Promise<Data>;
  when?: (args: Args) => boolean;
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
