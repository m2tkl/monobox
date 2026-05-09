import { command } from '~/external/tauri/command';

type DeleteMemoTemplateInput = {
  workspaceSlug: string;
  templateSlug: string;
};

export async function deleteMemoTemplate(input: DeleteMemoTemplateInput) {
  await command.memoTemplate.delete({
    workspaceSlugName: input.workspaceSlug,
    templateSlugName: input.templateSlug,
  });
}
