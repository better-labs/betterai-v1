import { fixupConfigRules } from '@eslint/compat'
import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname
})

export default [
  // Extend Next.js configs using compatibility layer
  ...fixupConfigRules(compat.extends('next/core-web-vitals', 'next/typescript')),
  
  // Custom rules for Prisma import restrictions
  {
    name: 'prisma-import-restrictions',
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@prisma/client'],
              importNamePattern: '^(?!type\\s).*$',
              message: 'Direct Prisma imports not allowed in client components. Use *Serialized query methods from lib/db/queries instead.'
            },
            {
              group: ['@prisma/client/runtime/library'],
              message: 'Prisma runtime imports cause build errors. Use runtime detection patterns instead.'
            }
          ]
        }
      ]
    }
  }
]