import type { Link as LinkType } from '~/models/link';
import type { MemoDetail, MemoIndexItem } from '~/models/memo';
import type { Workspace } from '~/models/workspace';

const LogPrefix = 'workspaceStore';

export const useWorkspaceStore = defineStore('workspace', () => {
  const command = useCommand();

  /* --- States --- */
  const workspace = ref<Workspace>();
  const workspaceMemos = ref<MemoIndexItem[]>([]);
  const memo = ref<MemoDetail>();
  const links = ref<LinkType[]>();

  const favoriteMemos = ref<LinkType[]>([]);

  /* ---  Loader --- */
  const {
    runTask: loadWorkspace,
  } = useAsyncTask(
    async (workspaceSlug: string) => {
      const logger = useConsoleLogger(`${LogPrefix}/loadWorkspace`);
      logger.log('Start to load workspace.');

      workspace.value = await command.workspace.get({ slugName: workspaceSlug });

      logger.log('Finish getting workspace successfully.');
    },
  );

  const {
    runTask: loadWorkspaceMemos,
  } = useAsyncTask(
    async (workspaceSlug: string) => {
      const logger = useConsoleLogger(`${LogPrefix}/loadWorkspaceMemos`);
      logger.log('Start to load workspace memos.');

      workspaceMemos.value = await command.memo.list({ slugName: workspaceSlug });

      logger.log('Finish loading workspace memos successfully.');
    },
  );

  const {
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
    runTask: loadLinks,
  } = useAsyncTask(
    async (workspaceSlug: string, memoSlug: string) => {
      const logger = useConsoleLogger(`${LogPrefix}/loadMemo`);
      logger.log('Start to load links.');

      links.value = await command.link.list({ workspaceSlug, memoSlug });

      logger.log('Finish loading memo successfully.');
    },
  );

  const {
    runTask: loadFavoriteMemos,
  } = useAsyncTask(
    async (workspaceSlug: string) => {
      const logger = useConsoleLogger(`${LogPrefix}/loadFavoriteMemos`);
      logger.log('Start to load favorite memos.');

      favoriteMemos.value = await command.link.list({ workspaceSlug, memoSlug: '#favorite' });
      favoriteMemos.value.sort((a, b) => a.description! < b.description! ? -1 : 1);

      logger.log('Finish loading favorite memos successfully.');
    },
  );

  /* --- Actions --- */

  const exitWorkspace = () => {
    const logger = useConsoleLogger(`${LogPrefix}/exitWorkspace`);
    logger.log('Exit workspace.');

    workspace.value = undefined;
  };

  const {
    runTask: saveMemo,
  } = useAsyncTask(
    async (workspaceSlug: string, memoSlug: string, newContent: {
      title: string;
      content: string;
      description: string;
      thumbnailImage: string;
    }) => {
      const logger = useConsoleLogger(`${LogPrefix}/saveMemo`);
      logger.log('Start to save memo.');

      await command.memo.save({ workspaceSlug, memoSlug }, {
        slugTitle: encodeForSlug(newContent.title),
        title: newContent.title,
        content: newContent.content,
        description: newContent.description,
        thumbnailImage: newContent.thumbnailImage,
      });

      logger.log('Finish saving memo successfully.');
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
    // States
    workspace,
    workspaceMemos,
    memo,
    links,
    favoriteMemos,

    // Loaders
    loadWorkspace,
    loadWorkspaceMemos,
    loadMemo,
    loadLinks,
    loadFavoriteMemos,

    // Actions
    exitWorkspace,
    saveMemo,
    deleteMemo,
    createLink,
    deleteLink,
  };
});
