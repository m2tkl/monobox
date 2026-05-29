# monobox

> [!WARNING]
> 🚧 This project is an experimental stage. Features are not yet stable and are subject to frequent changes and updates.

"monobox" is a note-taking app that supports Scrapbox-like 2-hop links, designed to run entirely in a local environment.

## MCP server

`monobox` starts a read-only MCP server inside the Tauri app itself. The server listens on `127.0.0.1` and uses a tokenized URL path, so MCP clients can connect without launching a separate worker process.

The app must be running before a client connects.

The MCP token is stored in the app config and reused across launches. You can view the current URL from the app UI at `Settings > App > MCP Server`. The same URL is also available from the Tauri config command `get_mcp_server_info`, and is returned as `mcp_server_url` from `get_app_config`.

If you regenerate the URL from the settings screen, restart monobox before switching clients to the new URL.

Example Codex config in `~/.codex/config.toml`:

```toml
[mcp_servers.monobox]
url = "http://127.0.0.1:38453/mcp/<token>"
```

Available tools:

- `get_setup_status`
- `list_workspaces`
- `get_workspace`
- `list_memos`
- `get_memo`
- `search_memos`
- `list_files`
- `get_file_detail`
- `list_memo_files`
- `get_memo_links`

## Release flow

1. Update version files:
   `npm run release:prepare`
   or `npm run release:prepare -- 0.6.3`
2. Review and commit the version bump
3. Create a tag from the clean release commit: `npm run release:tag`
4. Push the tag when ready: `npm run release:push-tag`

`release:prepare` shows recent tags when run without arguments so you can choose the next version while looking at release history.
`release:tag` always uses `package.json` as the source of truth and refuses to tag a dirty worktree. This keeps "version bump" and "tag this commit" as separate steps.
