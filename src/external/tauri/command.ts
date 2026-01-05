import { bookmarkCommand } from './commands/bookmark';
import { configCommand } from './commands/config';
import { linkCommand } from './commands/link';
import { memoCommand } from './commands/memo';
import { workspaceCommand } from './commands/workspace';

export const command = {
  config: configCommand,
  workspace: workspaceCommand,
  memo: memoCommand,
  link: linkCommand,
  bookmark: bookmarkCommand,
} as const;
