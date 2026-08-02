import { bookmarkCommand } from './bookmark/commands';
import { calendarDayCommand } from './calendar-day/commands';
import { fileCommand } from './file/commands';
import { focusDailyStateCommand } from './focus-daily-state/commands';
import { kanbanCommand } from './kanban/commands';
import { kanbanAssignmentCommand } from './kanban-assignment/commands';
import { kanbanStatusCommand } from './kanban-status/commands';
import { memoCommand } from './memo/commands';
import { linkCommand } from './memo-link/commands';
import { memoTemplateCommand } from './memo-template/commands';
import { milestoneCommand } from './milestone/commands';
import { workspaceCommand } from './workspace/commands';

export const command = {
  workspace: workspaceCommand,
  memo: memoCommand,
  file: fileCommand,
  focusDailyState: focusDailyStateCommand,
  memoTemplate: memoTemplateCommand,
  link: linkCommand,
  bookmark: bookmarkCommand,
  kanban: kanbanCommand,
  kanbanStatus: kanbanStatusCommand,
  kanbanAssignment: kanbanAssignmentCommand,
  calendarDay: calendarDayCommand,
  milestone: milestoneCommand,
} as const;
