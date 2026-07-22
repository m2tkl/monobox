# Agent Rules

- When adding a new Iconify/Nuxt icon to `src/utils/icon.ts`, also add the icon name to `icon.clientBundle.icons` in `nuxt.config.ts` so it is included in the client bundle.
- Do not use UI library primitives such as Nuxt UI elements directly in app code. Use an existing wrapper component, or create a wrapper first, for visual/UI elements; this does not apply to components whose primary purpose is feature behavior rather than a reusable UI primitive.
- This repo is npm/package-lock based; use npm commands such as `npm ci` and `npm run test`, and do not use pnpm to install, recover, or run tests unless the repo first adopts a pnpm lockfile/workspace.
- For alert-style dialogs, keep action buttons in the footer, right-aligned, with Cancel on the leading side, the primary/default action on the trailing side, and destructive or data-loss actions between them without primary styling.
