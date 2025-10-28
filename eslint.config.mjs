import eslint from '@eslint/js';
import configPrettier from 'eslint-config-prettier';
import configTurbo from 'eslint-config-turbo/flat';
import globals from 'globals';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginImport from 'eslint-plugin-import';
import pluginSimpleImportSort from 'eslint-plugin-simple-import-sort';
import pluginUnusedImports from 'eslint-plugin-unused-imports';
import pluginTurbo from 'eslint-plugin-turbo';
import tseslint from 'typescript-eslint';

const ECMA_VERSION = 2021,
  JAVASCRIPT_FILES = ['**/*.cjs', '**/*.js', '**/*.jsx', '**/*.mjs'],
  TEST_FILES = [
    '**/*.test.js',
    '**/*.test.jsx',
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/test/**',
    '**/__tests__/**',
  ],
  TYPESCRIPT_FILES = ['**/*.cts', '**/*.mts', '**/*.ts', '**/*.tsx'];

export default tseslint.config([
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    languageOptions: {
      ecmaVersion: ECMA_VERSION,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      sourceType: 'module',
    },
  },
  {
    ignores: [
      '.cache',
      '.next',
      '.turbo',
      '**/build/*',
      '.vscode',
      '!.*.js',
      '**/node_modules/**',
      '*.snap',
      '**/.turbo/*',
      '**/dist/*',
      'test',
      'apps',
      'packages/*/dist/**',
      'pnpm-lock.json',
      'eslint.config.mjs',
      'packages/backend/src/runtime/**/*',
      'packages/shared/src/compiled/path-to-regexp/index.js',
      '**/__tests__/**',
    ],
  },
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  ...configTurbo,
  pluginImport.flatConfigs.recommended,
  pluginReact.configs.flat.recommended,
  {
    name: 'global',
    plugins: {
      'simple-import-sort': pluginSimpleImportSort,
      'unused-imports': pluginUnusedImports,
      turbo: pluginTurbo,
    },
    settings: {
      'import/resolver': {
        node: true,
        typescript: {
          alwaysTryTypes: true,
          project: ['packages/*/tsconfig.json'],
        },
      },
    },
    rules: {
      curly: ['error', 'all'],
      'no-label-var': 'error',
      'no-undef-init': 'warn',
      'no-restricted-imports': 'error',

      'react/button-has-type': 'warn',
      'react/function-component-definition': 'off',
      'react/hook-use-state': 'warn',
      'react/jsx-boolean-value': 'warn',
      'react/jsx-curly-brace-presence': 'warn',
      'react/jsx-fragments': 'warn',
      'react/jsx-no-leaked-render': 'warn',
      'react/jsx-no-target-blank': ['error', { allowReferrer: true }],
      'react/jsx-no-useless-fragment': ['warn', { allowExpressions: true }],
      'react/jsx-pascal-case': 'warn',
      'react/jsx-sort-props': 'warn',
      'react/no-array-index-key': 'warn',
      'react/no-unstable-nested-components': 'warn',
      'react/no-unknown-property': ['error', { ignore: ['css'] }], // Emotion
      'react/self-closing-comp': 'warn',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',

      'simple-import-sort/imports': 'error',

      'sort-imports': 'off',

      ...pluginTurbo.configs['flat/recommended'].rules,

      'unused-imports/no-unused-imports': 'error',

      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-declaration-merging': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
    },
  },
  {
    name: 'global-temporary',
    rules: {
      '@typescript-eslint/await-thenable': 'warn',
      '@typescript-eslint/ban-ts-comment': [
        `warn`,
        {
          'ts-ignore': 'allow-with-description',
          'ts-expect-error': 'allow-with-description',
          'ts-check': 'allow-with-description',
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          disallowTypeAnnotations: true,
          fixStyle: 'separate-type-imports',
        },
      ],
      '@typescript-eslint/no-duplicate-type-constituents': 'off',
      '@typescript-eslint/no-floating-promises': [
        'warn',
        {
          ignoreVoid: true,
        },
      ],
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/no-redundant-type-constituents': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/no-unsafe-enum-comparison': 'warn',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/prefer-promise-reject-errors': 'warn',
      '@typescript-eslint/require-await': 'warn',

      'import/no-unresolved': ['error', { ignore: ['^#', '^~'] }],

      'react/button-has-type': 'warn',
      'react/display-name': 'off',
      'react/jsx-curly-brace-presence': 'off',
      'react/jsx-no-leaked-render': 'off',
      'react/jsx-no-useless-fragment': 'warn',
      'react/jsx-sort-props': 'off',
    },
  },
  {
    name: 'repo/javascript',
    files: JAVASCRIPT_FILES,
    rules: {
      'no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          vars: 'all',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    name: 'repo/typescript',
    files: TYPESCRIPT_FILES,
    extends: [pluginImport.flatConfigs.recommended, pluginImport.flatConfigs.typescript],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },
  {
    plugins: {
      'react-hooks': pluginReactHooks,
    },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      'react-hooks/rules-of-hooks': 'warn',
    },
  },
  {
    name: 'packages/nextjs',
    files: ['packages/nextjs/src/**/*'],
    rules: {
      'turbo/no-undeclared-env-vars': [
        'error',
        {
          allowList: ['_NEXT_ROUTER_BASEPATH'],
        },
      ],
    },
  },
  {
    name: 'repo/scripts',
    files: ['scripts/**/*'],
    rules: {
      'turbo/no-undeclared-env-vars': 'off',
    },
  },
  configPrettier,
]);
