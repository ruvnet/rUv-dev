/**
 * Tests for MCP Security Module
 * 
 * These tests verify the functionality of the MCP Security Module,
 * including credential management, environment variable handling,
 * permission scope validation, and security auditing.
 */

const path = require('path');
const fs = require('fs-extra');
const { mcpSecurity } = require('../../src/core/mcp-wizard/security');
const { configGenerator } = require('../../src/core/mcp-wizard/config-generator');

// Create a temporary test directory
const TEST_DIR = path.join(__dirname, '../fixtures/mcp-security-module');
const MCP_CONFIG_PATH = path.join(TEST_DIR, '.roo/mcp.json');

describe('MCP Security Module Tests', () => {
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
  });
  
  describe('Security Auditing', () => {
    it('should detect hardcoded credentials', () => {
      // Create a configuration with hardcoded credentials
      const insecureConfig = {
        mcpServers: {
          'test-server': {
            command: 'npx',
            args: [
              '-y',
              '@test-server/mcp-server@latest',
              '--api-key',
              'sk-1234567890abcdef1234567890abcdef',
              '--token',
              'Bearer abc123xyz456'
            ],
            alwaysAllow: ['read', 'write']
          }
        }
      };
      
      // Audit the configuration
      const auditResults = mcpSecurity.auditConfiguration(insecureConfig);
      
      // Verify audit results
      expect(auditResults.secure).toBe(false);
      expect(auditResults.issues.length).toBeGreaterThan(0);
      
      // Check for credential issues
      const credentialIssues = auditResults.issues.filter(issue => 
        issue.message.includes('Hardcoded') || 
        issue.message.includes('API key') ||
        issue.message.includes('token')
      );
      expect(credentialIssues.length).toBeGreaterThan(0);
    });
    
    it('should detect excessive permissions', () => {
      // Create a configuration with excessive permissions
      const insecureConfig = {
        mcpServers: {
          'test-server': {
            command: 'npx',
            args: [
              '-y',
              '@test-server/mcp-server@latest',
              '--api-key',
              '${env:TEST_SERVER_API_KEY}'
            ],
            alwaysAllow: ['read', 'write', 'delete', 'admin', 'execute_sql', '*']
          }
        }
      };
      
      // Audit the configuration
      const auditResults = mcpSecurity.auditConfiguration(insecureConfig);
      
      // Verify audit results
      expect(auditResults.secure).toBe(false);
      
      // Check for permission issues
      const permissionIssues = auditResults.issues.filter(issue => 
        issue.location && issue.location.includes('alwaysAllow')
      );
      expect(permissionIssues.length).toBeGreaterThan(0);
      
      // Check for wildcard permission warning
      const wildcardIssue = auditResults.issues.find(issue => 
        issue.message.includes('Wildcard permission')
      );
      expect(wildcardIssue).toBeDefined();
    });
    
    it('should detect command security issues', () => {
      // Create a configuration with command security issues
      const insecureConfig = {
        mcpServers: {
          'test-server': {
            command: 'sudo rm -rf',
            args: [
              '-y',
              '@test-server/mcp-server@latest'
            ],
            alwaysAllow: ['read']
          }
        }
      };
      
      // Audit the configuration
      const auditResults = mcpSecurity.auditConfiguration(insecureConfig);
      
      // Verify audit results
      expect(auditResults.secure).toBe(false);
      
      // Check for command issues
      const commandIssues = auditResults.issues.filter(issue => 
        issue.location && issue.location.includes('command')
      );
      expect(commandIssues.length).toBeGreaterThan(0);
    });
    
    it('should pass audit for secure configurations', () => {
      // Create a secure configuration
      const secureConfig = {
        mcpServers: {
          'test-server': {
            command: 'npx',
            args: [
              '-y',
              '@test-server/mcp-server@1.0.0',
              '--api-key',
              '${env:TEST_SERVER_API_KEY}',
              '--token',
              '${env:TEST_SERVER_TOKEN}'
            ],
            alwaysAllow: ['read', 'list_tables']
          }
        }
      };
      
      // Audit the configuration
      const auditResults = mcpSecurity.auditConfiguration(secureConfig);
      
      // Verify audit results
      expect(auditResults.secure).toBe(true);
      expect(auditResults.issues.length).toBe(0);
    });
  });
  
  describe('Secure Configuration', () => {
    it('should fix hardcoded credentials', () => {
      // Create a configuration with hardcoded credentials
      const insecureConfig = {
        mcpServers: {
          'test-server': {
            command: 'npx',
            args: [
              '-y',
              '@test-server/mcp-server@latest',
              '--api-key',
              'sk-1234567890abcdef1234567890abcdef',
              '--token',
              'Bearer abc123xyz456'
            ],
            alwaysAllow: ['read', 'write']
          }
        }
      };
      
      // Secure the configuration
      const { securedConfig, appliedFixes } = mcpSecurity.secureConfiguration(insecureConfig);
      
      // Verify fixes were applied
      expect(appliedFixes.length).toBeGreaterThan(0);
      
      // Check that credentials were replaced with environment variable references
      const apiKeyIndex = securedConfig.mcpServers['test-server'].args.indexOf('--api-key') + 1;
      const tokenIndex = securedConfig.mcpServers['test-server'].args.indexOf('--token') + 1;
      
      expect(securedConfig.mcpServers['test-server'].args[apiKeyIndex]).toContain('${env:');
      expect(securedConfig.mcpServers['test-server'].args[tokenIndex]).toContain('${env:');
    });
    
    it('should fix permission issues', () => {
      // Create a configuration with permission issues
      const insecureConfig = {
        mcpServers: {
          'test-server': {
            command: 'npx',
            args: [
              '-y',
              '@test-server/mcp-server@latest'
            ],
            alwaysAllow: ['read', 'write', '*']
          }
        }
      };
      
      // Secure the configuration
      const { securedConfig, appliedFixes } = mcpSecurity.secureConfiguration(insecureConfig);
      
      // Verify fixes were applied
      expect(appliedFixes.length).toBeGreaterThan(0);
      
      // Check that wildcard permission was removed
      expect(securedConfig.mcpServers['test-server'].alwaysAllow).not.toContain('*');
    });
  });
  
  describe('Environment Variable References', () => {
    it('should validate environment variable references', () => {
      // Create a configuration with environment variable references
      const config = {
        mcpServers: {
          'test-server': {
            command: 'npx',
            args: [
              '-y',
              '@test-server/mcp-server@latest',
              '--api-key',
              '${env:TEST_SERVER_API_KEY}',
              '--token',
              '${env:TEST_SERVER_TOKEN}'
            ],
            alwaysAllow: ['read', 'write']
          }
        }
      };
      
      // Set one environment variable
      process.env.TEST_SERVER_API_KEY = 'test-api-key';
      
      // Validate environment variable references
      const validationResults = mcpSecurity.validateEnvVarReferences(config);
      
      // Verify validation results
      expect(validationResults.valid).toBe(false); // One variable is missing
      expect(validationResults.missingVariables).toContain('TEST_SERVER_TOKEN');
      expect(validationResults.references.length).toBe(2);
      
      // Clean up
      delete process.env.TEST_SERVER_API_KEY;
    });
  });
  
  describe('Secure Templates', () => {
    it('should generate secure templates for different server types', () => {
      // Generate templates for different server types
      const databaseTemplate = mcpSecurity.generateSecureTemplate('database-server', 'database');
      const aiTemplate = mcpSecurity.generateSecureTemplate('ai-server', 'ai');
      const cloudTemplate = mcpSecurity.generateSecureTemplate('cloud-server', 'cloud');
      const genericTemplate = mcpSecurity.generateSecureTemplate('generic-server');
      
      // Verify database template
      expect(databaseTemplate.args).toContain('${env:DATABASE_SERVER_CONNECTION_STRING}');
      expect(databaseTemplate.alwaysAllow).toContain('list_tables');
      
      // Verify AI template
      expect(aiTemplate.args).toContain('${env:AI_SERVER_API_KEY}');
      expect(aiTemplate.alwaysAllow).toContain('generate_text');
      
      // Verify cloud template
      expect(cloudTemplate.args).toContain('${env:CLOUD_SERVER_ACCESS_KEY}');
      expect(cloudTemplate.args).toContain('${env:CLOUD_SERVER_SECRET_KEY}');
      expect(cloudTemplate.alwaysAllow).toContain('list_resources');
      
      // Verify generic template
      expect(genericTemplate.args).toContain('${env:GENERIC_SERVER_TOKEN}');
      expect(genericTemplate.alwaysAllow).toContain('read');
    });
  });
  
  describe('Configuration Integrity', () => {
    it('should calculate and verify integrity hash', () => {
      // Create a configuration
      const config = {
        mcpServers: {
          'test-server': {
            command: 'npx',
            args: [
              '-y',
              '@test-server/mcp-server@latest',
              '--api-key',
              '${env:TEST_SERVER_API_KEY}'
            ],
            alwaysAllow: ['read', 'write']
          }
        }
      };
      
      // Calculate integrity hash
      const hash = mcpSecurity.calculateIntegrityHash(config);
      
      // Verify the hash is a non-empty string
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
      
      // Verify integrity with correct hash
      expect(mcpSecurity.verifyIntegrity(config, hash)).toBe(true);
      
      // Modify the configuration
      const modifiedConfig = JSON.parse(JSON.stringify(config));
      modifiedConfig.mcpServers['test-server'].alwaysAllow.push('delete');
      
      // Verify integrity with modified configuration
      expect(mcpSecurity.verifyIntegrity(modifiedConfig, hash)).toBe(false);
    });
  });
});