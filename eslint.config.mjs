import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@next/next/no-html-link-for-pages': 'off',
      // TypeScript best practices - disabled in CI to avoid type information requirements
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      // Strict any usage - only allow with explicit comments
      '@typescript-eslint/no-explicit-any': ['error', {
        ignoreRestArgs: true,
        fixToUnknown: false,
      }],
    },
  },
]

export default eslintConfig
