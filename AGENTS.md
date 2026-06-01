# Agent Rules

- When adding a new Iconify/Nuxt icon to `src/utils/icon.ts`, also add the icon name to `icon.clientBundle.icons` in `nuxt.config.ts` so it is included in the client bundle.
- Do not use UI library primitives such as Nuxt UI elements directly in app code. Use an existing wrapper component, or create a wrapper first, for visual/UI elements; this does not apply to components whose primary purpose is feature behavior rather than a reusable UI primitive.
