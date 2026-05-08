import { buildUntitledTemplateName, sortMemoTemplates } from '../views/template/template';

import type { MemoTemplateIndexItem } from '~/models/memoTemplate';

import { command } from '~/external/tauri/command';

type CreateMemoTemplateInput = {
  workspaceSlug: string;
  existingTemplates: MemoTemplateIndexItem[];
};

type DeleteMemoTemplateInput = {
  workspaceSlug: string;
  templateSlug: string;
};

type ToggleDefaultMemoTemplateInput = {
  workspaceSlug: string;
  template: MemoTemplateIndexItem;
};

export async function loadMemoTemplates(workspaceSlug: string) {
  const nextTemplates = await command.memoTemplate.list({ slugName: workspaceSlug });
  return sortMemoTemplates(nextTemplates);
}

export async function createMemoTemplate(input: CreateMemoTemplateInput) {
  const name = buildUntitledTemplateName(input.existingTemplates.map(template => template.name));

  return command.memoTemplate.create({
    workspaceSlugName: input.workspaceSlug,
    name,
    content: JSON.stringify(''),
  });
}

export async function deleteMemoTemplate(input: DeleteMemoTemplateInput) {
  await command.memoTemplate.delete({
    workspaceSlugName: input.workspaceSlug,
    templateSlugName: input.templateSlug,
  });
}

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
