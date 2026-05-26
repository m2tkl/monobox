import { publishResourceChanges } from '~/resource-runtime/query-runtime';
import { changeRefs } from '~/resources/changes';
import { command } from '~/resources/command';

type CreateMemoInput = {
  workspaceSlug: string;
  title: string;
};

export async function createMemo(input: CreateMemoInput) {
  const newMemo = await command.memo.create({
    workspaceSlugName: input.workspaceSlug,
    title: input.title,
  });

  void publishResourceChanges([
    changeRefs.memoCreated(input.workspaceSlug, newMemo.slug_title),
  ]);

  return newMemo;
}
