import type { Link } from "~/models/link";
import { invoke } from "@tauri-apps/api/core";

export const linkCommand = {
  list: async (
    memo: { workspaceSlug: string; memoSlug: string },
  ) => {
    try {
      const links = await invoke("get_links", {
        args: {
          workspace_slug_name: memo.workspaceSlug,
          memo_slug_title: encodeForSlug(memo.memoSlug),
        },
      });
      console.log("Links reloaded successfully!");
      return links as Array<Link>;
    } catch (error) {
      console.error("Failed to reload links:", error);
    }
  },

  create: async (
    memo: { workspaceSlug: string; memoSlug: string },
    targetHref: string,
  ) => {
    const [, _toLinkWorkspaceSlug, toLinkMemoSlug] = targetHref.split("/");
    try {
      const _ = await invoke("create_link", {
        args: {
          workspace_slug_name: memo.workspaceSlug,
          memo_slug_title: encodeForSlug(memo.memoSlug),
          to_memo_slug_title: toLinkMemoSlug,
        },
      });
      console.log("Link created successfully.");
    } catch (error) {
      console.error("Failed to create link:", error);
    }
  },

  delete: async (
    memo: { workspaceSlug: string; memoSlug: string },
    targetHref: string,
  ) => {
    const [_, linkedWorkspaceSlug, linkedMemoSlug] = targetHref.split("/");
    try {
      const _ = await invoke("delete_link", {
        args: {
          workspace_slug_name: memo.workspaceSlug,
          memo_slug_title: encodeForSlug(memo.memoSlug),
          linked_workspace_slug_name: linkedWorkspaceSlug,
          linked_memo_slug_title: linkedMemoSlug,
        },
      });
      console.log("Link deleted successfully.");
    } catch (error) {
      console.error("Failed to delete link:", error);
    }
  },
};
