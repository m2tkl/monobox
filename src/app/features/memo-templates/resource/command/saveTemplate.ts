import { command } from '~/external/tauri/command';
import { publishResourceChanges } from '~/resource-runtime/query-runtime';
import { changeRefs } from '~/resources/changes';
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

  const nextSlug = encodeForSlug(nextName);
  const changes = [
    changeRefs.memoTemplateChanged(input.workspaceSlug, nextSlug),
  ];

  if (input.targetSlugName !== nextSlug) {
    changes.push(changeRefs.memoTemplateRenamed(input.workspaceSlug, input.targetSlugName, nextSlug));
  }

  void publishResourceChanges(changes);

  return {
    slug: nextSlug,
    name: nextName,
  };
}
