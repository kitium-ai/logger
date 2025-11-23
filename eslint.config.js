/**
 * ESLint Configuration (v9 - Flat Config)
 * Uses @kitiumai/lint as the base configuration
 */

import { baseConfig, typeScriptConfig, securityConfig } from '@kitiumai/lint/eslint';

export default [
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      '.next/',
      'out/',
      '.venv/',
      'venv/',
      '.env',
      '.env.local',
      '.env.*.local',
      '*.log',
      '.DS_Store',
      '.cache',
      '.turbo',
      'coverage/',
      'scripts/',
    ],
  },
  ...baseConfig,
  ...typeScriptConfig,
  securityConfig,
  {
    name: 'project-overrides',
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      // Allow undefined in tests
      'no-undefined': 'off',
      // Allow require-await for methods that return promises but don't need await
      'require-await': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },
  {
    name: 'naming-convention-overrides',
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // Allow UPPER_CASE for constants and any format for object literal properties
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          modifiers: ['const'],
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
        },
        {
          selector: 'objectLiteralProperty',
          format: null, // Allow any format for object literal properties (needed for HTTP headers)
        },
      ],
    },
  },
];
