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
    addMemo(title: string, slug: string, workspace: string, hash?: string) {
      const key = `${workspace}/${slug}${hash || ''}`;
      this.history = [
        { title, slug, workspace, hash },
        ...this.history.filter(m => `${m.workspace}/${m.slug}${m.hash || ''}` !== key),
      ].slice(0, 10);
    },
  },
});
