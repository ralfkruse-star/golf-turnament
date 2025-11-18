/**
 * Global Setup for E2E Tests
 * Runs once before all E2E tests
 */

import { chromium, FullConfig } from '@playwright/test'
import { resetDatabase } from '../helpers/test-db'

async function globalSetup(config: FullConfig) {
  console.log('🔧 Running global E2E test setup...')

  // Reset test database
  console.log('📊 Resetting test database...')
  try {
    await resetDatabase()
    console.log('✅ Test database reset complete')
  } catch (error) {
    console.error('❌ Failed to reset test database:', error)
    throw error
  }

  // Optional: Run any other global setup tasks
  // e.g., start mock services, configure test data, etc.

  console.log('✅ Global E2E test setup complete')
}

export default globalSetup
