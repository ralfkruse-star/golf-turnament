#!/usr/bin/env node

const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('📊 Starting bundle analysis...\n')

const analyzeDir = path.join(process.cwd(), '.next/analyze')

// Create analyze directory if it doesn't exist
if (!fs.existsSync(analyzeDir)) {
  fs.mkdirSync(analyzeDir, { recursive: true })
}

// Run bundle analyzer
const cmd = 'ANALYZE=true pnpm build'

exec(cmd, (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Error running bundle analyzer: ${error.message}`)
    process.exit(1)
  }

  if (stderr) {
    console.error(`stderr: ${stderr}`)
  }

  console.log(stdout)
  console.log('\n✅ Bundle analysis complete!')
  console.log(`📁 Analysis saved to: ${analyzeDir}`)
})
