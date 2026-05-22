import { publishResourceChanges } from '~/resource-runtime/query-runtime';
import { changeRefs } from '~/resources/changes';
import { command } from '~/resources/command';

type RenameManagedFileInput = {
  workspaceSlug: string;
  fileId: string;
  displayName: string;
};

export async function renameManagedFile(input: RenameManagedFileInput) {
  const updated = await command.file.updateDisplayName({
    fileId: input.fileId,
    displayName: input.displayName,
  });

  void publishResourceChanges([
    changeRefs.fileCollectionChanged(input.workspaceSlug),
    changeRefs.fileChanged(input.workspaceSlug, input.fileId),
  ]);

  return updated;
}
