/**
 * Jest setup file for create-sparc tests
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// Create a temporary directory for tests
const TEST_TMP_DIR = path.join(os.tmpdir(), 'create-sparc-tests');

// Setup before all tests
beforeAll(async () => {
  // Ensure the test directory exists and is empty
  await fs.ensureDir(TEST_TMP_DIR);
  await fs.emptyDir(TEST_TMP_DIR);
  
  // Silence console output during tests unless in debug mode
  if (!process.env.DEBUG) {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    // Keep error logging enabled for debugging test failures
    // jest.spyOn(console, 'error').mockImplementation(() => {});
  }
});

// Cleanup after all tests
afterAll(async () => {
  // Clean up the test directory
  await fs.remove(TEST_TMP_DIR);
  
  // Restore console output
  if (!process.env.DEBUG) {
    // Check if the mocks exist before trying to restore them
    if (console.log.mockRestore) {
      console.log.mockRestore();
    }
    if (console.info.mockRestore) {
      console.info.mockRestore();
    }
    if (console.warn.mockRestore) {
      console.warn.mockRestore();
    }
    // console.error.mockRestore();
  }
});

// Make the test directory available to tests
global.TEST_TMP_DIR = TEST_TMP_DIR;

// Helper function to create a unique test directory
global.createTestDir = async (name) => {
  const dir = path.join(TEST_TMP_DIR, name);
  await fs.ensureDir(dir);
  await fs.emptyDir(dir);
  return dir;
};

// Helper function to create test files
global.createTestFile = async (filePath, content) => {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content);
  return filePath;
};