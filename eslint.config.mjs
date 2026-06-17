import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      // Ignore built files.
      'dist/**',
      'src/interactions-deprecated/**',
      'src/interactions-private/**',
      'src/interactions/**',
      'src/gaos/**',
      'src/gaos-private/**',
    ],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          'argsIgnorePattern': '^_',
          'varsIgnorePattern': '^_',
        },
      ],
      '@typescript-eslint/no-empty-object-type': [
        'error',
        {
          'allowInterfaces': 'always',
        },
      ],
    },
  },
];
