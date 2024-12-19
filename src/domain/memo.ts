import type { Link } from "~/models/link";
import { invoke } from "@tauri-apps/api/core";

/********************************
 * Memo operation
 ********************************/

export async function save(
  memo: { workspaceSlug: string; memoSlug: string },
  newMemo: {
    slugTitle: string;
    title: string;
    content: string;
    description: string;
  },
) {
  try {
    await invoke("save_memo", {
      args: {
        workspace_slug_name: memo.workspaceSlug,
        target_slug_title: encodeForSlug(memo.memoSlug),
        new_slug_title: newMemo.slugTitle,
        new_title: newMemo.title,
        new_content: newMemo.content,
        new_description: newMemo.description,
      },
    });
    console.log("Memo saved successfully!");
  } catch (error) {
    console.error("Falied to save memo:", error);
  }
}

export async function trash(memo: { workspaceSlug: string; memoSlug: string }) {
  try {
    await invoke("delete_memo", {
      args: {
        workspace_slug_name: memo.workspaceSlug,
        memo_slug_title: encodeForSlug(memo.memoSlug),
      },
    });
    console.log("Memo deleted successfully!");
  } catch (error) {
    console.error("Failed to delete memo:", error);
  }
}

/********************************
 * Link operation
 ********************************/

export async function createLink(
  memo: { workspaceSlug: string; memoSlug: string },
  targetHref: string,
) {
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
}

export async function deleteLink(
  memo: { workspaceSlug: string; memoSlug: string },
  targetHref: string,
) {
  const [_, linkedWorkspaceSlug, linkedMemoSlug] = targetHref.split("/");
  try {
    const _ = await invoke("delete_link", {
      args: {
        workspace_slug_name: memo.workspaceSlug,
        memo_slug_title: encodeForSlug(memo.memoSlug),
        linked_workspace_slug_name: linkedWorkspaceSlug,
        linked_memo_slug_title: linkedMemoSlug,
      }
    })
    console.log("Link deleted successfully.")
  } catch (error) {
    console.error("Failed to delete link:", error);
  }
}

export async function getLinks(
  memo: { workspaceSlug: string; memoSlug: string },
) {
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
}
