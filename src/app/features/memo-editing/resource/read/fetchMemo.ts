import type { MemoDetail } from '~/models/memo';

import { command } from '~/external/tauri/command';

type FetchMemoInput = {
  workspaceSlug: string;
  memoSlug: string;
};

export async function fetchMemo(input: FetchMemoInput): Promise<MemoDetail> {
  return command.memo.get({
    workspaceSlugName: input.workspaceSlug,
    memoSlugTitle: input.memoSlug,
  });
}
