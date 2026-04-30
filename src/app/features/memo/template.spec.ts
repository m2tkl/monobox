import { describe, expect, it } from 'vitest';

import {
  buildUntitledMemoTitle,
  buildUntitledTemplateName,
  getDefaultMemoTemplate,
  parseTemplateContent,
  sortMemoTemplates,
} from './template';

import type { MemoTemplateIndexItem } from '~/models/memoTemplate';

const makeTemplate = (overrides: Partial<MemoTemplateIndexItem> = {}): MemoTemplateIndexItem => ({
  id: 1,
  slug_name: 'memo',
  name: 'Memo',
  is_default: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('memo templates', () => {
  it('sorts templates by name even when one is default', () => {
    const templates = sortMemoTemplates([
      makeTemplate({ id: 1, name: 'Zebra', slug_name: 'zebra' }),
      makeTemplate({ id: 2, name: 'Alpha', slug_name: 'alpha' }),
      makeTemplate({ id: 3, name: 'Later', slug_name: 'later', is_default: true }),
    ]);

    expect(templates.map(template => template.name)).toEqual(['Alpha', 'Later', 'Zebra']);
  });

  it('returns the default template when present', () => {
    const template = getDefaultMemoTemplate([
      makeTemplate({ id: 1, slug_name: 'alpha', name: 'Alpha' }),
      makeTemplate({ id: 2, slug_name: 'default', name: 'Default', is_default: true }),
    ]);

    expect(template?.slug_name).toBe('default');
  });

  it('creates the next untitled memo title without collisions', () => {
    expect(buildUntitledMemoTitle([])).toBe('Untitled');
    expect(buildUntitledMemoTitle(['Untitled'])).toBe('Untitled 2');
    expect(buildUntitledMemoTitle(['Untitled', 'Untitled 2', 'Untitled 3'])).toBe('Untitled 4');
  });

  it('creates the next untitled template name without collisions', () => {
    expect(buildUntitledTemplateName([])).toBe('Untitled template');
    expect(buildUntitledTemplateName(['Untitled template'])).toBe('Untitled template 2');
  });

  it('parses template content', () => {
    const parsed = parseTemplateContent({
      content: '{"type":"doc","content":[]}',
    });

    expect(parsed).toEqual({ type: 'doc', content: [] });
  });
});
