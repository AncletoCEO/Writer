import globals from 'globals'

export default [
  {
    ignores: ['node_modules/**', '.ancleto/**', 'dist/**', 'coverage/**', 'aspec/**', 'docs/**', 'src/human/vendor/**']
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node
      }
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      eqeqeq: ['error', 'always'],
      'no-dupe-keys': 'error'
    }
  }
]
