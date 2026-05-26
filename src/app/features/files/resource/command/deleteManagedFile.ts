import { publishResourceChanges } from '~/resource-runtime/query-runtime';
import { changeRefs } from '~/resources/changes';
import { command } from '~/resources/command';

type DeleteManagedFileInput = {
  workspaceSlug: string;
  fileId: string;
};

export async function deleteManagedFile(input: DeleteManagedFileInput) {
  await command.file.deleteFileRecord(input.fileId);

  void publishResourceChanges([
    changeRefs.fileCollectionChanged(input.workspaceSlug),
  ]);
}
