module.exports = {
    parser: '@typescript-eslint/parser',
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    plugins: ['@typescript-eslint'],
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        },
    },
    env: {
        browser: true,
        node: true,
        es6: true,
        jest: true,
    },
    rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off', // Disable unused vars checking completely

        // Disable all formatting rules
        'indent': 'off',
        'quotes': 'off',
        'semi': 'off',
        'comma-dangle': 'off',
        'max-len': 'off',
        'no-trailing-spaces': 'off',
        'eol-last': 'off',
    },
    settings: {
        react: {
            version: 'detect',
        },
    },
};