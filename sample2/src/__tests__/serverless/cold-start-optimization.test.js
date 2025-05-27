const { describe, expect, it, jest, beforeEach, afterEach } = require('@jest/globals');

// Mock the environment dependency
jest.mock('../../serverless/config/environment.js', () => ({
  getEnvironment: jest.fn().mockResolvedValue({
    NODE_ENV: 'test',
    SERVER_NAME: 'test-server',
    SERVER_VERSION: '1.0.0'
  })
}));

// Clear any previous global variables for clean test state
global.mcpCache = undefined;
global.mcpResources = undefined;

// Import the module under test
const {
  setupOptimizations,
  getConnection,
  checkOptimizationStatus
} = require('../../serverless/utils/cold-start-optimization.js');

// Import mocked dependencies for verification
const { getEnvironment } = require('../../serverless/config/environment.js');

describe('Cold Start Optimization Utilities', () => {

  beforeEach(() => {
    // Reset mocks and global state before each test
    jest.clearAllMocks();
    global.mcpCache = undefined;
    global.mcpResources = undefined;
  });
  
  describe('setupOptimizations', () => {
    it('should initialize cache and resources on first call', async () => {
      await setupOptimizations();
      
      // Verify resources and cache were initialized
      expect(global.mcpCache).toBeDefined();
      expect(global.mcpCache.serverStartTime).toBeDefined();
      expect(global.mcpCache.environment).toBe('test');
      expect(global.mcpCache.version).toBe('1.0.0');
      
      expect(global.mcpResources).toBeDefined();
      expect(global.mcpResources.prompts).toEqual({});
      expect(global.mcpResources.templates).toEqual({});
      expect(global.mcpResources.schemas).toEqual({});
    });
    
    it('should only perform setup once (warm container reuse)', async () => {
      // First call should initialize
      await setupOptimizations();
      
      // Track initial values to compare
      const initialCache = { ...global.mcpCache };
      const initialResources = { ...global.mcpResources };
      
      // Clear mock to check if it's called again
      jest.clearAllMocks();
      
      // Second call should skip initialization
      await setupOptimizations();
      
      // Verify environment wasn't loaded again
      expect(getEnvironment).not.toHaveBeenCalled();
      
      // Verify the cache and resources weren't re-initialized
      expect(global.mcpCache).toEqual(initialCache);
      expect(global.mcpResources).toEqual(initialResources);
    });
    
    it('should initialize connection pools in non-test environments', async () => {
      // Mock environment as development
      getEnvironment.mockResolvedValueOnce({
        NODE_ENV: 'development',
        SERVER_NAME: 'test-server',
        SERVER_VERSION: '1.0.0'
      });
      
      await setupOptimizations();
      
      // Check if database connection was initialized
      const dbConnection = getConnection('db');
      expect(dbConnection).not.toBeNull();
      expect(dbConnection.isConnected).toBe(true);
    });
    
    it('should initialize Redis in production environment', async () => {
      // Mock environment as production
      getEnvironment.mockResolvedValueOnce({
        NODE_ENV: 'production',
        SERVER_NAME: 'test-server',
        SERVER_VERSION: '1.0.0'
      });
      
      await setupOptimizations();
      
      // Check if Redis connection was initialized
      const redisConnection = getConnection('redis');
      expect(redisConnection).not.toBeNull();
      expect(redisConnection.isConnected).toBe(true);
    });
    
    it('should not initialize Redis in development or test environments', async () => {
      // Already mocked as test environment in the top-level mock
      
      await setupOptimizations();
      
      // Check that Redis wasn't initialized
      const redisConnection = getConnection('redis');
      expect(redisConnection).toBeNull();
    });
    
    it('should handle errors in optimization steps without failing', async () => {
      // Mock getEnvironment to throw an error
      getEnvironment.mockRejectedValueOnce(new Error('Connection failure'));
      
      // Should not throw despite the error
      await expect(setupOptimizations()).resolves.not.toThrow();
    });
  });
  
  describe('getConnection', () => {
    it('should return null for uninitialized connections', () => {
      const connection = getConnection('db');
      expect(connection).toBeNull();
    });
    
    it('should return the connection after initialization', async () => {
      // Mock environment as development to ensure DB initialization
      getEnvironment.mockResolvedValueOnce({
        NODE_ENV: 'development',
        SERVER_NAME: 'test-server',
        SERVER_VERSION: '1.0.0'
      });
      
      await setupOptimizations();
      
      const connection = getConnection('db');
      expect(connection).toBeDefined();
      expect(connection.isConnected).toBe(true);
      expect(connection.poolSize).toBe(5);
    });
  });
  
  describe('checkOptimizationStatus', () => {
    it('should return false before optimization', () => {
      const status = checkOptimizationStatus();
      expect(status).toBe(false);
    });
    
    it('should return true after optimization', async () => {
      await setupOptimizations();
      
      const status = checkOptimizationStatus();
      expect(status).toBe(true);
    });
  });
  
  describe('Global Cache Object', () => {
    it('should be initialized with server information', async () => {
      await setupOptimizations();
      
      expect(global.mcpCache).toBeDefined();
      expect(global.mcpCache.serverStartTime).toBeDefined();
      expect(typeof global.mcpCache.serverStartTime).toBe('string');
      expect(global.mcpCache.environment).toBe('test');
      expect(global.mcpCache.version).toBe('1.0.0');
      expect(global.mcpCache.commonConfigs).toEqual({});
    });
  });
  
  describe('Global Resources Object', () => {
    it('should be initialized with empty collections', async () => {
      await setupOptimizations();
      
      expect(global.mcpResources).toBeDefined();
      expect(global.mcpResources.prompts).toEqual({});
      expect(global.mcpResources.templates).toEqual({});
      expect(global.mcpResources.schemas).toEqual({});
    });
  });
});