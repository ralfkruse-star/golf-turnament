#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Bundle size thresholds (in bytes)
const THRESHOLDS = {
  maxTotalSize: 5 * 1024 * 1024, // 5MB
  maxPageSize: 1 * 1024 * 1024, // 1MB per page
  maxChunkSize: 500 * 1024, // 500KB per chunk
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

function analyzeBundleSize() {
  const buildManifestPath = path.join(
    process.cwd(),
    '.next/build-manifest.json'
  )

  if (!fs.existsSync(buildManifestPath)) {
    console.error('❌ Build manifest not found. Run "pnpm build" first.')
    process.exit(1)
  }

  console.log('📦 Analyzing bundle sizes...\n')

  // Read build stats
  const statsPath = path.join(process.cwd(), '.next/analyze/')

  let totalSize = 0
  let warnings = []
  let errors = []

  // Check if analysis directory exists
  if (fs.existsSync(statsPath)) {
    console.log('✅ Bundle analysis complete')
    console.log(
      `📊 View detailed analysis in: ${path.relative(process.cwd(), statsPath)}\n`
    )
  }

  // Simple size check based on .next directory
  const nextDir = path.join(process.cwd(), '.next')

  function getDirectorySize(dir) {
    let size = 0
    const files = fs.readdirSync(dir)

    for (const file of files) {
      const filePath = path.join(dir, file)
      const stats = fs.statSync(filePath)

      if (stats.isDirectory()) {
        size += getDirectorySize(filePath)
      } else {
        size += stats.size
      }
    }

    return size
  }

  totalSize = getDirectorySize(path.join(nextDir, 'static'))

  console.log('Bundle Size Summary:')
  console.log('━'.repeat(50))
  console.log(`Total Size: ${formatBytes(totalSize)}`)
  console.log(`Threshold:  ${formatBytes(THRESHOLDS.maxTotalSize)}`)
  console.log('━'.repeat(50))

  // Check against thresholds
  if (totalSize > THRESHOLDS.maxTotalSize) {
    errors.push(
      `Total bundle size (${formatBytes(totalSize)}) exceeds threshold (${formatBytes(THRESHOLDS.maxTotalSize)})`
    )
  } else if (totalSize > THRESHOLDS.maxTotalSize * 0.8) {
    warnings.push(
      `Total bundle size (${formatBytes(totalSize)}) is approaching threshold (${formatBytes(THRESHOLDS.maxTotalSize)})`
    )
  }

  // Print results
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:')
    warnings.forEach((warning) => console.log(`   ${warning}`))
  }

  if (errors.length > 0) {
    console.log('\n❌ Errors:')
    errors.forEach((error) => console.log(`   ${error}`))
    console.log('\n💡 Tips to reduce bundle size:')
    console.log('   - Enable tree shaking')
    console.log('   - Use dynamic imports for large components')
    console.log('   - Analyze and remove unused dependencies')
    console.log('   - Use next/image for optimized images')
    console.log('   - Consider code splitting strategies')
    process.exit(1)
  }

  if (warnings.length === 0 && errors.length === 0) {
    console.log('\n✅ All bundle size checks passed!')
  }

  process.exit(0)
}

analyzeBundleSize()
