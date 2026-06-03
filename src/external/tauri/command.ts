import { bookmarkCommand } from './commands/bookmark';
import { calendarDayCommand } from './commands/calendarDay';
import { configCommand } from './commands/config';
import { fileCommand } from './commands/file';
import { focusMemoCommand } from './commands/focusMemo';
import { kanbanCommand } from './commands/kanban';
import { kanbanAssignmentCommand } from './commands/kanbanAssignment';
import { kanbanStatusCommand } from './commands/kanbanStatus';
import { linkCommand } from './commands/link';
import { memoCommand } from './commands/memo';
import { memoTemplateCommand } from './commands/memoTemplate';
import { milestoneCommand } from './commands/milestone';
import { workspaceCommand } from './commands/workspace';

export const command = {
  config: configCommand,
  file: fileCommand,
  focusMemo: focusMemoCommand,
  workspace: workspaceCommand,
  memo: memoCommand,
  memoTemplate: memoTemplateCommand,
  kanbanStatus: kanbanStatusCommand,
  kanban: kanbanCommand,
  kanbanAssignment: kanbanAssignmentCommand,
  link: linkCommand,
  bookmark: bookmarkCommand,
  calendarDay: calendarDayCommand,
  milestone: milestoneCommand,
} as const;
