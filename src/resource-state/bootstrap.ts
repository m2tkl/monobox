import { startRouteWatcher } from './route-watcher';
import { startRules } from './rules';

import { emitEvent } from '~/resource-state/infra/eventBus';

export function bootstrapResourceState() {
  startRules();
  startRouteWatcher();
  emitEvent('app/init', undefined);
}
