import type { Editor } from '@tiptap/core';

import { publishResourceChanges } from '~/resource-runtime/query-runtime';
import { command } from '~/resources/command';
import { changeRefs } from '~/resources/changes';

type SaveMemoTarget = {
  workspaceSlug: string;
  memoSlug: string;
};

type SaveMemoResult = {
  memoSlug: string;
};

export async function saveMemo(
  target: SaveMemoTarget,
  editor: Editor,
  newTitle: string,
  thumbnailImage: string,
  // Kept for call-site compatibility; route hash is no longer used during save.
  _routeHash: string,
): Promise<SaveMemoResult> {
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

  const changes = [
    changeRefs.memoChanged(target.workspaceSlug, newSlugTitle),
  ];

  if (target.memoSlug !== newSlugTitle) {
    changes.push(changeRefs.memoRenamed(target.workspaceSlug, target.memoSlug, newSlugTitle));
  }

  void publishResourceChanges(changes);

  return {
    memoSlug: newSlugTitle,
  };
}
