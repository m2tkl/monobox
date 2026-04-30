import type { Editor } from '@tiptap/vue-3';

import { command } from '~/external/tauri/command';

export function useMemoSave() {
  const { runTask: executeMemoSave } = useAsyncTask(saveMemo);

  async function saveMemo(
    target: { workspaceSlug: string; memoSlug: string },
    editor: Editor,
    newTitle: string,
    thumbnailImage: string,
    // Kept for call-site compatibility; route hash is no longer used during save.
    _routeHash: string,
  ): Promise<void> {
    await updateMemoContent(
      target,
      editor,
      newTitle,
      thumbnailImage,
    );
  };

  const updateMemoContent = async (
    target: { workspaceSlug: string; memoSlug: string },
    editor: Editor,
    newTitle: string,
    thumbnailImage: string,
  ): Promise<void> => {
    const normalizedTitle = newTitle.trim();
    const newSlugTitle = encodeForSlug(normalizedTitle);
    const newContent = {
      title: normalizedTitle,
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

  return {
    executeMemoSave,
  };
}
