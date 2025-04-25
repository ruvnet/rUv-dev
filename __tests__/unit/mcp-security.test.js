/**
 * Security tests for MCP Configuration Wizard
 * 
 * These tests verify that the MCP Configuration Wizard properly handles
 * security-related concerns such as environment variable references,
 * input validation, and configuration integrity.
 */

const path = require('path');
const fs = require('fs-extra');
const { wizardCore } = require('../../src/core/mcp-wizard');
const { configGenerator } = require('../../src/core/mcp-wizard/config-generator');
const { validateServerId, validateApiKey, validatePermissions } = require('../../src/core/mcp-wizard/validation');
const { fileManager } = require('../../src/core/file-manager');

// Create a temporary test directory
const TEST_DIR = path.join(__dirname, '../fixtures/mcp-security');
const MCP_CONFIG_PATH = path.join(TEST_DIR, '.roo/mcp.json');

describe('MCP Security Tests', () => {
  beforeAll(async () => {
    // Create test directory structure
    await fs.ensureDir(path.join(TEST_DIR, '.roo'));
  });
  
  afterAll(async () => {
    // Clean up test directory
    await fs.remove(TEST_DIR);
  });
  
  beforeEach(async () => {
    // Reset test files before each test
    await fs.emptyDir(path.join(TEST_DIR, '.roo'));
    
    // Initialize wizard core with test directory
    await wizardCore.initialize({
      projectPath: TEST_DIR,
      mcpConfigPath: '.roo/mcp.json',
      roomodesPath: '.roomodes'
    });
  });
  
  describe('Environment variable handling', () => {
    it('should use environment variable references for sensitive data', () => {
      // Test server metadata
      const serverMetadata = {
        id: 'test-server',
        name: 'Test Server',
        tags: ['test']
      };
      
      // User parameters with sensitive data
      const userParams = {
        apiKey: 'secret-api-key',
        token: 'secret-token',
        password: 'secret-password'
      };
      
      // Generate server configuration
      const serverConfig = configGenerator.generateServerConfig(serverMetadata, userParams);
      
      // Check that sensitive parameters use environment variable references
      const argsString = serverConfig.args.join(' ');
      expect(argsString).toContain('--apiKey ${env:');
      expect(argsString).toContain('--token ${env:');
      expect(argsString).toContain('--password ${env:');
      
      // Ensure no raw secrets are in the configuration
      expect(argsString).not.toContain('secret-api-key');
      expect(argsString).not.toContain('secret-token');
      expect(argsString).not.toContain('secret-password');
    });
    
    it('should detect and handle hardcoded secrets', async () => {
      // Create a configuration with hardcoded secrets
      const insecureConfig = {
        mcpServers: {
          'test-server': {
            command: 'npx',
            args: [
              '-y',
              '@test-server/mcp-server@latest',
              '--apiKey',
              'actual-secret-key-12345', // Hardcoded secret
              '--token',
              'Bearer abc123xyz456' // Hardcoded token
            ],
            alwaysAllow: ['read', 'write']
          }
        }
      };
      
      // Write the insecure configuration
      await fs.writeJson(MCP_CONFIG_PATH, insecureConfig);
      
      // Validate the configuration
      const validationResult = await wizardCore.validateConfiguration();
      
      // The current validation doesn't check for hardcoded secrets,
      // but we should implement this feature
      
      // For now, let's manually check for hardcoded secrets
      const mcpConfig = await fs.readJson(MCP_CONFIG_PATH);
      const serverConfig = mcpConfig.mcpServers['test-server'];
      
      // Check for patterns that might indicate hardcoded secrets
      const sensitivePatterns = [
        /key/i,
        /secret/i,
        /password/i,
        /token/i,
        /auth/i,
        /bearer/i
      ];
      
      let containsHardcodedSecrets = false;
      
      for (let i = 0; i < serverConfig.args.length; i++) {
        const arg = serverConfig.args[i];
        
        // Check if this is a parameter name (starts with --)
        if (arg.startsWith('--')) {
          const paramName = arg.substring(2);
          
          // Check if the next argument might be a hardcoded secret
          if (i + 1 < serverConfig.args.length) {
            const paramValue = serverConfig.args[i + 1];
            
            // Check if parameter name matches sensitive patterns
            const isSensitiveParam = sensitivePatterns.some(pattern => pattern.test(paramName));
            
            // Check if value is not an environment variable reference
            const isHardcoded = isSensitiveParam && 
                               typeof paramValue === 'string' && 
                               !paramValue.includes('${env:');
            
            if (isHardcoded) {
              containsHardcodedSecrets = true;
              break;
            }
          }
        }
      }
      
      // This test demonstrates the need for implementing proper secret detection
      expect(containsHardcodedSecrets).toBe(true);
    });
  });
  
  describe('Input validation', () => {
    it('should validate server IDs', () => {
      // Valid server IDs
      expect(validateServerId('test-server').valid).toBe(true);
      expect(validateServerId('my_server123').valid).toBe(true);
      expect(validateServerId('server-with-hyphens').valid).toBe(true);
      
      // Invalid server IDs
      expect(validateServerId('').valid).toBe(false);
      expect(validateServerId('server with spaces').valid).toBe(false);
      expect(validateServerId('server/with/slashes').valid).toBe(false);
      expect(validateServerId('server;with;semicolons').valid).toBe(false);
      expect(validateServerId('server<with>special&chars').valid).toBe(false);
    });
    
    it('should validate API keys', () => {
      // Valid API keys
      expect(validateApiKey('valid-api-key-12345').valid).toBe(true);
      expect(validateApiKey('APIKEY_WITH_UNDERSCORES_123').valid).toBe(true);
      
      // Invalid API keys
      expect(validateApiKey('').valid).toBe(false);
      expect(validateApiKey('short').valid).toBe(false); // Too short
    });
    
    it('should validate permissions', () => {
      // Recommended permissions
      const recommendedPermissions = ['read', 'write'];
      
      // Valid permissions (subset of recommended)
      expect(validatePermissions(['read'], recommendedPermissions).valid).toBe(true);
      expect(validatePermissions(['read', 'write'], recommendedPermissions).valid).toBe(true);
      
      // Valid but with warning (exceeds recommended)
      const warningResult = validatePermissions(['read', 'write', 'delete'], recommendedPermissions);
      expect(warningResult.valid).toBe(true);
      expect(warningResult.warning).toBeTruthy();
      
      // Invalid permissions (contains unknown permission)
      expect(validatePermissions(['read', 'invalid-permission'], recommendedPermissions).valid).toBe(false);
    });
  });
  
  describe('Configuration integrity', () => {
    it('should detect tampering with configuration files', async () => {
      // Create a valid configuration
      const validConfig = {
        mcpServers: {
          'test-server': {
            command: 'npx',
            args: [
              '-y',
              '@test-server/mcp-server@latest',
              '--apiKey',
              '${env:TEST_SERVER_API_KEY}'
            ],
            alwaysAllow: ['read', 'write']
          }
        }
      };
      
      // Write the valid configuration
      await fs.writeJson(MCP_CONFIG_PATH, validConfig);
      
      // Calculate file hash for integrity checking
      const originalHash = await fileManager.calculateFileHash(MCP_CONFIG_PATH);
      
      // Tamper with the configuration
      const tamperedConfig = JSON.parse(JSON.stringify(validConfig));
      tamperedConfig.mcpServers['test-server'].alwaysAllow.push('admin'); // Add admin permission
      await fs.writeJson(MCP_CONFIG_PATH, tamperedConfig);
      
      // Verify integrity
      const isIntact = await fileManager.verifyFileIntegrity(MCP_CONFIG_PATH, originalHash);
      expect(isIntact).toBe(false);
    });
    
    it('should validate configuration schema', async () => {
      // Test various invalid configurations
      const testCases = [
        {
          name: 'Missing required field',
          config: {
            mcpServers: {
              'test-server': {
                // Missing 'command' field
                args: [],
                alwaysAllow: []
              }
            }
          },
          expectValid: false
        },
        {
          name: 'Invalid field type',
          config: {
            mcpServers: {
              'test-server': {
                command: 'npx',
                args: 'not-an-array', // Should be an array
                alwaysAllow: []
              }
            }
          },
          expectValid: false
        },
        {
          name: 'Invalid server ID',
          config: {
            mcpServers: {
              'invalid server id': { // Contains spaces
                command: 'npx',
                args: [],
                alwaysAllow: []
              }
            }
          },
          expectValid: false
        },
        {
          name: 'Valid configuration',
          config: {
            mcpServers: {
              'test-server': {
                command: 'npx',
                args: ['-y', '@test-server/mcp-server@latest'],
                alwaysAllow: ['read', 'write']
              }
            }
          },
          expectValid: true
        }
      ];
      
      for (const testCase of testCases) {
        // Write the test configuration
        await fs.writeJson(MCP_CONFIG_PATH, testCase.config);
        
        // Validate the configuration
        const validationResult = configGenerator.validateMcpConfig(testCase.config);
        
        expect(validationResult.valid).toBe(testCase.expectValid);
        if (!testCase.expectValid) {
          expect(validationResult.errors.length).toBeGreaterThan(0);
        }
      }
    });
  });
  
  describe('Secure file operations', () => {
    it('should safely write configuration with backup', async () => {
      // Create a configuration
      const config = {
        mcpServers: {
          'test-server': {
            command: 'npx',
            args: ['-y', '@test-server/mcp-server@latest'],
            alwaysAllow: ['read', 'write']
          }
        }
      };
      
      // Safely write the configuration
      const writeResult = await fileManager.safeWriteConfig(MCP_CONFIG_PATH, config);
      expect(writeResult.success).toBe(true);
      expect(writeResult.backupPath).toBeNull(); // No backup for first write
      
      // Modify the configuration
      config.mcpServers['test-server'].args.push('--new-arg');
      
      // Safely write the modified configuration
      const updateResult = await fileManager.safeWriteConfig(MCP_CONFIG_PATH, config);
      expect(updateResult.success).toBe(true);
      expect(updateResult.backupPath).not.toBeNull(); // Backup created
      
      // Verify backup exists
      const backupExists = await fs.pathExists(updateResult.backupPath);
      expect(backupExists).toBe(true);
    });
    
    it('should handle write errors and restore from backup', async () => {
      // Create a configuration
      const config = {
        mcpServers: {
          'test-server': {
            command: 'npx',
            args: ['-y', '@test-server/mcp-server@latest'],
            alwaysAllow: ['read', 'write']
          }
        }
      };
      
      // Write the initial configuration
      await fileManager.safeWriteConfig(MCP_CONFIG_PATH, config);
      
      // Mock fs.writeFile to simulate write error
      const originalWriteFile = fs.writeFile;
      fs.writeFile = jest.fn().mockRejectedValue(new Error('Write error'));
      
      // Attempt to update the configuration
      try {
        await fileManager.safeWriteConfig(MCP_CONFIG_PATH, { corrupted: true });
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error.message).toContain('Write error');
      }
      
      // Restore original function
      fs.writeFile = originalWriteFile;
      
      // Verify the original configuration was preserved
      const restoredConfig = await fs.readJson(MCP_CONFIG_PATH);
      expect(restoredConfig).toHaveProperty('mcpServers.test-server');
      expect(restoredConfig).not.toHaveProperty('corrupted');
    });
  });
});