import type { MemoTemplateIndexItem } from '~/models/memoTemplate';

import { command } from '~/external/tauri/command';

type ToggleDefaultMemoTemplateInput = {
  workspaceSlug: string;
  template: MemoTemplateIndexItem;
};

export async function toggleDefaultMemoTemplate(input: ToggleDefaultMemoTemplateInput) {
  if (input.template.is_default) {
    await command.memoTemplate.clearDefault({
      workspaceSlugName: input.workspaceSlug,
    });
    return;
  }

  await command.memoTemplate.setDefault({
    workspaceSlugName: input.workspaceSlug,
    templateSlugName: input.template.slug_name,
  });
}
