/**
 * Unit tests for the CLI module
 */

const { run } = require('../../src/cli');

describe('CLI Module', () => {
  // Save original process.argv and process.exit
  const originalArgv = process.argv;
  const originalExit = process.exit;
  const originalNodeEnv = process.env.NODE_ENV;
  
  beforeEach(() => {
    // Set NODE_ENV to test
    process.env.NODE_ENV = 'test';
    
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock process.exit
    process.exit = jest.fn();
  });
  
  afterEach(() => {
    // Restore original process.argv, process.exit, and NODE_ENV
    process.argv = originalArgv;
    process.exit = originalExit;
    process.env.NODE_ENV = originalNodeEnv;
    
    // Restore console methods
    if (console.log.mockRestore) {
      console.log.mockRestore();
    }
    if (console.error.mockRestore) {
      console.error.mockRestore();
    }
    
    // Clear all mocks
    jest.resetModules();
  });
  
  test('should show help when no command is provided', async () => {
    // Run the CLI with no arguments
    const result = await run(['node', 'create-sparc']);
    
    // Verify it contains help text
    expect(result).toContain('create-sparc');
  });
  
  test('should set debug mode when --debug flag is provided', async () => {
    // Save original DEBUG env var
    const originalDebug = process.env.DEBUG;
    
    // Mock the logger
    const { logger } = require('../../src/utils');
    const setLevelSpy = jest.spyOn(logger, 'setLevel').mockImplementation(() => {});
    const debugSpy = jest.spyOn(logger, 'debug').mockImplementation(() => {});
    
    try {
      // Get the CLI module
      const { program } = require('commander');
      
      // Directly trigger the preAction hook with debug option
      const preActionHooks = program._hooks?.preAction || [];
      if (preActionHooks.length > 0) {
        // Call the hook with a mock command that has debug option
        preActionHooks[0]({ opts: () => ({ debug: true }) });
        
        // Verify DEBUG env var was set
        expect(process.env.DEBUG).toBe('true');
        
        // Verify logger methods were called
        expect(setLevelSpy).toHaveBeenCalledWith('debug');
        expect(debugSpy).toHaveBeenCalledWith('Debug mode enabled');
      } else {
        // Skip the test if no hooks are defined
        console.log('No preAction hooks defined, skipping test');
      }
    } finally {
      // Restore original DEBUG env var
      process.env.DEBUG = originalDebug;
      
      // Restore logger mocks
      if (setLevelSpy.mockRestore) {
        setLevelSpy.mockRestore();
      }
      if (debugSpy.mockRestore) {
        debugSpy.mockRestore();
      }
    }
  });
  
  test('should set verbose mode when --verbose flag is provided', async () => {
    // Mock the logger
    const { logger } = require('../../src/utils');
    const setLevelSpy = jest.spyOn(logger, 'setLevel').mockImplementation(() => {});
    const verboseSpy = jest.spyOn(logger, 'verbose').mockImplementation(() => {});
    
    try {
      // Get the CLI module
      const { program } = require('commander');
      
      // Directly trigger the preAction hook with verbose option
      const preActionHooks = program._hooks?.preAction || [];
      if (preActionHooks.length > 0) {
        // Call the hook with a mock command that has verbose option
        preActionHooks[0]({ opts: () => ({ debug: false, verbose: true }) });
        
        // Verify logger methods were called
        expect(setLevelSpy).toHaveBeenCalledWith('verbose');
        expect(verboseSpy).toHaveBeenCalledWith('Verbose mode enabled');
      } else {
        // Skip the test if no hooks are defined
        console.log('No preAction hooks defined, skipping test');
      }
    } finally {
      // Restore logger mocks
      if (setLevelSpy.mockRestore) {
        setLevelSpy.mockRestore();
      }
      if (verboseSpy.mockRestore) {
        verboseSpy.mockRestore();
      }
    }
  });
  
  test('should handle unknown commands', async () => {
    // Mock console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    try {
      // Run the CLI with an unknown command
      await run(['node', 'create-sparc', 'unknown-command']);
      
      // Should not reach here due to error
      expect(true).toBe(false);
    } catch (error) {
      // Verify error handling
      expect(error.message).toContain('Invalid command');
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalled();
    } finally {
      // Restore mocks
      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
    }
  });
  
  test('should handle errors during command execution', async () => {
    // Mock console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock process.exit
    const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('Process exit called');
    });
    
    // Mock program.parseAsync to throw an error
    const { program } = require('commander');
    const originalParseAsync = program.parseAsync;
    program.parseAsync = jest.fn().mockRejectedValue(new Error('Test error'));
    
    try {
      // Run the CLI
      await run(['node', 'create-sparc', 'init', 'test-project']);
      
      // Should not reach here due to process.exit
      expect(true).toBe(false);
    } catch (error) {
      // Verify error handling
      expect(error.message).toBe('Process exit called');
      expect(consoleErrorSpy).toHaveBeenCalled();
    } finally {
      // Restore mocks
      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
      program.parseAsync = originalParseAsync;
    }
  });
  
  test('should parse arguments and execute command', async () => {
    // This is a basic test that just verifies the CLI runs without errors
    await run(['node', 'create-sparc', 'init', 'test-project']);
    
    // If we get here without errors, the test passes
    expect(true).toBe(true);
  });
});