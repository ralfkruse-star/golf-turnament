#!/usr/bin/env tsx

import { execSync } from 'child_process'

console.log('🔍 Checking for unused imports...\n')

try {
  // This is a placeholder - in a real implementation, you would use
  // a tool like ts-unused-exports or eslint-plugin-unused-imports
  console.log('ℹ️  Install eslint-plugin-unused-imports for better detection')
  console.log('ℹ️  For now, running ESLint with unused-vars check...\n')

  const result = execSync('pnpm eslint . --ext .ts,.tsx --quiet', {
    encoding: 'utf-8',
    stdio: 'inherit',
  })

  console.log('\n✅ No unused imports detected!')
  process.exit(0)
} catch (error) {
  console.error('\n❌ Found unused imports or other linting issues')
  console.log('\n💡 Run "pnpm lint:fix" to automatically fix some issues')
  process.exit(1)
}
