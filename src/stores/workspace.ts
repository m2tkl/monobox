import type { MemoIndexItem } from '~/models/memo';
import type { Workspace } from '~/models/workspace';

import { command } from '~/external/tauri/command';

const LogPrefix = 'workspaceStore';

export const useWorkspaceStore = defineStore('workspace', () => {
  /* --- States --- */
  const workspaces = ref<Workspace[]>([]);
  const workspace = ref<Workspace>();
  const workspaceMemos = ref<MemoIndexItem[]>([]);

  const bookmarkedMemos = computed<MemoIndexItem[]>(() => {
    const bookmarkedMemoIds = new Set(bookmarks.value.map(b => b.memo_id));
    return workspaceMemos.value.filter(memo => bookmarkedMemoIds.has(memo.id));
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

  /* --- Actions --- */
  const exitWorkspace = () => {
    const logger = useConsoleLogger(`${LogPrefix}/exitWorkspace`);
    logger.log('Exit workspace.');

    workspace.value = undefined;
    workspaceMemos.value = [];
    memo.value = undefined;
    links.value = [];
  };

  const {
    memo,
    memoLoading,
    memoLoadingError,
    links,
    linksLoading,
    linksLoadingError,
  } = storeToRefs(useMemoStore());
  const {
    loadMemo,
    loadLinks,
    deleteMemo,
    createLink,
    deleteLink,
  } = useMemoStore();

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

  /**
   * Flag indicating whether the currently loaded memo is bookmarked.
   */
  const isBookmarked = computed<boolean>(() => {
    return bookmarks.value.some(bookmark => bookmark.memo_id === memo.value?.id);
  });

  return {
    // States
    workspaces,
    workspace,
    workspaceMemos,
    memo,
    isBookmarked,
    links,
    bookmarks,
    bookmarkedMemos,

    // Loaders
    loadWorkspaces,
    loadWorkspace,
    loadWorkspaceMemos,
    loadMemo,
    loadLinks,
    loadBookmarks,

    workspacesLoading,
    workspaceLoading,
    workspaceMemosLoading,
    memoLoading,
    linksLoading,
    bookmakrsLoading,

    workspacesLoadingError,
    workspaceLoadingError,
    workspaceMemosLoadingError,
    memoLoadingError,
    linksLoadingError,
    bookmarksLoadingError,

    // Actions
    exitWorkspace,
    deleteMemo,
    createLink,
    deleteLink,
    createBookmark,
    deleteBookmark,
  };
});
