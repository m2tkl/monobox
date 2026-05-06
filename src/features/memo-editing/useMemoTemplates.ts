import { ref } from 'vue';

import type { Ref } from 'vue';
import type { MemoTemplateIndexItem } from '~/models/memoTemplate';

import { command } from '~/external/tauri/command';
import { sortMemoTemplates } from '~/features/memo-editing/view/template/template';

type UseMemoTemplatesOptions = {
  workspaceSlug: Ref<string>;
};

export function useMemoTemplates(options: UseMemoTemplatesOptions) {
  const availableTemplates = ref<MemoTemplateIndexItem[]>([]);

  const loadTemplates = async () => {
    const templates = await command.memoTemplate.list({ slugName: options.workspaceSlug.value });
    availableTemplates.value = sortMemoTemplates(templates);
  };

  return {
    availableTemplates,
    loadTemplates,
  };
}
