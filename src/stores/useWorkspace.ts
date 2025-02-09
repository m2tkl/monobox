import type { Link as LinkType } from '~/models/link';
import type { MemoDetail, MemoIndexItem } from '~/models/memo';
import type { Workspace } from '~/models/workspace';

export const useWorkspaceStore = defineStore('workspace', () => {
  const command = useCommand();

  /**
   * States
   */
  const workspace = ref<Workspace>();
  const workspaceMemos = ref<MemoIndexItem[]>([]);
  const memo = ref<MemoDetail>();
  const links = ref<LinkType[]>();

  const favoriteMemos = ref<LinkType[]>([]);

  /**
   * Loader
   */

  const loadWorkspace = async (workspaceSlug: string) => {
    workspace.value = await command.workspace.get({ slugName: workspaceSlug });
  };

  const loadWorkspaceMemos = async (workspaceSlug: string) => {
    try {
      workspaceMemos.value = await command.memo.list({ slugName: workspaceSlug });
    }
    catch (error) {
      console.error(error);
      workspaceMemos.value = [];
    }
  };

  const loadMemo = async (workspaceSlug: string, memoSlug: string) => {
    memo.value = await command.memo.get({
      workspaceSlugName: workspaceSlug,
      memoSlugTitle: memoSlug,
    });
  };

  const loadLinks = async (workspaceSlug: string, memoSlug: string) => {
    links.value = await command.link.list({ workspaceSlug, memoSlug });
  };

  const loadFavoriteMemos = async (workspaceSlug: string) => {
    try {
      favoriteMemos.value = await command.link.list({ workspaceSlug, memoSlug: '#favorite' });
      favoriteMemos.value.sort((a, b) => a.description! < b.description! ? -1 : 1);
    }
    catch (error) {
      favoriteMemos.value = [];
      console.log(error);
    }
  };

  /**
   * Actions
   */

  const exitWorkspace = () => {
    workspace.value = undefined;
  };

  const saveMemo = async (workspaceSlug: string, memoSlug: string, newContent: {
    title: string;
    content: string;
    description: string;
    thumbnailImage: string;
  }) => {
    await command.memo.save({ workspaceSlug, memoSlug }, {
      slugTitle: encodeForSlug(newContent.title),
      title: newContent.title,
      content: newContent.content,
      description: newContent.description,
      thumbnailImage: newContent.thumbnailImage,
    });
  };

  const deleteMemo = async (workspaceSlug: string, memoSlug: string) => {
    await command.memo.trash({ workspaceSlug, memoSlug });
  };

  const createLink = async (workspaceSlug: string, memoSlug: string, href: string) => {
    try {
      await command.link.create({ workspaceSlug, memoSlug }, href);
    }
    catch (error) {
      console.error(error);
    }
  };

  const deleteLink = async (workspaceSlug: string, memoSlug: string, href: string) => {
    try {
      await command.link.delete({ workspaceSlug, memoSlug }, href);
    }
    catch (error) {
      console.error(error);
    }
  };

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
