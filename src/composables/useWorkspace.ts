import type { Ref } from "vue";
import { type Workspace } from "~/models/workspace";

export const setWorkspace =
  (workspace: Ref<Workspace | null>) => (wspace: Workspace) => {
    workspace.value = wspace;
  };

export const useWorkspace = () => {
  const workspace = useState<Workspace | null>("workspace", () => null);
  return {
    workspace: readonly(workspace),
    setWorkspace: setWorkspace(workspace),
  };
};
