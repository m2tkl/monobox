import { command as tauriCommand } from '~/external/tauri/command';
import { publishResourceChanges } from '~/resource-runtime/query-runtime';
import { changeRefs } from '~/resources/changes';

const publishMilestoneChange = (workspaceSlug: string) => {
  void publishResourceChanges([changeRefs.milestoneCollectionChanged(workspaceSlug)]);
};

export const milestoneCommand = {
  list: (params: { workspaceSlugName: string; year: number }) => tauriCommand.milestone.list(params),
  create: async (params: {
    workspaceSlugName: string;
    date: string;
    title: string;
  }) => {
    await tauriCommand.milestone.create(params);
    publishMilestoneChange(params.workspaceSlugName);
  },
  update: async (params: {
    workspaceSlugName: string;
    id: number;
    date: string;
    title: string;
  }) => {
    await tauriCommand.milestone.update(params);
    publishMilestoneChange(params.workspaceSlugName);
  },
  addMemo: async (params: { workspaceSlugName: string; id: number; memoSlugTitle: string }) => {
    await tauriCommand.milestone.addMemo(params);
    publishMilestoneChange(params.workspaceSlugName);
  },
  removeMemo: async (params: { workspaceSlugName: string; id: number; memoSlugTitle: string }) => {
    await tauriCommand.milestone.removeMemo(params);
    publishMilestoneChange(params.workspaceSlugName);
  },
  setCompleted: async (params: { workspaceSlugName: string; id: number; completed: boolean }) => {
    await tauriCommand.milestone.setCompleted(params);
    publishMilestoneChange(params.workspaceSlugName);
  },
  delete: async (params: { workspaceSlugName: string; id: number }) => {
    await tauriCommand.milestone.delete(params);
    publishMilestoneChange(params.workspaceSlugName);
  },
} as const;
