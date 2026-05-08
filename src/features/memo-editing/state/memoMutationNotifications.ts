import type { Ref } from 'vue';
import type { Router } from 'vue-router';

import { emitEvent } from '~/resource-runtime/infra/eventBus';

type MemoMutationNotificationsOptions = {
  workspaceSlug: Ref<string>;
  routeHash: Ref<string>;
  router: Router;
  onAfterUpdated?: () => void;
};

export function createMemoMutationNotifications(options: MemoMutationNotificationsOptions) {
  const {
    workspaceSlug,
    routeHash,
    router,
    onAfterUpdated,
  } = options;

  const notifyUpdated = (memoSlug: string) => {
    emitEvent('memo/updated', { workspaceSlug: workspaceSlug.value, memoSlug });
    router.replace(`/${workspaceSlug.value}/${memoSlug}${routeHash.value}`);
    onAfterUpdated?.();
  };

  const notifyDeleted = () => {
    emitEvent('memo/deleted', { workspaceSlug: workspaceSlug.value });
    router.replace(`/${workspaceSlug.value}`);
  };

  return {
    notifyUpdated,
    notifyDeleted,
  };
}
