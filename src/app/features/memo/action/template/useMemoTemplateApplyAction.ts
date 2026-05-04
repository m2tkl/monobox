import type { Editor } from '@tiptap/core';

import { parseTemplateContent } from '~/app/features/memo/ui/template/template';
import { command } from '~/external/tauri/command';

type ApplyMemoTemplateInput = {
  workspaceSlug: string;
  templateSlug: string;
  editor: Editor;
};

type ApplyMemoTemplateResult = {
  templateId: number;
};

export function useMemoTemplateApplyAction() {
  const applyTemplateToEditor = async (
    input: ApplyMemoTemplateInput,
  ): Promise<ApplyMemoTemplateResult> => {
    const templateMemo = await command.memoTemplate.get({
      workspaceSlugName: input.workspaceSlug,
      templateSlugName: input.templateSlug,
    });

    input.editor.commands.setContent(parseTemplateContent(templateMemo));

    return {
      templateId: templateMemo.id,
    };
  };

  return {
    applyTemplateToEditor,
  };
}
