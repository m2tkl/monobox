import { command } from '~/external/tauri/command';
import { encodeForSlug } from '~/utils/slug';

type SaveMemoTemplateInput = {
  workspaceSlug: string;
  targetSlugName: string;
  name: string;
  content: string;
};

type SaveMemoTemplateResult = {
  slug: string;
  name: string;
};

export async function saveTemplate(input: SaveMemoTemplateInput): Promise<SaveMemoTemplateResult> {
  const nextName = input.name.trim();

  await command.memoTemplate.save({
    workspaceSlugName: input.workspaceSlug,
    targetSlugName: input.targetSlugName,
    name: nextName,
    content: input.content,
  });

  return {
    slug: encodeForSlug(nextName),
    name: nextName,
  };
}
