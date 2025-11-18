module.exports = {
  // TypeScript and TSX files
  '**/*.{ts,tsx}': (filenames) => [
    `pnpm eslint --fix ${filenames.join(' ')}`,
    `pnpm prettier --write ${filenames.join(' ')}`,
    // Only run type-check on staged files, not all files
    () => 'pnpm type-check',
  ],

  // JavaScript files
  '**/*.{js,jsx}': (filenames) => [
    `pnpm eslint --fix ${filenames.join(' ')}`,
    `pnpm prettier --write ${filenames.join(' ')}`,
  ],

  // JSON, YAML, and Markdown files
  '**/*.{json,yml,yaml,md}': (filenames) => [
    `pnpm prettier --write ${filenames.join(' ')}`,
  ],

  // CSS and SCSS files
  '**/*.{css,scss}': (filenames) => [
    `pnpm prettier --write ${filenames.join(' ')}`,
  ],

  // Run tests for affected test files
  '**/*.test.{ts,tsx}': (filenames) => [
    `pnpm vitest related ${filenames.join(' ')} --run`,
  ],
}
