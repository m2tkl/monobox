import { bookmarkCommand } from './commands/bookmark';
import { linkCommand } from './commands/link';
import { memoCommand } from './commands/memo';
import { workspaceCommand } from './commands/workspace';

export const command = {
  workspace: workspaceCommand,
  memo: memoCommand,
  link: linkCommand,
  bookmark: bookmarkCommand,
} as const;
