import type { MemoTemplateDetail, MemoTemplateIndexItem } from '~/models/memoTemplate';

export const DEFAULT_UNTITLED_TEMPLATE_NAME = 'Untitled template';

export function buildUntitledTemplateName(existingNames: string[]) {
  const usedNames = new Set(existingNames);

  if (!usedNames.has(DEFAULT_UNTITLED_TEMPLATE_NAME)) {
    return DEFAULT_UNTITLED_TEMPLATE_NAME;
  }

  let suffix = 2;
  while (usedNames.has(`${DEFAULT_UNTITLED_TEMPLATE_NAME} ${suffix}`)) {
    suffix += 1;
  }

  return `${DEFAULT_UNTITLED_TEMPLATE_NAME} ${suffix}`;
}

export function sortMemoTemplates(templates: MemoTemplateIndexItem[]) {
  return templates.toSorted((a, b) => a.name.localeCompare(b.name));
}

export function parseTemplateContent(template: Pick<MemoTemplateDetail, 'content'>) {
  return JSON.parse(template.content);
}

export function getDefaultMemoTemplate(templates: MemoTemplateIndexItem[]) {
  return templates.find(template => template.is_default);
}
