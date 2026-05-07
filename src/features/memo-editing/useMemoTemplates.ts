import { ref } from 'vue';

import { sortMemoTemplates } from './view/template/template';

import type { Ref } from 'vue';
import type { MemoTemplateIndexItem } from '~/models/memoTemplate';

import { command } from '~/external/tauri/command';

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
