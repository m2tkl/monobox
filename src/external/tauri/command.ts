import { bookmarkCommand } from './bookmark';
import { linkCommand } from './link';
import { memoCommand } from './memo';
import { workspaceCommand } from './workspace';

export const command = {
  workspace: workspaceCommand,
  memo: memoCommand,
  link: linkCommand,
  bookmark: bookmarkCommand,
} as const;
