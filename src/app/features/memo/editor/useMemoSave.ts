import type { Editor } from '@tiptap/vue-3';

import { getHeadingTextById } from '~/app/features/editor/core/query';
import { command } from '~/external/tauri/command';

export function useMemoSave() {
  const recentStore = useRecentMemoStore();

  const { runTask: executeMemoSave } = useAsyncTask(saveMemo);

  async function saveMemo(
    target: { workspaceSlug: string; memoSlug: string },
    editor: Editor,
    newTitle: string,
    thumbnailImage: string,
    routeHash: string,
  ): Promise<void> {
    await updateMemoContent(
      target,
      editor,
      newTitle,
      thumbnailImage,
    );

    addMemoHistory(
      newTitle,
      editor,
      routeHash,
      target.workspaceSlug,
    );
  };

  const updateMemoContent = async (
    target: { workspaceSlug: string; memoSlug: string },
    editor: Editor,
    newTitle: string,
    thumbnailImage: string,
  ): Promise<void> => {
    const newSlugTitle = encodeForSlug(newTitle);
    const newContent = {
      title: newTitle,
      content: JSON.stringify(editor.getJSON()),
      description: truncateString(editor.getText(), 256),
      thumbnailImage,
    };

    await command.memo.save({
      ...target,
    }, {
      slugTitle: newSlugTitle,
      title: newContent.title,
      content: newContent.content,
      description: newContent.description,
      thumbnailImage: newContent.thumbnailImage,
    });
  };

  const addMemoHistory = (
    newTitle: string,
    editor: Editor,
    routeHash: string,
    workspaceSlug: string,
  ): void => {
    const titleForHistory = getMemoTitleWithHeading(newTitle, editor, routeHash);
    const historyItem = [
      titleForHistory,
      encodeForSlug(newTitle),
      workspaceSlug,
      routeHash || undefined,
      true,
    ] as const;
    recentStore.addMemo(...historyItem);
  };

  return {
    executeMemoSave,
  };
}

/**
 * Returns the memo title, possibly including the heading in view.
 */
export const getMemoTitleWithHeading = (baseTitle: string, editor: Editor, routeHash: string): string => {
  if (!routeHash) return baseTitle;

  const headingId = routeHash.replace(/^#/, '');
  const headingTitle = getHeadingTextById(editor.getJSON(), headingId);

  return headingTitle ? `${baseTitle} › ${headingTitle}` : baseTitle;
};
