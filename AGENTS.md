# Agent Rules

- When adding a new Iconify/Nuxt icon to `src/utils/icon.ts`, also add the icon name to `icon.clientBundle.icons` in `nuxt.config.ts` so it is included in the client bundle.
- Do not use UI library primitives such as Nuxt UI elements directly in app code. Use an existing wrapper component, or create a wrapper first, for visual/UI elements; this does not apply to components whose primary purpose is feature behavior rather than a reusable UI primitive.
- This repo is npm/package-lock based; use npm commands such as `npm ci` and `npm run test`, and do not use pnpm to install, recover, or run tests unless the repo first adopts a pnpm lockfile/workspace.
- For alert-style dialogs, keep action buttons in the footer, right-aligned, with Cancel on the leading side, the primary/default action on the trailing side, and destructive or data-loss actions between them without primary styling.
- Do not add visible UI labels or headings that merely restate what the interface already makes clear. Keep accessibility labels when needed.
- When adjacent controls mix bordered and borderless button styles, keep them structurally independent and tune spacing around the bordered control. Do not group unlike controls merely to make their gaps uniform; borderless icon buttons should retain the standard spacing and sizing of their peers.
- Align section headings with the primary text axis inside the content they label, not merely with the outer container edge. For card grids, account for the cards' internal padding and use the same spacing value rather than an arbitrary visual offset.
