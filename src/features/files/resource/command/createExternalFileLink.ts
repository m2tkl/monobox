import { publishResourceChanges } from '~/resource-runtime/query-runtime';
import { changeRefs } from '~/resources/changes';
import { command } from '~/resources/command';

type CreateExternalFileLinkInput = {
  workspaceSlug: string;
  displayName: string;
  url: string;
};

export async function createExternalFileLink(input: CreateExternalFileLinkInput) {
  const created = await command.file.createExternalLink({
    displayName: input.displayName,
    url: input.url,
  });

  void publishResourceChanges([
    changeRefs.fileCollectionChanged(input.workspaceSlug),
    changeRefs.fileChanged(input.workspaceSlug, created.id),
  ]);

  return created;
}
