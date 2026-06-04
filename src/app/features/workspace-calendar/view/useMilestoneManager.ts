import { countWorkingDaysBetween } from '../calendarUtils';

import type { MemoIndexItem } from '~/models/memo';
import type { Milestone } from '~/models/milestone';

import { command } from '~/resources/command';
import { handleError } from '~/utils/error';

type MilestoneManagerOptions = {
  milestones: Milestone[];
  memos: MemoIndexItem[];
  workspaceSlug: string;
  today: string;
  nonWorkingDates: Set<string>;
};

export const useMilestoneManager = (options: MilestoneManagerOptions) => {
  const toast = useToast();
  const milestoneStateFilter = ref<'open' | 'closed'>('open');
  const newMilestoneTitle = ref('');
  const newMilestoneDate = ref(options.today);
  const selectedMilestoneMemoSlugs = ref<Record<number, string | number | null>>({});
  const isDeleteMilestoneConfirmationOpen = ref(false);
  const isDeletingMilestone = ref(false);
  const pendingDeleteMilestone = ref<Milestone | null>(null);

  const openMilestoneCount = computed(() => options.milestones.filter(milestone => !milestone.completed_at).length);
  const closedMilestoneCount = computed(() => options.milestones.length - openMilestoneCount.value);
  const filteredMilestones = computed(() =>
    options.milestones.filter(milestone =>
      milestoneStateFilter.value === 'open' ? !milestone.completed_at : !!milestone.completed_at,
    ),
  );
  const deleteMilestoneConfirmationDescription = computed(() => {
    const title = pendingDeleteMilestone.value?.title ?? 'This milestone';
    return `${title} will be deleted permanently. Linked memos will not be deleted.`;
  });

  watch(isDeleteMilestoneConfirmationOpen, (open) => {
    if (!open && !isDeletingMilestone.value) {
      clearDeleteMilestoneConfirmation();
    }
  });

  const getMilestoneDaysLabel = (date: string, completed: boolean) => {
    if (completed) return 'Done';
    const daysRemaining = countWorkingDaysBetween(options.today, date, options.nonWorkingDates);
    if (daysRemaining === 0) return 'Today';
    if (daysRemaining > 0) return `${daysRemaining}d`;
    return `${Math.abs(daysRemaining)}d overdue`;
  };

  const createMilestone = async () => {
    const title = newMilestoneTitle.value.trim();
    if (!title || !newMilestoneDate.value) return;
    try {
      await command.milestone.create({
        workspaceSlugName: options.workspaceSlug,
        date: newMilestoneDate.value,
        title,
      });
      newMilestoneTitle.value = '';
    }
    catch (error) {
      const appError = handleError(error);
      toast.add({
        title: 'Failed to create milestone.',
        description: appError.message,
        color: 'error',
      });
    }
  };

  const updateMilestone = async (milestone: Milestone, value: { date?: string; title?: string }) => {
    const title = (value.title ?? milestone.title).trim();
    const date = value.date ?? milestone.date;
    if (!title || !date) return;
    if (title === milestone.title && date === milestone.date) return;
    try {
      await command.milestone.update({
        workspaceSlugName: options.workspaceSlug,
        id: milestone.id,
        date,
        title,
      });
    }
    catch (error) {
      const appError = handleError(error);
      toast.add({
        title: 'Failed to update milestone.',
        description: appError.message,
        color: 'error',
      });
    }
  };

  const updateMilestoneTitle = async (milestone: Milestone, event: Event) => {
    const target = event.target as HTMLInputElement | null;
    await updateMilestone(milestone, { title: target?.value ?? '' });
  };

  const updateMilestoneDate = async (milestone: Milestone, event: Event) => {
    const target = event.target as HTMLInputElement | null;
    await updateMilestone(milestone, { date: target?.value ?? '' });
  };

  const getMilestoneMemoOptions = (milestone: Milestone) => {
    const linkedSlugs = new Set(milestone.memos.map(memo => memo.slug_title));
    return options.memos
      .filter(memo => !linkedSlugs.has(memo.slug_title))
      .map(memo => ({
        label: memo.title,
        value: memo.slug_title,
      }));
  };

  const selectMilestoneMemo = (milestoneId: number, memoSlug: string | number | null) => {
    selectedMilestoneMemoSlugs.value = {
      ...selectedMilestoneMemoSlugs.value,
      [milestoneId]: memoSlug,
    };
  };

  const addMilestoneMemo = async (milestoneId: number) => {
    const memoSlug = selectedMilestoneMemoSlugs.value[milestoneId];
    if (typeof memoSlug !== 'string' || !memoSlug) return;
    try {
      await command.milestone.addMemo({
        workspaceSlugName: options.workspaceSlug,
        id: milestoneId,
        memoSlugTitle: memoSlug,
      });
      selectedMilestoneMemoSlugs.value = {
        ...selectedMilestoneMemoSlugs.value,
        [milestoneId]: null,
      };
    }
    catch (error) {
      const appError = handleError(error);
      toast.add({
        title: 'Failed to link memo.',
        description: appError.message,
        color: 'error',
      });
    }
  };

  const removeMilestoneMemo = async (milestoneId: number, memoSlug: string) => {
    try {
      await command.milestone.removeMemo({
        workspaceSlugName: options.workspaceSlug,
        id: milestoneId,
        memoSlugTitle: memoSlug,
      });
    }
    catch (error) {
      const appError = handleError(error);
      toast.add({
        title: 'Failed to unlink memo.',
        description: appError.message,
        color: 'error',
      });
    }
  };

  const setMilestoneCompleted = async (id: number, completed: boolean) => {
    try {
      await command.milestone.setCompleted({
        workspaceSlugName: options.workspaceSlug,
        id,
        completed,
      });
    }
    catch (error) {
      const appError = handleError(error);
      toast.add({
        title: 'Failed to update milestone.',
        description: appError.message,
        color: 'error',
      });
    }
  };

  const openDeleteMilestoneConfirmation = (milestone: Milestone) => {
    pendingDeleteMilestone.value = milestone;
    isDeleteMilestoneConfirmationOpen.value = true;
  };

  const clearDeleteMilestoneConfirmation = () => {
    pendingDeleteMilestone.value = null;
  };

  const confirmDeleteMilestone = async () => {
    const milestone = pendingDeleteMilestone.value;
    if (!milestone) {
      isDeleteMilestoneConfirmationOpen.value = false;
      return;
    }
    await deleteMilestone(milestone.id);
  };

  const deleteMilestone = async (id: number) => {
    isDeletingMilestone.value = true;
    try {
      await command.milestone.delete({
        workspaceSlugName: options.workspaceSlug,
        id,
      });
      isDeleteMilestoneConfirmationOpen.value = false;
      pendingDeleteMilestone.value = null;
    }
    catch (error) {
      const appError = handleError(error);
      toast.add({
        title: 'Failed to delete milestone.',
        description: appError.message,
        color: 'error',
      });
    }
    finally {
      isDeletingMilestone.value = false;
    }
  };

  return {
    milestoneStateFilter,
    newMilestoneTitle,
    newMilestoneDate,
    selectedMilestoneMemoSlugs,
    isDeleteMilestoneConfirmationOpen,
    isDeletingMilestone,
    openMilestoneCount,
    closedMilestoneCount,
    filteredMilestones,
    deleteMilestoneConfirmationDescription,
    getMilestoneDaysLabel,
    createMilestone,
    updateMilestoneTitle,
    updateMilestoneDate,
    getMilestoneMemoOptions,
    selectMilestoneMemo,
    addMilestoneMemo,
    removeMilestoneMemo,
    setMilestoneCompleted,
    openDeleteMilestoneConfirmation,
    clearDeleteMilestoneConfirmation,
    confirmDeleteMilestone,
  };
};
