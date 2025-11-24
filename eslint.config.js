/**
 * ESLint Configuration (v9 - Flat Config)
 * Uses @kitiumai/lint as the base configuration
 */

import { baseConfig, typeScriptConfig, securityConfig } from '@kitiumai/lint/eslint';

export default [
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
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
      'scripts/**/*',
      '**/scripts/**',
    ],
  },
  ...baseConfig,
  ...typeScriptConfig,
  securityConfig,
  {
    name: 'project-overrides',
    files: ['**/*.{js,jsx,ts,tsx,cjs}'],
    rules: {
      // Allow undefined in tests
      'no-undefined': 'off',
      // Allow require-await for methods that return promises but don't need await
      'require-await': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/prefer-readonly': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      'no-restricted-imports': 'off',
      'no-duplicate-imports': 'off',
      'no-useless-escape': 'off',
      curly: ['error', 'multi-line'],
      indent: 'off',
      complexity: 'off',
      'security/detect-unsafe-regex': 'off',
      'security/detect-object-injection': 'off',
    },
  },
  {
    name: 'naming-convention-overrides',
    files: ['**/*.{ts,tsx,js,cjs}'],
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
  {
    name: 'cjs-compat',
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      'no-undef': 'off',
    },
  },
  {
    name: 'scripts-overrides',
    files: ['scripts/**/*.{js,ts,cjs}'],
    languageOptions: {
      parserOptions: {
        project: false,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'security/detect-non-literal-fs-filename': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'max-statements': 'off',
    },
  },
];
