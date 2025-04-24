/**
 * Unit tests for the main index.js module
 */

// Mock the CLI module before importing the main module
jest.mock('../../src/cli', () => ({
  run: jest.fn().mockResolvedValue('CLI result')
}));

describe('Main Module', () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // Reset modules after all tests
  afterAll(() => {
    jest.resetModules();
  });
  
  test('should export run function', () => {
    // Import the main module
    const main = require('../../src/index');
    
    // Verify that it exports the run function
    expect(main).toHaveProperty('run');
    expect(typeof main.run).toBe('function');
  });
  
  test('should correctly pass through to CLI run function', async () => {
    // Import the main module and mocked CLI
    const main = require('../../src/index');
    const { run } = require('../../src/cli');
    
    // Call the run function with some arguments
    const args = ['node', 'create-sparc', '--help'];
    await main.run(args);
    
    // Verify that it calls the CLI run function with the same arguments
    expect(run).toHaveBeenCalledWith(args);
  });
});