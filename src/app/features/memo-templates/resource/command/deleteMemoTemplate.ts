import { command } from '~/external/tauri/command';
import { publishResourceChanges } from '~/resource-runtime/query-runtime';
import { changeRefs } from '~/resources/changes';

type DeleteMemoTemplateInput = {
  workspaceSlug: string;
  templateSlug: string;
};

export async function deleteMemoTemplate(input: DeleteMemoTemplateInput) {
  await command.memoTemplate.delete({
    workspaceSlugName: input.workspaceSlug,
    templateSlugName: input.templateSlug,
  });

  void publishResourceChanges([
    changeRefs.memoTemplateDeleted(input.workspaceSlug),
  ]);
}
