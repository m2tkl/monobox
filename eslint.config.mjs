// @ts-check
import pluginTailwindCss from 'eslint-plugin-tailwindcss';

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
}).append(
  pluginTailwindCss.configs['flat/recommended'],
).append({
  rules: {
    'tailwindcss/no-custom-classname': 'off',
  },
});
