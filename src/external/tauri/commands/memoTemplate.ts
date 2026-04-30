import { invokeCommand } from '../core/invoker';

import type { MemoTemplateDetail, MemoTemplateIndexItem } from '~/models/memoTemplate';

import { encodeForSlug } from '~/utils/slug';

export const memoTemplateCommand = {
  list: async (workspace: { slugName: string }) => {
    return await invokeCommand<MemoTemplateIndexItem[]>('get_workspace_memo_templates', {
      workspace_slug_name: workspace.slugName,
    });
  },

  get: async (template: { workspaceSlugName: string; templateSlugName: string }) => {
    return await invokeCommand<MemoTemplateDetail>('get_memo_template', {
      workspace_slug_name: template.workspaceSlugName,
      template_slug_name: template.templateSlugName,
    });
  },

  create: async (template: { workspaceSlugName: string; name: string; content: string }) => {
    return await invokeCommand<MemoTemplateDetail>('create_memo_template', {
      workspace_slug_name: template.workspaceSlugName,
      slug_name: encodeForSlug(template.name),
      name: template.name,
      content: template.content,
    });
  },

  save: async (template: { workspaceSlugName: string; targetSlugName: string; name: string; content: string }) => {
    return await invokeCommand('save_memo_template', {
      workspace_slug_name: template.workspaceSlugName,
      target_slug_name: template.targetSlugName,
      new_slug_name: encodeForSlug(template.name),
      new_name: template.name,
      new_content: template.content,
    });
  },

  delete: async (template: { workspaceSlugName: string; templateSlugName: string }) => {
    return await invokeCommand('delete_memo_template', {
      workspace_slug_name: template.workspaceSlugName,
      template_slug_name: template.templateSlugName,
    });
  },

  setDefault: async (template: { workspaceSlugName: string; templateSlugName: string }) => {
    return await invokeCommand('set_default_memo_template', {
      workspace_slug_name: template.workspaceSlugName,
      template_slug_name: template.templateSlugName,
    });
  },

  clearDefault: async (workspace: { workspaceSlugName: string }) => {
    return await invokeCommand('clear_default_memo_template', {
      workspace_slug_name: workspace.workspaceSlugName,
    });
  },
};
