import { command } from '~/resources/command';

type DeleteMemoInput = {
  workspaceSlug: string;
  memoSlug: string;
};

export async function deleteMemo(input: DeleteMemoInput) {
  await command.memo.trash(input);
}
