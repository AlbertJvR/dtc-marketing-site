import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default tseslint.config(
  { ignores: ['dist', '.astro'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    // Cloudflare Pages Functions run on the Workers runtime.
    files: ['functions/**/*.ts'],
    languageOptions: {
      globals: { ...globals.serviceworker, PagesFunction: 'readonly' },
    },
  },
  ...astro.configs.recommended,
);
