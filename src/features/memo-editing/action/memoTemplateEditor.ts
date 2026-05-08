import type { MemoIndexItem } from '~/models/memo';
import type { MemoTemplateDetail } from '~/models/memoTemplate';

import { command } from '~/external/tauri/command';
import { encodeForSlug } from '~/utils/slug';

type LoadMemoTemplateEditorDataInput = {
  workspaceSlug: string;
  templateSlug: string;
};

type LoadMemoTemplateEditorDataResult = {
  template: MemoTemplateDetail;
  memos: MemoIndexItem[];
};

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
