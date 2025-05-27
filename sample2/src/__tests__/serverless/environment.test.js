const { describe, expect, it, jest, beforeEach, afterEach } = require('@jest/globals');

// Store original environment variables
const originalEnv = { ...process.env };

// Import the module under test
const {
  getEnvironment,
  resetEnvironmentCache,
  validateConfig,
  getAllEnvironmentVariables
} = require('../../serverless/config/environment.js');

describe('Environment Configuration', () => {
  
  // Reset environment and module cache before each test
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    resetEnvironmentCache();
  });
  
  // Restore original environment after each test
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('getEnvironment', () => {
    it('should load default values when environment variables are not set', async () => {
      const config = await getEnvironment();
      
      // Check default values
      expect(config.SERVER_NAME).toBe('logitech-mcp-server');
      expect(config.SERVER_VERSION).toBe('1.0.0');
      expect(config.NODE_ENV).toBe('development');
      expect(config.LOG_LEVEL).toBe('info');
      expect(config.PORT).toBe(3001);
      expect(config.HOST).toBe('0.0.0.0');
      expect(config.BASE_URL).toBe('http://localhost:3001');
      expect(config.CACHE_TTL).toBe(300);
      expect(config.REQUEST_TIMEOUT).toBe(30000);
    });
    
    it('should use environment variables when provided', async () => {
      // Setup test environment variables
      process.env.SERVER_NAME = 'test-server';
      process.env.SERVER_VERSION = '2.0.0';
      process.env.NODE_ENV = 'test';
      process.env.LOG_LEVEL = 'debug';
      process.env.PORT = '4000';
      process.env.HOST = 'test-host';
      process.env.BASE_URL = 'https://test-api.example.com';
      process.env.CACHE_TTL = '600';
      process.env.REQUEST_TIMEOUT = '60000';
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.API_KEYS = 'key1,key2';
      process.env.DEBUG_MODE = 'true';
      
      const config = await getEnvironment();
      
      // Check that values from environment are used
      expect(config.SERVER_NAME).toBe('test-server');
      expect(config.SERVER_VERSION).toBe('2.0.0');
      expect(config.NODE_ENV).toBe('test');
      expect(config.LOG_LEVEL).toBe('debug');
      expect(config.PORT).toBe(4000);
      expect(config.HOST).toBe('test-host');
      expect(config.BASE_URL).toBe('https://test-api.example.com');
      expect(config.CACHE_TTL).toBe(600);
      expect(config.REQUEST_TIMEOUT).toBe(60000);
      expect(config.OPENAI_API_KEY).toBe('test-key');
      expect(config.API_KEYS).toBe('key1,key2');
      expect(config.DEBUG_MODE).toBe(true);
    });
    
    it('should cache the configuration for subsequent calls', async () => {
      // First call to populate cache
      await getEnvironment();
      
      // Change environment variable after cache is populated
      process.env.SERVER_NAME = 'changed-server-name';
      
      // Second call should use cached value
      const config = await getEnvironment();
      
      // Should still have the original value, not the changed one
      expect(config.SERVER_NAME).toBe('logitech-mcp-server');
    });
    
    it('should reload configuration after cache reset', async () => {
      // First call to populate cache
      await getEnvironment();
      
      // Change environment variable
      process.env.SERVER_NAME = 'changed-server-name';
      
      // Reset cache
      resetEnvironmentCache();
      
      // Get configuration again
      const config = await getEnvironment();
      
      // Should have the new value
      expect(config.SERVER_NAME).toBe('changed-server-name');
    });
  });
  
  describe('Config Validation', () => {
    it('should require OPENAI_API_KEY in production environment', async () => {
      // Set production environment without API key
      process.env.NODE_ENV = 'production';
      delete process.env.OPENAI_API_KEY;
      
      // Should throw an error
      await expect(getEnvironment()).rejects.toThrow('OPENAI_API_KEY is required');
    });
    
    it('should require API_KEYS in production environment', async () => {
      // Set production environment with API key but no API_KEYS
      process.env.NODE_ENV = 'production';
      process.env.OPENAI_API_KEY = 'test-key';
      delete process.env.API_KEYS;
      
      // Should throw an error
      await expect(getEnvironment()).rejects.toThrow('API_KEYS is required');
    });
    
    it('should validate PORT is a positive number', async () => {
      // Set invalid PORT
      process.env.PORT = '-1';
      
      // Should throw an error
      await expect(getEnvironment()).rejects.toThrow('PORT must be a positive number');
    });
    
    it('should validate CACHE_TTL is a non-negative number', async () => {
      // Set invalid CACHE_TTL
      process.env.CACHE_TTL = '-5';
      
      // Should throw an error
      await expect(getEnvironment()).rejects.toThrow('CACHE_TTL must be a non-negative number');
    });
    
    it('should validate REQUEST_TIMEOUT is a positive number', async () => {
      // Set invalid REQUEST_TIMEOUT
      process.env.REQUEST_TIMEOUT = '0';
      
      // Should throw an error
      await expect(getEnvironment()).rejects.toThrow('REQUEST_TIMEOUT must be a positive number');
    });
    
    it('should validate LOG_LEVEL is one of the allowed values', async () => {
      // Set invalid LOG_LEVEL
      process.env.LOG_LEVEL = 'invalid-level';
      
      // Should throw an error because LOG_LEVEL must be one of 'debug', 'info', 'warn', or 'error'
      await expect(getEnvironment()).rejects.toThrow();
    });
    
    it('should not require API keys in development environment', async () => {
      // Ensure we're in development
      process.env.NODE_ENV = 'development';
      delete process.env.OPENAI_API_KEY;
      delete process.env.API_KEYS;
      
      // Should not throw
      await expect(getEnvironment()).resolves.not.toThrow();
    });
  });
  
  describe('getAllEnvironmentVariables', () => {
    it('should return all environment variables', () => {
      // Add a test variable
      process.env.TEST_VARIABLE = 'test-value';
      
      const allVars = getAllEnvironmentVariables();
      
      // Should include our test variable
      expect(allVars.TEST_VARIABLE).toBe('test-value');
    });
  });
});