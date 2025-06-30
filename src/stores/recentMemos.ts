import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useRecentMemoStore = defineStore('recentMemos',
  () => {
    const history = ref<Array<{
      title: string;
      slug: string;
      workspace: string;
      hash?: string;
    }>>([]);

    function addMemo(title: string, slug: string, workspace: string, hash?: string, force = false) {
      const key = `${workspace}/${slug}${hash || ''}`;
      const existingIndex = history.value.findIndex(
        m => `${m.workspace}/${m.slug}${m.hash || ''}` === key,
      );

      const newItem = { title, slug, workspace, hash };

      const top = history.value[0];
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
        ? [...history.value.slice(0, existingIndex), ...history.value.slice(existingIndex + 1)]
        : history.value;

      history.value = [newItem, ...withoutExisting].slice(0, 30);
    }

    return { history, addMemo };
  },
  {
    persist: {
      storage: sessionStorage,
      paths: ['history'],
    },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
);
