# monobox

> [!WARNING]
> 🚧 This project is an experimental stage. Features are not yet stable and are subject to frequent changes and updates.

"monobox" is a note-taking app that supports Scrapbox-like 2-hop links, designed to run entirely in a local environment.

## MCP server

See [docs/mcp.md](docs/mcp.md).

## Release flow

1. Update version files:
   `npm run release:prepare`
   or `npm run release:prepare -- 0.6.3`
2. Review and commit the version bump
3. Create a tag from the clean release commit: `npm run release:tag`
4. Push the tag when ready: `npm run release:push-tag`

`release:prepare` shows recent tags when run without arguments so you can choose the next version while looking at release history.
`release:tag` always uses `package.json` as the source of truth and refuses to tag a dirty worktree. This keeps "version bump" and "tag this commit" as separate steps.
