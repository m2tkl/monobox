import { publishResourceChanges } from '~/resource-runtime/query-runtime';
import { changeRefs } from '~/resources/changes';
import { command } from '~/resources/command';

type UpdateExternalFileLinkInput = {
  workspaceSlug: string;
  fileId: string;
  displayName: string;
  url: string;
};

export async function updateExternalFileLink(input: UpdateExternalFileLinkInput) {
  const updated = await command.file.updateExternalLink({
    fileId: input.fileId,
    displayName: input.displayName,
    url: input.url,
  });

  void publishResourceChanges([
    changeRefs.fileCollectionChanged(input.workspaceSlug),
    changeRefs.fileChanged(input.workspaceSlug, input.fileId),
  ]);

  return updated;
}
