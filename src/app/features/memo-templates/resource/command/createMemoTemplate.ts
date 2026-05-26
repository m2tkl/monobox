import { buildUntitledTemplateName } from '../../template';

import type { MemoTemplateIndexItem } from '~/models/memoTemplate';

import { command } from '~/external/tauri/command';
import { publishResourceChanges } from '~/resource-runtime/query-runtime';
import { changeRefs } from '~/resources/changes';

type CreateMemoTemplateInput = {
  workspaceSlug: string;
  existingTemplates: MemoTemplateIndexItem[];
};

export async function createMemoTemplate(input: CreateMemoTemplateInput) {
  const name = buildUntitledTemplateName(input.existingTemplates.map(template => template.name));

  const created = await command.memoTemplate.create({
    workspaceSlugName: input.workspaceSlug,
    name,
    content: JSON.stringify(''),
  });

  void publishResourceChanges([
    changeRefs.memoTemplateCreated(input.workspaceSlug, created.slug_name),
  ]);

  return created;
}
