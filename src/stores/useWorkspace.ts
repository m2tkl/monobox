import type { Link as LinkType } from '~/models/link';
import type { MemoDetail, MemoIndexItem } from '~/models/memo';
import type { Workspace } from '~/models/workspace';

const LogPrefix = 'workspaceStore';

export const useWorkspaceStore = defineStore('workspace', () => {
  const command = useCommand();

  /* --- States --- */
  const workspaces = ref<Workspace[]>([]);
  const workspace = ref<Workspace>();
  const workspaceMemos = ref<MemoIndexItem[]>([]);
  const memo = ref<MemoDetail>();
  const links = ref<LinkType[]>([]);
  const favoriteMemos = ref<LinkType[]>([]);

  const bookmarkedMemos = computed<MemoIndexItem[]>(() => {
    const bookmarkedMemoIds = new Set(bookmarks.value.map(b => b.memo_id));
    return workspaceMemos.value.filter(memo => bookmarkedMemoIds.has(memo.id));
  });

  const bookmarkIds = computed<Set<number>>(() => {
    return new Set(bookmarks.value.map(b => b.memo_id));
  });

  /* ---  Loader --- */
  const {
    isLoading: workspacesLoading,
    error: workspacesLoadingError,
    runTask: loadWorkspaces,
  } = useAsyncTask(
    async () => {
      const logger = useConsoleLogger(`${LogPrefix}/loadWorkspaces`);
      logger.log('Start to load workspaces.');

      workspaces.value = await command.workspace.list();

      logger.log('Finish getting workspaces successfully.');
    },
  );

  const {
    isLoading: workspaceLoading,
    error: workspaceLoadingError,
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
    isLoading: workspaceMemosLoading,
    error: workspaceMemosLoadingError,
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
    isLoading: favoriteMemosLoading,
    error: favoriteMemosLoadingError,
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
    workspaceMemos.value = [];
    memo.value = undefined;
    links.value = [];
    favoriteMemos.value = [];
  };

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

  const {
    bookmarks,
    bookmakrsLoading,
    bookmarksLoadingError,
  } = storeToRefs(useBookmark());
  const {
    loadBookmarks,
    createBookmark,
    deleteBookmark,
  } = useBookmark();

  return {
    // States
    workspaces,
    workspace,
    workspaceMemos,
    memo,
    links,
    favoriteMemos,
    bookmarks,
    bookmarkIds,
    bookmarkedMemos,

    // Loaders
    loadWorkspaces,
    loadWorkspace,
    loadWorkspaceMemos,
    loadMemo,
    loadLinks,
    loadFavoriteMemos,
    loadBookmarks,

    workspacesLoading,
    workspaceLoading,
    workspaceMemosLoading,
    memoLoading,
    linksLoading,
    favoriteMemosLoading,
    bookmakrsLoading,

    workspacesLoadingError,
    workspaceLoadingError,
    workspaceMemosLoadingError,
    memoLoadingError,
    linksLoadingError,
    favoriteMemosLoadingError,
    bookmarksLoadingError,

    // Actions
    exitWorkspace,
    saveMemo,
    deleteMemo,
    createLink,
    deleteLink,
    createBookmark,
    deleteBookmark,
  };
});
