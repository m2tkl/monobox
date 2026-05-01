# Table IME Note

This note explains the table-specific IME issue handled in
`src/app/features/memo/editor/useMemoEditor.ts`.

## Symptom

On macOS/WebKit-style IME flows, confirming composition inside a table cell
could cause one of these failures:

- header cells could be reinterpreted into a different table shape
- body cells could duplicate the confirmed text
- an extra empty paragraph could remain in the cell, which looked like a newline

The most reproducible cases were the first confirm in an empty cell and
confirming after replacing selected text inside a cell.

## Root Cause

The problematic sequence inside table cells was:

1. `insertCompositionText` updated the cell with the composing text
2. `deleteCompositionText` cleared the composition DOM state
3. `insertFromComposition` replayed the same confirmed text
4. an `Enter` with `keyCode === 229` followed after composition

In normal paragraphs this flow was harmless, but inside table cells it could
leave ProseMirror with an extra empty paragraph or, in header cells, trigger a
table structure rewrite.

## Current Mitigation

Two targeted guards are in place, and both are intentionally limited to a
composition that starts and ends inside the same table cell:

1. If `insertFromComposition` tries to insert the same text that is already the
   full content of the current table cell, the event is prevented.
2. The cell is normalized back to a single paragraph containing the confirmed
   text, and the caret is restored to the end of that paragraph.
3. The trailing `Enter(keyCode=229)` is prevented while the selection is inside
   a table.

These guards compare the cell text/selection captured at `compositionstart`
against the text already present at `insertFromComposition`, so normal follow-up
input in an unrelated cell state is not suppressed.

Additionally, newly inserted tables default to `withHeaderRow: false` in
`src/app/features/editor/core/action.ts` to avoid the harsher header-cell
variant by default.

## Maintenance Note

If Tiptap/ProseMirror/WebKit behavior changes in the future, re-test Japanese
IME confirm in:

- an empty first cell
- a non-empty cell
- pasted/imported tables

If the upstream behavior is fixed, the guards in `useMemoEditor.ts` may be able
to be removed.
