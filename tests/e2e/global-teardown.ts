/**
 * Global Teardown for E2E Tests
 * Runs once after all E2E tests
 */

import { FullConfig } from '@playwright/test'
import { disconnectDatabase } from '../helpers/test-db'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Running global E2E test teardown...')

  // Disconnect from database
  try {
    await disconnectDatabase()
    console.log('✅ Database connection closed')
  } catch (error) {
    console.error('❌ Failed to close database connection:', error)
  }

  // Optional: Clean up any resources
  // e.g., stop mock services, clean temporary files, etc.

  console.log('✅ Global E2E test teardown complete')
}

export default globalTeardown
