import type { Link as LinkType } from '~/models/link';
import type { MemoDetail, MemoIndexItem } from '~/models/memo';

const LogPrefix = 'memoStore';

export const useMemoStore = defineStore('memo', () => {
  const command = useCommand();

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

  const {
    runTask: saveMemo,
  } = useAsyncTask(
    async (
      workspaceSlug: string,
      memoSlug: string,
      newContent: {
        title: string;
        content: string;
        description: string;
        thumbnailImage: string;
      }) => {
      const logger = useConsoleLogger(`${LogPrefix}/saveMemo`);
      logger.log('Start to save memo.');

      const newSlugTitle = encodeForSlug(newContent.title);

      await command.memo.save({ workspaceSlug, memoSlug }, {
        slugTitle: newSlugTitle,
        title: newContent.title,
        content: newContent.content,
        description: newContent.description,
        thumbnailImage: newContent.thumbnailImage,
      });

      logger.log('Finish saving memo successfully.');
      return { newSlugTitle };
    },
  );

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
    saveMemo,
    deleteMemo,
    createLink,
    deleteLink,
  };
});
