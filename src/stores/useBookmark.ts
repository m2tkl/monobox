import type { Bookmark } from '~/models/bookmark';

const LogPrefix = 'workspaceStore/bookmark';

export const useBookmark = defineStore('bookmark', () => {
  const command = useCommand();

  const bookmarks = ref<Bookmark[]>([]);

  const {
    isLoading: bookmakrsLoading,
    error: bookmarksLoadingError,
    runTask: loadBookmarks,
  } = useAsyncTask(
    async (workspaceSlug: string) => {
      const logger = useConsoleLogger(`${LogPrefix}/loadBookmarks`);
      bookmarks.value = await command.bookmark.list(workspaceSlug);

      logger.log('Finish loading bookmarks successfully.');
    },
  );

  const {
    runTask: createBookmark,
  } = useAsyncTask(
    async (workspaceSlug: string, memoSlug: string) => {
      const logger = useConsoleLogger(`${LogPrefix}/createBookmark`);
      logger.log('Start to create bookmark.');

      await command.bookmark.add(workspaceSlug, memoSlug);

      logger.log('Finish creating bookmark successfully.');
    },
  );

  const {
    runTask: deleteBookmark,
  } = useAsyncTask(
    async (workspaceSlug: string, memoSlug: string) => {
      const logger = useConsoleLogger(`${LogPrefix}/deleteBookmark`);
      logger.log('Start to delete bookmark.');

      await command.bookmark.delete(workspaceSlug, memoSlug);

      logger.log('Finish deleting bookmark successfully.');
    },
  );

  return {
    bookmarks,
    bookmakrsLoading,
    bookmarksLoadingError,
    loadBookmarks,

    createBookmark,
    deleteBookmark,
  };
});
