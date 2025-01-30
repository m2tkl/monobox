import { linkCommand as link } from './link';
import { memoCommand as memo } from './memo';
import { workspaceCommand as workspace } from './workspace';

export const useCommand = () => ({
  workspace,
  memo,
  link,
});
