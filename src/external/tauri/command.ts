import { bookmarkCommand } from './commands/bookmark';
import { configCommand } from './commands/config';
import { kanbanCommand } from './commands/kanban';
import { kanbanAssignmentCommand } from './commands/kanbanAssignment';
import { kanbanStatusCommand } from './commands/kanbanStatus';
import { linkCommand } from './commands/link';
import { memoCommand } from './commands/memo';
import { workspaceCommand } from './commands/workspace';

export const command = {
  config: configCommand,
  workspace: workspaceCommand,
  memo: memoCommand,
  kanbanStatus: kanbanStatusCommand,
  kanban: kanbanCommand,
  kanbanAssignment: kanbanAssignmentCommand,
  link: linkCommand,
  bookmark: bookmarkCommand,
} as const;
