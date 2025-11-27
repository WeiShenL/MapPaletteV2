/**
 * Test Setup File
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379/1';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global teardown
afterAll(async () => {
  // Close database connections
  // Close Redis connections
  // Cleanup test data
  await new Promise((resolve) => setTimeout(resolve, 500));
});

// Suppress console output during tests (optional)
if (process.env.SILENT_TESTS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  };
}
