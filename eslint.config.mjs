// @ts-check

// NOTE:
//   eslint-plugin-tailwindcss was removed due to a peer dependency conflict with Tailwind CSS v4.
//   This plugin currently requires Tailwind CSS v3.4, which is incompatible with the latest version used by @nuxt/ui.
//   Until the plugin supports v4, I am proceeding without it to avoid blocking development.
// import pluginTailwindCss from 'eslint-plugin-tailwindcss';

import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt({
  rules: {
    'import/order': [
      'error',
      {
        'groups': [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling', 'index'],
          'object',
          'type',
        ],
        'newlines-between': 'always',
        'alphabetize': {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
  },
});
// .append(
//   pluginTailwindCss.configs['flat/recommended'],
// ).append({
//   rules: {
//     'tailwindcss/no-custom-classname': 'off',
//   },
// });
