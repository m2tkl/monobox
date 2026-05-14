import { publishResourceChanges } from '~/resource-runtime/query-runtime';
import { command } from '~/resources/command';
import { changeRefs } from '~/resources/changes';

type DeleteMemoInput = {
  workspaceSlug: string;
  memoSlug: string;
};

export async function deleteMemo(input: DeleteMemoInput) {
  await command.memo.trash(input);
  void publishResourceChanges([
    changeRefs.memoDeleted(input.workspaceSlug, input.memoSlug),
  ]);
}
