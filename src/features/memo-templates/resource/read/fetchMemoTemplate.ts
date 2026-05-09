import type { MemoTemplateDetail } from '~/models/memoTemplate';

import { command } from '~/external/tauri/command';

type FetchMemoTemplateInput = {
  workspaceSlug: string;
  templateSlug: string;
};

export async function fetchMemoTemplate(
  input: FetchMemoTemplateInput,
): Promise<MemoTemplateDetail> {
  return command.memoTemplate.get({
    workspaceSlugName: input.workspaceSlug,
    templateSlugName: input.templateSlug,
  });
}
