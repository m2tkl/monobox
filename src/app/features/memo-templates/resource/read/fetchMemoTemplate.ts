import type { MemoTemplateDetail } from '~/models/memoTemplate';

import { memoTemplateDetailQuery } from '~/resources/memo-template/queries';

type FetchMemoTemplateInput = {
  workspaceSlug: string;
  templateSlug: string;
};

export async function fetchMemoTemplate(
  input: FetchMemoTemplateInput,
): Promise<MemoTemplateDetail> {
  return memoTemplateDetailQuery.fetch({
    workspaceSlug: input.workspaceSlug,
    templateSlug: input.templateSlug,
  });
}
