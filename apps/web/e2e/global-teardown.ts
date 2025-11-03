import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E test teardown...');
  
  // Add any cleanup logic here:
  // - Database cleanup
  // - File cleanup
  // - Service cleanup
  
  console.log('✅ E2E test teardown completed');
}

export default globalTeardown;