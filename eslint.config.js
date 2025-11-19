/**
 * ESLint Configuration (v9 - Flat Config)
 * Uses @kitiumai/lint as the base configuration
 */

import { typeScriptConfig } from '@kitiumai/lint/eslint';

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
  ...typeScriptConfig,
  {
    name: 'project-overrides',
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      // Add your project-specific rule overrides here
    },
  },
];
