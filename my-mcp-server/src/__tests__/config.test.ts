import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import path from 'path';

// Store original process.env
const originalEnv = { ...process.env };

describe('Configuration Module', () => {
  // Reset modules and restore process.env before each test
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  // Restore process.env after each test
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('Environment Variables Loading', () => {
    it('should load environment variables from .env file', () => {
      // The config module loads env vars when imported, so we just need to verify
      // that process.env has the expected values after importing
      
      // Import the config module
      const { config } = require('../core/config.js');
      
      // Verify that OPENAI_API_KEY was used
      expect(config.openaiApiKey).toBe(process.env.OPENAI_API_KEY);
    });

    it('should throw an error when OPENAI_API_KEY is not provided', () => {
      // Clear OPENAI_API_KEY env variable
      delete process.env.OPENAI_API_KEY;

      // Import should throw because of missing required API key
      expect(() => {
        require('../core/config.js');
      }).toThrow('OPENAI_API_KEY is required');
    });
  });

  describe('Default Configuration Values', () => {
    it('should use default values when environment variables are not provided', () => {
      // Setup environment with only the required API key
      process.env = {
        OPENAI_API_KEY: 'test-api-key'
      };
      
      // Import the config module
      const { config } = require('../core/config.js');
      
      // Verify default values are used
      expect(config.serverName).toBe('MCP Server');
      expect(config.serverVersion).toBe('1.0.0');
      expect(config.port).toBe(3001);
      expect(config.host).toBe('localhost');
      expect(config.logLevel).toBe('info');
      expect(config.defaultBaseModel).toBe('o4-mini-2025-04-16');
      expect(config.transportType).toBe('stdio');
      expect(config.startTransportType).toBe('stdio');
    });

    it('should use environment variables when provided', () => {
      // Setup environment with custom values
      process.env = {
        OPENAI_API_KEY: 'test-api-key',
        SERVER_NAME: 'Custom Server',
        SERVER_VERSION: '2.0.0',
        PORT: '4000',
        HOST: 'custom-host',
        LOG_LEVEL: 'debug',
        DEFAULT_BASE_MODEL: 'custom-model',
        TRANSPORT_TYPE: 'http'
      };
      
      // Import the config module
      const { config } = require('../core/config.js');
      
      // Verify environment values are used
      expect(config.serverName).toBe('Custom Server');
      expect(config.serverVersion).toBe('2.0.0');
      expect(config.port).toBe(4000); // Should be coerced to number
      expect(config.host).toBe('custom-host');
      expect(config.logLevel).toBe('debug');
      expect(config.defaultBaseModel).toBe('custom-model');
      expect(config.transportType).toBe('http');
      // startTransportType is always 'stdio'
      expect(config.startTransportType).toBe('stdio');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate port is coerced to a number', () => {
      // Setup environment with string port
      process.env = {
        OPENAI_API_KEY: 'test-api-key',
        PORT: '5000'
      };
      
      // Import the config module
      const { config } = require('../core/config.js');
      
      // Verify port is a number, not a string
      expect(config.port).toBe(5000);
      expect(typeof config.port).toBe('number');
    });

    it('should reject invalid log level', () => {
      // Setup environment with invalid log level
      process.env = {
        OPENAI_API_KEY: 'test-api-key',
        LOG_LEVEL: 'invalid-level' // Not one of: debug, info, warn, error
      };
      
      // Import should throw because of invalid log level
      expect(() => {
        require('../core/config.js');
      }).toThrow();
    });

    it('should reject invalid server version format', () => {
      // Setup environment with invalid version format
      process.env = {
        OPENAI_API_KEY: 'test-api-key',
        SERVER_VERSION: 'invalid-version' // Not in format x.y.z
      };
      
      // Import should throw because of invalid version
      expect(() => {
        require('../core/config.js');
      }).toThrow();
    });
  });

  describe('Module Exports', () => {
    it('should export config object as default export', () => {
      // Import the default export
      const config = require('../core/config.js').default;
      
      // Verify it's the same as the named export
      const { config: namedConfig } = require('../core/config.js');
      expect(config).toBe(namedConfig);
    });

    it('should export a valid config object with all expected properties', () => {
      // Setup environment with minimum requirements
      process.env = {
        OPENAI_API_KEY: 'test-api-key'
      };

      // Import the config
      const { config } = require('../core/config.js');
      
      // Verify it has all expected properties
      expect(config).toHaveProperty('openaiApiKey');
      expect(config).toHaveProperty('serverName');
      expect(config).toHaveProperty('serverVersion');
      expect(config).toHaveProperty('port');
      expect(config).toHaveProperty('host');
      expect(config).toHaveProperty('logLevel');
      expect(config).toHaveProperty('defaultBaseModel');
      expect(config).toHaveProperty('transportType');
      expect(config).toHaveProperty('startTransportType');
    });
  });
});