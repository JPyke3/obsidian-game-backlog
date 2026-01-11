import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import prettierConfig from 'eslint-config-prettier';

export default [
  eslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'main.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      import: importPlugin,
      jsdoc: jsdocPlugin,
      'unused-imports': unusedImportsPlugin,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...tseslint.configs['recommended-requiring-type-checking'].rules,
      ...importPlugin.configs.typescript.rules,
      ...prettierConfig.rules,

      // Code quality enforcement
      'max-depth': ['error', 3], // Maximum nesting depth of 3

      // JSDoc documentation requirements
      'jsdoc/require-jsdoc': [
        'warn',
        {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: false,
            FunctionExpression: false,
          },
          contexts: ['TSMethodSignature', 'TSFunctionType'],
          checkConstructors: false,
          checkGetters: false,
          checkSetters: false,
        },
      ],
      'jsdoc/require-description': [
        'warn',
        { contexts: ['FunctionDeclaration', 'MethodDefinition'] },
      ],
      'jsdoc/require-param': ['warn', { checkDestructured: false }],
      'jsdoc/require-param-description': 'warn',
      'jsdoc/require-returns': ['warn', { checkGetters: false }],
      'jsdoc/require-returns-description': 'warn',
      'jsdoc/check-param-names': 'error',
      'jsdoc/check-tag-names': 'error',
      'jsdoc/check-types': 'off', // TypeScript handles types

      // Treat warnings as errors
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-unresolved': 'off',
      'import/named': 'off',
      'import/namespace': 'off',
      'import/default': 'off',
      'import/no-named-as-default-member': 'off',
      'import/no-named-as-default': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      'no-console': 'off',
      'no-debugger': 'off',
      'no-empty': 'off',
      'no-extra-semi': 'off',
      'no-irregular-whitespace': 'off',
      'no-prototype-builtins': 'off',
      'no-redeclare': 'off',
      'no-shadow': 'off',
      'no-undef': 'off',
      'no-unused-expressions': 'off',
      'no-use-before-define': 'off',
      'no-var': 'off',
      'prefer-const': 'off',
      'prefer-spread': 'off',
      'prefer-template': 'off',
      quotes: ['warn', 'single', { avoidEscape: true }],
      semi: ['warn', 'always'],
    },
  },
  {
    files: ['tests/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'unused-imports': unusedImportsPlugin,
      jsdoc: jsdocPlugin,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'jsdoc/require-jsdoc': 'off',
      'jsdoc/require-description': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-returns': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'no-undef': 'off',
    },
  },
  {
    ignores: ['node_modules/', 'dist/', '.eslintrc.js', '*.js', 'main.js'],
  },
];
