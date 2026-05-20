import { bookmarkCommand } from './bookmark/commands';
import { fileCommand } from './file/commands';
import { kanbanCommand } from './kanban/commands';
import { kanbanAssignmentCommand } from './kanban-assignment/commands';
import { kanbanStatusCommand } from './kanban-status/commands';
import { memoCommand } from './memo/commands';
import { linkCommand } from './memo-link/commands';
import { memoTemplateCommand } from './memo-template/commands';
import { workspaceCommand } from './workspace/commands';

export const command = {
  workspace: workspaceCommand,
  memo: memoCommand,
  file: fileCommand,
  memoTemplate: memoTemplateCommand,
  link: linkCommand,
  bookmark: bookmarkCommand,
  kanban: kanbanCommand,
  kanbanStatus: kanbanStatusCommand,
  kanbanAssignment: kanbanAssignmentCommand,
} as const;
