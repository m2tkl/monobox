import type { MemoIndexItem } from '~/models/memo';
import type { MemoTemplateDetail } from '~/models/memoTemplate';

import { command } from '~/external/tauri/command';

type LoadMemoTemplateEditorDataInput = {
  workspaceSlug: string;
  templateSlug: string;
};

type LoadMemoTemplateEditorDataResult = {
  template: MemoTemplateDetail;
  memos: MemoIndexItem[];
};

export async function loadTemplateEditorData(
  input: LoadMemoTemplateEditorDataInput,
): Promise<LoadMemoTemplateEditorDataResult> {
  const [template, memos] = await Promise.all([
    command.memoTemplate.get({
      workspaceSlugName: input.workspaceSlug,
      templateSlugName: input.templateSlug,
    }),
    command.memo.list({ slugName: input.workspaceSlug }),
  ]);

  return {
    template,
    memos,
  };
}
