import eslintJs from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
    eslintJs.configs.recommended,
    {
        files: ['**/*.{ts,js}'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                project: './tsconfig.json',
            },
            globals: {
                ...globals.browser,
                ...globals.es2022,
            },
        },
        plugins: {
            '@typescript-eslint': tseslint,
            prettier: (await import('eslint-plugin-prettier')).default,
        },
        rules: {
            ...tseslint.configs.recommended.rules,
            ...prettierConfig.rules,

            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/consistent-type-imports': 'error',
            'no-console': 'off',
            'prettier/prettier': 'error',
        },
    },
    {
        ignores: ['dist/', 'node_modules/', '*.config.*js'],
    },
];
