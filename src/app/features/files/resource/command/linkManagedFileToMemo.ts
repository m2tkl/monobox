import { publishResourceChanges } from '~/resource-runtime/query-runtime';
import { changeRefs } from '~/resources/changes';
import { command } from '~/resources/command';

type LinkManagedFileToMemoInput = {
  workspaceSlug: string;
  memoSlug: string;
  fileId: string;
};

export async function linkManagedFileToMemo(input: LinkManagedFileToMemoInput) {
  await command.file.linkFileToMemo(input);

  void publishResourceChanges([
    changeRefs.memoChanged(input.workspaceSlug, input.memoSlug),
    changeRefs.fileCollectionChanged(input.workspaceSlug),
    changeRefs.fileChanged(input.workspaceSlug, input.fileId),
  ]);
}
