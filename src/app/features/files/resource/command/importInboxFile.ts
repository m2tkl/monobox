import { publishResourceChanges } from '~/resource-runtime/query-runtime';
import { changeRefs } from '~/resources/changes';
import { command } from '~/resources/command';

type ImportInboxFileInput = {
  workspaceSlug: string;
  sourcePath: string;
};

export async function importInboxFile(input: ImportInboxFileInput) {
  const file = await command.file.importInboxEntry(input.sourcePath);

  void publishResourceChanges([
    changeRefs.inboxFileCollectionChanged(),
    changeRefs.fileCollectionChanged(input.workspaceSlug),
    changeRefs.fileChanged(input.workspaceSlug, file.id),
  ]);

  return file;
}
