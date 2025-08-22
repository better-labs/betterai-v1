/**
 * ESLint configuration for Prisma serialization rules
 * Add this to your main .eslintrc.js or create as separate config
 */

module.exports = {
  plugins: ['local'],
  rules: {
    // Custom rule to prevent raw Prisma data in client components
    'local/no-raw-prisma-in-client': 'error',
    
    // Prevent importing Prisma in client components
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@prisma/client', '@prisma/client/*'],
            message: 'Prisma client should not be imported in client components. Use API routes or server components instead.',
            allowTypeImports: false
          }
        ]
      }
    ],

    // Ensure proper file naming for client components
    'filename-rules/match': [
      'error',
      {
        '.client.tsx': /\.client\.tsx$/,
        '.server.tsx': /\.server\.tsx$/
      }
    ]
  },
  settings: {
    // Configure the local rules plugin
    'local-rules': {
      'no-raw-prisma-in-client': require('./eslint-rules/no-raw-prisma-in-client.js')
    }
  },
  overrides: [
    {
      // Stricter rules for client components
      files: ['**/*.client.tsx', '**/components/**/*.tsx', '**/app/**/page.tsx'],
      rules: {
        'local/no-raw-prisma-in-client': 'error',
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              '@prisma/client',
              '@prisma/client/*',
              '../lib/db/prisma', // Prevent direct Prisma imports
            ]
          }
        ]
      }
    },
    {
      // Allow Prisma imports in server-side files
      files: [
        '**/api/**/*.ts',
        '**/lib/db/**/*.ts',
        '**/lib/services/**/*.ts',
        '**/*.server.tsx'
      ],
      rules: {
        'no-restricted-imports': 'off'
      }
    }
  ]
}