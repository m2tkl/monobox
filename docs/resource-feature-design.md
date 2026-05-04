# Resource Feature Design

## Goal

Add `resource` as a memo-attached reference object for uploaded files and external URLs, without weakening the current memo-centric link model.

## Design Direction

- `memo` remains the primary knowledge unit.
- Memo-to-memo links and 2-hop links remain the core concept.
- `resource` is treated as supporting material.
- Resources are searchable, but they do not participate in memo-style graph expansion.
- Resource references are distinct from page links in both UI and data model.

In short:

- memos link to memos
- memos can reference resources
- resources do not form a first-class link graph

## Explicit Assumptions

- Resources belong to a workspace.
- Resources are created either from a local file upload or an external URL.
- "Searchable like memo" means resources appear in workspace search results, but this does not imply memo-equivalent graph behavior.
- Resource search in v1 is metadata-based: title, description, original file name, stored file name, URL.
- We do not extract full text from arbitrary binary files in v1.
- We do not add resource-to-resource 2-hop links.
- We do not make resources a subtype of memo.

## Behavioral Rules

1. A resource always belongs to one workspace.
2. Uploaded files are copied into a configurable resource directory.
3. Uploaded file names are rewritten to `<basename>--<id>.<ext>`.
4. The random ID exists only to avoid collisions and does not define user-visible meaning.
5. URL resources are stored as metadata records and are not downloaded locally in v1.
6. Resources can be referenced from memos.
7. Resource references do not count as memo graph edges for 2-hop link computation.
8. Search results must distinguish memo and resource.
9. Renaming a resource must not require any graph rewrite logic beyond updating direct memo references if the href format depends on slug.
10. The memo link model should stay understandable as "links between notes", not "links between everything".
11. Users must be able to distinguish "page link" and "resource reference" at a glance while editing and reading.

## What This Means Conceptually

Keep these concepts separate:

- `memo`: a note in the knowledge graph
- `resource`: an attachment/reference that supports a memo or workspace

This preserves the existing product identity:

- Users navigate ideas through memos.
- Users open files and URLs as supporting evidence.

## Recommended Model

### Resource entity

Add a dedicated `resource` table.

Suggested columns:

- `id INTEGER PRIMARY KEY`
- `workspace_id INTEGER NOT NULL`
- `slug_name TEXT NOT NULL`
- `kind TEXT NOT NULL CHECK(kind IN ('file', 'url'))`
- `title TEXT`
- `description TEXT`
- `original_name TEXT`
- `stored_name TEXT`
- `file_path TEXT`
- `file_size INTEGER`
- `mime_type TEXT`
- `url TEXT`
- `created_at TEXT DEFAULT CURRENT_TIMESTAMP`
- `updated_at TEXT DEFAULT CURRENT_TIMESTAMP`
- `modified_at TEXT DEFAULT CURRENT_TIMESTAMP`

Constraints:

- `UNIQUE(workspace_id, slug_name)`
- `kind = 'file'` requires `file_path` and `stored_name`
- `kind = 'url'` requires `url`

Notes:

- `title` is the main display/search field.
- `original_name` preserves the user-selected file name.
- `stored_name` preserves the collision-safe copied file name.
- No rich note body is required for v1.

### Resource search index

Add `resource_fts`.

Suggested columns:

- `title`
- `description`
- `original_name`
- `stored_name`
- `url`
- `resource_id UNINDEXED`
- `workspace_id UNINDEXED`
- `slug_name UNINDEXED`
- `kind UNINDEXED`

Why separate from `memo_fts`:

- keeps memo search behavior stable
- lets us add resources to search without coupling their internals to memo content

## Resource References From Memo

Do not replace the current memo-to-memo `link` table with a generic graph.

Instead, add a separate table for memo-to-resource references.

Suggested schema:

- `id INTEGER PRIMARY KEY`
- `memo_id INTEGER NOT NULL`
- `resource_id INTEGER NOT NULL`
- `created_at TEXT DEFAULT CURRENT_TIMESTAMP`
- `UNIQUE(memo_id, resource_id)`
- `FOREIGN KEY (memo_id) REFERENCES memo(id) ON DELETE CASCADE`
- `FOREIGN KEY (resource_id) REFERENCES resource(id) ON DELETE CASCADE`

This keeps the semantics clean:

- `link` means note graph edge
- `memo_resource` means attachment/reference edge

That separation is the main design correction from the earlier draft.

## Distinguishing Page Links And Resource References

This distinction should exist in both storage and presentation.

### Data model

- page links are stored in `link`
- resource references are stored in `memo_resource`
- they are synchronized by different save paths

### Editor semantics

- page link: a navigational/internal knowledge link to another memo
- resource reference: an attached supporting material

These should not look identical in the editor.

Recommended v1 approach:

- keep normal inline links for memo-to-memo page links
- introduce a dedicated `resource reference` node or marked inline token for resources

Examples:

- page link UI: `[[weekly-review]]` equivalent behavior via current memo link flow
- resource reference UI: attachment-like chip such as `[@spec.pdf]` or a file/url pill

The exact visual syntax can vary, but the user should not confuse it with a page link.

### Reader view

Resource references should render with different affordances from page links, for example:

- file icon or external-link icon
- type badge such as `File` / `URL`
- optional secondary metadata like original file name or host

### Why this matters

If both are rendered as the same plain link:

- users will assume resources participate in the same graph semantics
- memo navigation and supporting material become conceptually blurred
- 2-hop mental model becomes harder to trust

## Routing and Link Format

Keep memo routes unchanged:

- `/:workspace/:memoSlug`

Add resource routes under a reserved segment:

- `/:workspace/resources/:resourceSlug`

Internal editor links may still use hrefs to resource pages:

- memo target: `/${workspace}/${memoSlug}`
- resource target: `/${workspace}/resources/${resourceSlug}`

But only memo targets should feed the existing memo graph logic.

Even if both use href-like storage internally, the editor component should expose them as different insert actions and different rendered styles.

In practice:

- memo save continues computing memo-link diffs as today
- resource hrefs are detected separately and stored in `memo_resource`

## Config Design

Extend `AppConfig` with:

- `resource_dir_path: string`

Default:

- `${app_data_dir}/_resources/`

Validation rules:

- must be a directory path
- create it when `create_missing = true`
- suitable for user-managed synced folders such as OneDrive

UI changes:

- add a third storage field next to database and asset directory
- label it `Resource folder`

Keep `asset_dir_path` separate:

- assets are editor internals such as pasted images
- resources are user-managed files/URLs

## Backend API Design

### Tauri commands

Add:

- `get_workspace_resources`
- `get_resource`
- `create_uploaded_resource`
- `create_url_resource`
- `update_resource`
- `delete_resource`
- `search_workspace_content`

Optional later:

- `open_resource_file`
- `reveal_resource_file`

### Upload flow

`create_uploaded_resource` should:

1. accept the selected source file
2. read metadata
3. generate a random ID
4. create `<stem>--<id><ext>`
5. copy the file into `resource_dir_path`
6. create the `resource` row
7. insert `resource_fts`
8. return the created resource

ID recommendation:

- use `Uuid::new_v4()`
- use an 8-12 char lowercase prefix in the file name

Example:

- `spec.pdf` -> `spec--a1b2c3d4.pdf`

### URL flow

`create_url_resource` should:

1. validate URL format
2. create a `kind = 'url'` resource row
3. derive a default title when omitted
4. insert `resource_fts`

## Search Design

Introduce a unified workspace search response that returns both memos and resources.

Suggested result type:

- `kind: 'memo' | 'resource'`
- `id`
- `slug`
- `title`
- `description`
- `snippet`
- `modified_at`
- `resource_kind?: 'file' | 'url'`

Search behavior:

- memo search continues using `memo_fts`
- resource search uses `resource_fts`
- response merges both
- UI shows type badges

Important:

- resources are searchable siblings in the search UI
- they are not graph-equal siblings in the link model

## Frontend Design

### New screens

- workspace resource list
- resource detail view
- resource creation flow:
  - upload file
  - register URL

### Resource detail page

Show:

- title
- description
- type
- file name or URL
- open action
- reveal in folder action for file resources
- memos that reference this resource

That last point is useful and still memo-centric:

- users can move from a file back to the notes that mention it
- without turning the resource into a graph node with 2-hop behavior

### Search page

Update search results to:

- show memos and resources
- route to memo page or resource page based on kind

### Memo editor integration

Extend the editor so memo authors can insert resource references separately from page links.

Recommended UX:

- keep page-link flow as-is
- add a separate `Insert resource` action
- resource insertion UI should be separated from `Insert page link`
- do not create resources inline from the page-link flow in v1

Reason:

- avoids file-picker complexity during note editing
- keeps "link to page" and "attach resource" as different user intents

Suggested UI:

- `Link page`
- `Attach resource`

Not:

- one mixed picker where memos and resources are visually equal

## Repository Layer Changes

### New `ResourceRepository`

Owns:

- list/find/create/update/delete resource rows
- FTS maintenance
- search queries

### New `MemoResourceRepository`

Owns:

- syncing resource references found in memo content
- listing memos that reference a resource
- deleting stale memo-resource references

### Existing `LinkRepository`

Stays memo-focused:

- memo-to-memo links only
- existing 2-hop logic stays intact

This is the key preservation point.

## Parsing Strategy In Memo Save

Today memo save computes changed internal hrefs and syncs the `link` table.

Refine that logic into two buckets:

- memo hrefs: `/${workspace}/${memoSlug}`
- resource references: resource node/token payload or `/${workspace}/resources/${resourceSlug}`

Then sync separately:

- memo hrefs -> existing `link`
- resource references -> new `memo_resource`

This gives us resource references without redefining what a memo link means.

## Delete Policy

Recommended default:

- deleting a file resource deletes the copied file from `resource_dir_path`
- deleting a URL resource deletes only metadata

Both cases should also remove:

- `resource_fts` row
- `memo_resource` rows

If local file deletion fails, return a clear error.

## Open Questions

1. Should a resource always be referenced by at least one memo, or can it exist independently in a workspace?
2. Should the resource detail page allow a freeform note field later, or stay metadata-only for now?
3. Should search rank memos above resources by default?
4. Should resources be bookmarkable?
5. What exact editor representation should resource references use: chip node, inline token, or styled link mark?

## Recommended Decisions For V1

- keep memo graph semantics unchanged
- do not add resource-to-resource links
- do not add resource 2-hop logic
- add a separate `memo_resource` relation
- distinguish page links and resource references in both UI and storage semantics
- add `resource_dir_path` to config
- add resource search through a separate FTS table
- add resource pages and resource search results
- let memos reference resources, but do not make resources memo-equivalent

## Implementation Order

1. Add `resource_dir_path` to config and settings UI.
2. Add `resource` and `resource_fts` schema.
3. Add `memo_resource` schema.
4. Add resource CRUD commands and repository.
5. Extend search to include resources.
6. Extend memo editor reference picker and memo-save sync logic.
7. Add resource detail/list UI.

## Tests To Add

- generated file name uses `--id` and preserves extension
- uploaded file is copied into configured `resource_dir_path`
- upload never overwrites an existing file
- URL resource creation rejects invalid URLs
- unified search returns both memos and resources
- memo-to-memo 2-hop behavior is unchanged after resource feature is added
- memo-to-resource references are stored in `memo_resource`
- deleting a resource removes `memo_resource` rows
- config validation covers `resource_dir_path`
