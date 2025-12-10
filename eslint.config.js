/**
 * ESLint configuration for @kitiumai/logger.
 * Composes the strict @kitiumai/lint presets (base + TS + Node + Jest + Kitium).
 */

import {
  eslintBaseConfig,
  eslintJestConfig,
  eslintKitiumConfig,
  eslintNodeConfig,
  eslintSecurityConfig,
  eslintTypeScriptConfig,
} from '@kitiumai/lint';

const normalize = (config) => (Array.isArray(config) ? config : [config]);

const sharedPresets = [
  ...normalize(eslintBaseConfig),
  ...normalize(eslintTypeScriptConfig),
  ...normalize(eslintNodeConfig),
  ...normalize(eslintJestConfig),
  ...normalize(eslintSecurityConfig),
  ...normalize(eslintKitiumConfig),
];

export default [
  ...sharedPresets,
  {
    name: 'kitium/logger-overrides',
    files: ['**/*.{ts,tsx,js,cjs}'],
    rules: {
      // Allow console usage inside the console capture helper utilities.
      'no-console': 'off',
      // Disable indent rule to avoid conflicts with prettier formatting
      indent: 'off',
      // Re-apply the shared import restriction with ESLint v9-compatible schema.
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['../../*', '../../../*'],
              message: 'Prefer module aliases over deep relative imports for maintainability.',
            },
          ],
        },
      ],
      // Disabled temporarily due to eslint-plugin-import relying on CJS-only minimatch.
      'import/order': 'off',
      // Allow the common middleware abbreviations we rely on.
      'unicorn/prevent-abbreviations': [
        'warn',
        {
          allowList: {
            req: true,
            res: true,
            err: true,
            args: true,
          },
        },
      ],
    },
  },
];
