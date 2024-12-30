import { workspaceCommand as workspace } from "./workspace";
import { memoCommand as memo } from "./memo";
import { linkCommand as link } from "./link";

export const useCommand = () => ({
  workspace,
  memo,
  link,
})
