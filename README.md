# monobox

> [!WARNING]
> 🚧 This project is an experimental stage. Features are not yet stable and are subject to frequent changes and updates.

"monobox" is a note-taking app that supports Scrapbox-like 2-hop links, designed to run entirely in a local environment.

## MCP server

See [docs/mcp.md](docs/mcp.md).

## Release flow

1. Prepare the version bump, commit it, and create a local tag:
   `npm run release`
   or `npm run release -- 0.6.3`
2. Push the tag when ready: `npm run release:push-tag`

`release:prepare` shows recent tags when run without arguments so you can choose the next version while looking at release history.
`release:tag` always uses `package.json` as the source of truth and refuses to tag a dirty worktree. This keeps "version bump" and "tag this commit" as separate steps.
`release` runs `release:prepare`, commits the version files, and runs `release:tag`. It does not run `release:push-tag`, so pushing the selected tag remains a separate confirmation step.
