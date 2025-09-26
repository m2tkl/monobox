import type { Link as LinkType } from '~/models/link';
import type { MemoDetail } from '~/models/memo';

import { command } from '~/external/tauri/command';

const LogPrefix = 'memoStore';

export const useMemoStore = defineStore('memo', () => {
  const memo = ref<MemoDetail>();
  const links = ref<LinkType[]>([]);

  const {
    isLoading: memoLoading,
    error: memoLoadingError,
    runTask: loadMemo,
  } = useAsyncTask(
    async (workspaceSlug: string, memoSlug: string) => {
      const logger = useConsoleLogger(`${LogPrefix}/loadMemo`);
      logger.log('Start to load memo.');

      memo.value = await command.memo.get({
        workspaceSlugName: workspaceSlug,
        memoSlugTitle: memoSlug,
      });

      logger.log('Finish loading memo successfully.');
    },
  );

  const {
    isLoading: linksLoading,
    error: linksLoadingError,
    runTask: loadLinks,
  } = useAsyncTask(
    async (workspaceSlug: string, memoSlug: string) => {
      const logger = useConsoleLogger(`${LogPrefix}/loadLinks`);
      logger.log('Start to load links.');

      links.value = await command.link.list({ workspaceSlug, memoSlug });

      logger.log('Finish loading memo successfully.');
    },
  );

  // NOTE: Removed saveMemo since it was not being used

  const {
    runTask: deleteMemo,
  } = useAsyncTask(
    async (workspaceSlug: string, memoSlug: string) => {
      const logger = useConsoleLogger(`${LogPrefix}/deleteMemo`);
      logger.log('Start to delete memo.');

      await command.memo.trash({ workspaceSlug, memoSlug });

      logger.log('Finish deleting memo successfully.');
    },
  );

  const {
    runTask: createLink,
  } = useAsyncTask(
    async (workspaceSlug: string, memoSlug: string, href: string) => {
      const logger = useConsoleLogger(`${LogPrefix}/createLink`);
      logger.log('Start to create link.');

      await command.link.create({ workspaceSlug, memoSlug }, href);

      logger.log('Finish creating link successfully.');
    },
  );

  const {
    runTask: deleteLink,
  } = useAsyncTask(
    async (workspaceSlug: string, memoSlug: string, href: string) => {
      const logger = useConsoleLogger(`${LogPrefix}/deleteLink`);
      logger.log('Start to delete link.');

      await command.link.delete({ workspaceSlug, memoSlug }, href);

      logger.log('Finish deleting link successfully.');
    },
  );

  return {
    memo,
    memoLoading,
    memoLoadingError,

    links,
    linksLoading,
    linksLoadingError,

    loadMemo,
    loadLinks,
    deleteMemo,
    createLink,
    deleteLink,
  };
});
