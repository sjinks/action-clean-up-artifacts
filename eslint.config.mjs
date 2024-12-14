import MyrotvoretsConfig from '@myrotvorets/eslint-config-myrotvorets-ts';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        ignores: ['**/*.js', '**/*.d.ts', 'dist/**', 'lib/**'],
    },
    ...MyrotvoretsConfig,
    {
        languageOptions: {
            globals: {
                ...globals.jest,
            },
        },
    },
];
