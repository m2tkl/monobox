# monobox

> [!WARNING]
> 🚧 This project is an experimental stage. Features are not yet stable and are subject to frequent changes and updates.

"monobox" is a note-taking app that supports Scrapbox-like 2-hop links, designed to run entirely in a local environment.

## MCP server

`monobox` starts a read-only MCP server inside the Tauri app itself. By default, the server listens on `127.0.0.1` and uses a tokenized URL path, so MCP clients can connect without launching a separate worker process.

The app must be running before a client connects.

The MCP token is stored in the app config and reused across launches. You can view the current URL from the app UI at `Settings > App > MCP Server`. The same URL is also available from the Tauri config command `get_mcp_server_info`, and is returned as `mcp_server_url` from `get_app_config`.

If you regenerate the URL from the settings screen, restart monobox before switching clients to the new URL.

Example Codex config in `~/.codex/config.toml`:

```toml
[mcp_servers.monobox]
url = "http://127.0.0.1:38453/mcp/<token>"
```

When monobox is running on Windows and the MCP client is running inside WSL, `127.0.0.1` from the client points at WSL, not Windows. Set the monobox app config on Windows like this, restart monobox, then use the displayed URL in the WSL-side client:

```json
{
  "mcp_bind_host": "0.0.0.0",
  "mcp_url_host": "<windows-host-ip>"
}
```

You can usually find `<windows-host-ip>` from WSL with `awk '/nameserver/ { print $2; exit }' /etc/resolv.conf`. Windows Firewall must allow inbound TCP access to the configured MCP port, which defaults to `38453`.

Available tools:

- `get_setup_status`
- `list_workspaces`
- `get_workspace`
- `list_memos`
- `get_memo`
- `get_memo_plain_text`
- `get_memo_context`
- `get_current_memo`
- `get_current_memo_plain_text`
- `get_current_memo_context`
- `search_memos`
- `list_files`
- `get_file_detail`
- `list_memo_files`
- `get_memo_links`

Use `get_memo_plain_text` when you want one specific memo in a lightweight summarization-friendly shape. Use `get_current_memo_plain_text` when you want the memo currently open in the app. Both return the title, description, plain text body, and timestamps.

`get_memo_context` is the higher-level tool for one specific memo. `get_current_memo_context` is the same idea for the memo currently open in the app. Both are plain-text first: they omit `memo.content` JSON unless you set `include_content_json = true`.

It can return:

- the current memo with `plain_text`
- grouped related memos for `forward`, `backward`, and `two_hop` links
- attached file names
- `context_text`, a single plain-text export that combines the current memo and related context

Useful options:

- `include_content_json`
- `include_plain_text`
- `include_links`
- `include_files`
- `include_context_text`
- `include_related_memo_plain_text`
- `max_related_memos_per_group`

For safer summarization defaults, `include_related_memo_plain_text` is `false` unless you explicitly turn it on.

## Release flow

1. Update version files:
   `npm run release:prepare`
   or `npm run release:prepare -- 0.6.3`
2. Review and commit the version bump
3. Create a tag from the clean release commit: `npm run release:tag`
4. Push the tag when ready: `npm run release:push-tag`

`release:prepare` shows recent tags when run without arguments so you can choose the next version while looking at release history.
`release:tag` always uses `package.json` as the source of truth and refuses to tag a dirty worktree. This keeps "version bump" and "tag this commit" as separate steps.
