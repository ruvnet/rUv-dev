// @ts-nocheck
/**
 * Unit tests for the application entry point (index.ts)
 *
 * These tests verify:
 * 1. Command-line argument parsing (--http/-h flags)
 * 2. Server initialization with the correct transport (HTTP vs stdio)
 * 3. Error handling throughout the application
 * 4. Process exit behavior on errors
 */
import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';

// Store original process.argv and process.env
const originalArgv = process.argv;
const originalEnv = { ...process.env };

// Mock console.error to prevent test output pollution and allow assertions
const originalConsoleError = console.error;
const mockConsoleError = jest.fn();

// Mock process.exit to prevent tests from exiting
const originalProcessExit = process.exit;
const mockProcessExit = jest.fn();

describe('Application Entry Point', () => {
  // Create mocks for server and its methods
  let mockStartWithHttp;
  let mockStartWithStdio;
  let mockFineTuningMcpServer;
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetModules();
    
    // Setup mocks for each test
    mockStartWithHttp = jest.fn().mockResolvedValue(undefined);
    mockStartWithStdio = jest.fn().mockResolvedValue(undefined);
    mockFineTuningMcpServer = jest.fn().mockImplementation(() => ({
      startWithHttp: mockStartWithHttp,
      startWithStdio: mockStartWithStdio
    }));
    
    // Setup mocks for console.error and process.exit
    console.error = mockConsoleError;
    process.exit = mockProcessExit;
    
    // Mock the MCP server class
    jest.doMock('../server/mcp-server', () => ({
      __esModule: true,
      default: mockFineTuningMcpServer,
      FineTuningMcpServer: mockFineTuningMcpServer
    }));
    
    // Reset calls to mocks
    mockConsoleError.mockReset();
    mockProcessExit.mockReset();
  });
  
  afterEach(() => {
    // Restore original process.argv and process.env
    process.argv = originalArgv;
    process.env = { ...originalEnv };
    
    // Restore console.error and process.exit
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
  });
  
  describe('Command-line argument parsing', () => {
    it('should start with HTTP when --http flag is provided', () => {
      // Arrange
      process.argv = ['node', 'index.js', '--http'];
      
      // Act
      require('../index');
      
      // Assert
      expect(mockStartWithHttp).toHaveBeenCalled();
      expect(mockStartWithStdio).not.toHaveBeenCalled();
    });
    
    it('should start with HTTP when -h flag is provided', () => {
      // Arrange
      process.argv = ['node', 'index.js', '-h'];
      
      // Act
      require('../index');
      
      // Assert
      expect(mockStartWithHttp).toHaveBeenCalled();
      expect(mockStartWithStdio).not.toHaveBeenCalled();
    });
    
    it('should start with stdio when no http flags are provided', () => {
      // Arrange
      process.argv = ['node', 'index.js'];
      
      // Act
      require('../index');
      
      // Assert
      expect(mockStartWithStdio).toHaveBeenCalled();
      expect(mockStartWithHttp).not.toHaveBeenCalled();
    });
  });
  
  describe('Server configuration', () => {
    it('should initialize FineTuningMcpServer', () => {
      // Arrange
      process.argv = ['node', 'index.js'];
      
      // Act
      require('../index');
      
      // Assert
      expect(mockFineTuningMcpServer).toHaveBeenCalledTimes(1);
    });
    
    it('should start server with HTTP transport when --http flag is provided', () => {
      // Arrange
      process.argv = ['node', 'index.js', '--http'];
      process.env.PORT = '4000';
      
      // Act
      require('../index');
      
      // Assert
      expect(mockStartWithHttp).toHaveBeenCalledTimes(1);
      expect(mockStartWithHttp).toHaveBeenCalledWith(4000);
      expect(mockStartWithStdio).not.toHaveBeenCalled();
    });
    
    it('should use default port 3001 when PORT env var is not set', () => {
      // This test ensures the default port is used when no PORT env var is provided
      // Arrange
      process.argv = ['node', 'index.js', '--http'];
      delete process.env.PORT;
      
      // Act
      require('../index');
      
      // Assert
      expect(mockStartWithHttp).toHaveBeenCalledTimes(1);
      expect(mockStartWithHttp).toHaveBeenCalledWith(3001);
    });
  });
  
  describe('Error handling', () => {
    it('should handle errors from server initialization', () => {
      // This test verifies error handling when the server constructor throws
      // Arrange
      process.argv = ['node', 'index.js'];
      const error = new Error('Server initialization failed');
      mockFineTuningMcpServer.mockImplementationOnce(() => {
        throw error;
      });
      
      // Act
      require('../index');
      
      // Assert
      expect(mockConsoleError).toHaveBeenCalledWith('Failed to start MCP server:', error);
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
    
    it('should handle errors from startWithHttp', async () => {
      // This test verifies error handling when HTTP transport initialization fails
      // Arrange
      process.argv = ['node', 'index.js', '--http'];
      const error = new Error('HTTP start failed');
      mockStartWithHttp.mockRejectedValueOnce(error);
      
      // Act
      require('../index');
      
      // Wait for promises to resolve
      await new Promise(process.nextTick);
      
      // Assert
      expect(mockConsoleError).toHaveBeenCalledWith('Failed to start MCP server:', error);
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
    
    it('should handle errors from startWithStdio', async () => {
      // This test verifies error handling when stdio transport initialization fails
      // Arrange
      process.argv = ['node', 'index.js'];
      const error = new Error('Stdio start failed');
      mockStartWithStdio.mockRejectedValueOnce(error);
      
      // Act
      require('../index');
      
      // Wait for promises to resolve
      await new Promise(process.nextTick);
      
      // Assert
      expect(mockConsoleError).toHaveBeenCalledWith('Failed to start MCP server:', error);
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
    
    it('should handle unhandled errors from main function', () => {
      // This test directly verifies the error handler function that's now exported
      jest.resetModules();
      
      // Get the exported handleUnhandledError function
      const { handleUnhandledError } = require('../index');
      
      // Create a test error
      const error = new Error('Unhandled error');
      
      // Call the error handler directly
      handleUnhandledError(error);
      
      // Assert
      expect(mockConsoleError).toHaveBeenCalledWith('Unhandled error:', error);
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
    
    it('should test the shouldUseHttp function directly', () => {
      // This test verifies the shouldUseHttp function with different arguments
      jest.resetModules();
      
      // Test with --http flag
      process.argv = ['node', 'index.js', '--http'];
      const { shouldUseHttp: shouldUseHttp1 } = require('../index');
      expect(shouldUseHttp1()).toBe(true);
      
      // Reset modules to get a fresh import
      jest.resetModules();
      
      // Test with -h flag
      process.argv = ['node', 'index.js', '-h'];
      const { shouldUseHttp: shouldUseHttp2 } = require('../index');
      expect(shouldUseHttp2()).toBe(true);
      
      // Reset modules to get a fresh import
      jest.resetModules();
      
      // Test with no flags
      process.argv = ['node', 'index.js'];
      const { shouldUseHttp: shouldUseHttp3 } = require('../index');
      expect(shouldUseHttp3()).toBe(false);
    });
  });
});