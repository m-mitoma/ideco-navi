import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettierConfig from 'eslint-config-prettier'
import globals from 'globals'

// このプロジェクトは現状ほぼ全ファイルが .ts / .tsx だが、
// typescript-eslint が TypeScript 7系（tsc -b で使用中のバージョン）に
// まだ対応していないため、ESLintは .js/.jsx/.mjs/.cjs のみを対象にしている。
// TypeScript固有の型チェックは引き続き `tsc -b`（tsconfig.app.json）が担う。
export default [
  {
    ignores: ['dist/**', 'node_modules/**', '**/*.ts', '**/*.tsx'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      ...reactRefresh.configs.vite.rules,
    },
  },
  prettierConfig,
]
