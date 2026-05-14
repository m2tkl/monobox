import { sortMemoTemplates } from '~/features/memo-templates/template';
import type { MemoTemplateDetail, MemoTemplateIndexItem } from '~/models/memoTemplate';
import { defineQuery } from '~/resource-runtime/query';
import { command } from '~/resources/command';
import { resourceRefs } from '~/resources/refs';

export type MemoTemplateQueryArgs = {
  workspaceSlug: string;
  templateSlug: string;
};

export type WorkspaceMemoTemplateQueryArgs = {
  workspaceSlug: string;
};

export const memoTemplateDetailQuery = defineQuery<MemoTemplateQueryArgs, MemoTemplateDetail>({
  key: ({ workspaceSlug, templateSlug }) => ['workspace', workspaceSlug, 'memo-template', templateSlug] as const,
  resources: ({ workspaceSlug, templateSlug }) => [resourceRefs.memoTemplate(workspaceSlug, templateSlug)],
  when: ({ workspaceSlug, templateSlug }) => workspaceSlug.length > 0 && templateSlug.length > 0,
  load: ({ workspaceSlug, templateSlug }) => command.memoTemplate.get({
    workspaceSlugName: workspaceSlug,
    templateSlugName: templateSlug,
  }),
});

export const workspaceMemoTemplatesQuery = defineQuery<WorkspaceMemoTemplateQueryArgs, MemoTemplateIndexItem[]>({
  key: ({ workspaceSlug }) => ['workspace', workspaceSlug, 'memo-templates'] as const,
  resources: ({ workspaceSlug }) => [resourceRefs.memoTemplateCollection(workspaceSlug)],
  when: ({ workspaceSlug }) => workspaceSlug.length > 0,
  load: async ({ workspaceSlug }) => {
    const templates = await command.memoTemplate.list({ slugName: workspaceSlug });
    return sortMemoTemplates(templates);
  },
});
