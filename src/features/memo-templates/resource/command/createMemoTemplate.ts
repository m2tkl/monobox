import { buildUntitledTemplateName } from '../../template';

import type { MemoTemplateIndexItem } from '~/models/memoTemplate';

import { command } from '~/external/tauri/command';

type CreateMemoTemplateInput = {
  workspaceSlug: string;
  existingTemplates: MemoTemplateIndexItem[];
};

export async function createMemoTemplate(input: CreateMemoTemplateInput) {
  const name = buildUntitledTemplateName(input.existingTemplates.map(template => template.name));

  return command.memoTemplate.create({
    workspaceSlugName: input.workspaceSlug,
    name,
    content: JSON.stringify(''),
  });
}
