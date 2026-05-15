import { describe, it, expect } from 'vitest';

import { countTaskItems, getHeadingTextById, summarizeTaskItems, summarizeTaskItemsByOutlineSection } from './query';

import type { JSONContent } from '@tiptap/vue-3';

describe('editor/core/query', () => {
  it('getHeadingTextById returns heading text for matching id', () => {
    const json: JSONContent = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { id: 'a', level: 1 }, content: [{ type: 'text', text: 'Hello' }] },
        { type: 'heading', attrs: { id: 'b', level: 2 }, content: [{ type: 'text', text: 'World' }] },
      ],
    } as const;

    expect(getHeadingTextById(json, 'a')).toBe('Hello');
    expect(getHeadingTextById(json, 'c')).toBeNull();
    expect(getHeadingTextById(json, 'b')).toBe('World');
  });

  it('countTaskItems counts nested task items', () => {
    const json: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'taskList',
          content: [
            { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph' }] },
            {
              type: 'taskItem',
              attrs: { checked: true },
              content: [
                { type: 'paragraph' },
                {
                  type: 'taskList',
                  content: [
                    { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph' }] },
                  ],
                },
              ],
            },
          ],
        },
      ],
    } as const;

    expect(countTaskItems(json)).toBe(3);
    expect(summarizeTaskItems(json)).toEqual({ checked: 1, total: 3 });
  });

  it('summarizeTaskItemsByOutlineSection summarizes task items per heading section', () => {
    const json: JSONContent = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { id: 'h1', level: 1 }, content: [{ type: 'text', text: 'Top' }] },
        {
          type: 'taskList',
          content: [
            { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph' }] },
          ],
        },
        { type: 'heading', attrs: { id: 'h2', level: 2 }, content: [{ type: 'text', text: 'Child' }] },
        {
          type: 'taskList',
          content: [
            { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph' }] },
            { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph' }] },
          ],
        },
        { type: 'heading', attrs: { id: 'h1b', level: 1 }, content: [{ type: 'text', text: 'Next' }] },
        {
          type: 'taskList',
          content: [
            { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph' }] },
          ],
        },
      ],
    } as const;

    expect(summarizeTaskItemsByOutlineSection(json)).toEqual([
      { id: 'h1', checked: 2, total: 3 },
      { id: 'h2', checked: 1, total: 2 },
      { id: 'h1b', checked: 0, total: 1 },
    ]);
  });
});
