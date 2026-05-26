import { computed } from 'vue';

import type { ComputedRef } from 'vue';
import type { InboxFileItem, ManagedFileDetail, ManagedFileListItem } from '~/models/file';
import type { MemoIndexItem } from '~/models/memo';
import type { ResourceSnapshot } from '~/resource-runtime/infra/types';

import { defineReadModel } from '~/resource-runtime/read-model';
import { useQuery } from '~/resource-runtime/useQuery';
import { inboxFilesQuery, managedFileDetailQuery, workspaceManagedFilesQuery } from '~/resources/file/queries';
import { workspaceMemosQuery } from '~/resources/memo/queries';

export type ManagedFilesPageReadModel = {
  data: {
    items: ManagedFileListItem[];
    totalCount: number;
    limit: number;
    offset: number;
    memos: MemoIndexItem[];
  };
  flags: {
    isLoading: boolean;
    isStale: boolean;
    hasError: boolean;
  };
};

export type InboxFilesPageReadModel = {
  data: {
    items: InboxFileItem[];
    totalCount: number;
    limit: number;
    offset: number;
    memos: MemoIndexItem[];
  };
  flags: {
    isLoading: boolean;
    isStale: boolean;
    hasError: boolean;
  };
};

export type ManagedFileDetailReadModel = {
  data: {
    detail: ManagedFileDetail | null;
  };
  flags: {
    isLoading: boolean;
    isStale: boolean;
    hasError: boolean;
  };
};

const emptyManagedFileDetailSnapshot: ResourceSnapshot<ManagedFileDetail> = {
  current: null,
  status: 'idle',
  updatedAt: null,
  loadingSince: null,
};

export function useManagedFilesPageReadModel(
  workspaceSlug: ComputedRef<string>,
  currentPage: ComputedRef<number>,
  pageSize: number,
  showUnlinkedOnly: ComputedRef<boolean>,
) {
  const { snapshot: filesSnap } = useQuery(workspaceManagedFilesQuery, {
    workspaceSlug,
    limit: pageSize,
    offset: computed(() => (currentPage.value - 1) * pageSize),
    unlinkedOnly: showUnlinkedOnly,
  });

  const { snapshot: memosSnap } = useQuery(workspaceMemosQuery, {
    workspaceSlug,
  });

  return defineReadModel<ManagedFilesPageReadModel['data']>({
    data: computed(() => ({
      items: filesSnap.value.current?.items ?? [],
      totalCount: filesSnap.value.current?.total_count ?? 0,
      limit: filesSnap.value.current?.limit ?? pageSize,
      offset: filesSnap.value.current?.offset ?? 0,
      memos: memosSnap.value.current ?? [],
    })),
    snapshots: [filesSnap, memosSnap],
  });
}

export function useInboxFilesPageReadModel(
  workspaceSlug: ComputedRef<string>,
  currentPage: ComputedRef<number>,
  pageSize: number,
) {
  const { snapshot: filesSnap } = useQuery(inboxFilesQuery, {
    limit: pageSize,
    offset: computed(() => (currentPage.value - 1) * pageSize),
  });

  const { snapshot: memosSnap } = useQuery(workspaceMemosQuery, {
    workspaceSlug,
  });

  return defineReadModel<InboxFilesPageReadModel['data']>({
    data: computed(() => ({
      items: filesSnap.value.current?.items ?? [],
      totalCount: filesSnap.value.current?.total_count ?? 0,
      limit: filesSnap.value.current?.limit ?? pageSize,
      offset: filesSnap.value.current?.offset ?? 0,
      memos: memosSnap.value.current ?? [],
    })),
    snapshots: [filesSnap, memosSnap],
  });
}

export function useManagedFileDetailReadModel(
  workspaceSlug: ComputedRef<string>,
  fileId: ComputedRef<string>,
) {
  const { snapshot: querySnapshot } = useQuery(managedFileDetailQuery, {
    workspaceSlug,
    fileId,
  }, {
    enabled: computed(() => fileId.value.length > 0),
  });

  const detailSnapshot = computed(() => {
    if (!fileId.value) {
      return emptyManagedFileDetailSnapshot;
    }
    return querySnapshot.value;
  });

  return defineReadModel<ManagedFileDetailReadModel['data']>({
    data: computed(() => ({
      detail: detailSnapshot.value.current ?? null,
    })),
    snapshots: [detailSnapshot],
  });
}
