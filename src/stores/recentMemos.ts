import { defineStore } from 'pinia';

export const useRecentMemoStore = defineStore('recentMemos', {
  state: () => ({
    history: [] as Array<{
      title: string;
      slug: string;
      workspace: string;
      hash?: string;
    }>,
  }),
  actions: {
    addMemo(title: string, slug: string, workspace: string, hash?: string, force = false) {
      const key = `${workspace}/${slug}${hash || ''}`;
      const existingIndex = this.history.findIndex(
        m => `${m.workspace}/${m.slug}${m.hash || ''}` === key,
      );

      const newItem = { title, slug, workspace, hash };

      // Skip if it's the top and fully matches
      const top = this.history[0];
      if (
        top
        && top.workspace === workspace
        && top.slug === slug
        && top.hash === hash
        && top.title === title
      ) {
        return;
      }

      if (existingIndex !== -1 && !force) {
        return;
      }

      const withoutExisting = existingIndex >= 0
        ? [...this.history.slice(0, existingIndex), ...this.history.slice(existingIndex + 1)]
        : this.history;

      this.history = [newItem, ...withoutExisting].slice(0, 30);
    },
  },
});
