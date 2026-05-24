import { publishResourceChanges } from '~/resource-runtime/query-runtime';
import { changeRefs } from '~/resources/changes';
import { command } from '~/resources/command';

type UpdateManagedFileNoteInput = {
  workspaceSlug: string;
  fileId: string;
  note: string;
};

export async function updateManagedFileNote(input: UpdateManagedFileNoteInput) {
  const updated = await command.file.updateNote({
    fileId: input.fileId,
    note: input.note,
  });

  void publishResourceChanges([
    changeRefs.fileCollectionChanged(input.workspaceSlug),
    changeRefs.fileChanged(input.workspaceSlug, input.fileId),
  ]);

  return updated;
}
