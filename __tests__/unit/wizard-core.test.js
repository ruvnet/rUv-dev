/**
 * Unit tests for the MCP Wizard Core
 */

const path = require('path');
const fs = require('fs-extra');
const { wizardCore } = require('../../src/core/mcp-wizard');
const { RegistryClient } = require('../../src/core/registry-client');
const { fileManager } = require('../../src/core/file-manager');

// Mock dependencies
jest.mock('../../src/core/registry-client/registry-client');
jest.mock('../../src/core/file-manager');
jest.mock('../../src/utils', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    success: jest.fn()
  }
}));

describe('Wizard Core', () => {
  // Setup test environment
  const testProjectPath = path.join(__dirname, '../fixtures/test-project');
  const testMcpConfigPath = '.roo/mcp.json';
  const testRoomodesPath = '.roomodes';
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock fileManager methods
    fileManager.createDirectory.mockResolvedValue(undefined);
    fileManager.exists.mockResolvedValue(true);
    fileManager.safeReadConfig.mockResolvedValue({ mcpServers: {} });
    fileManager.createBackup.mockResolvedValue('/path/to/backup.bak');
    fileManager.restoreFromBackup.mockResolvedValue(true);
    
    // Mock RegistryClient methods
    RegistryClient.prototype.getServers.mockResolvedValue({
      items: [
        { id: 'test-server', name: 'Test Server', description: 'A test server', tags: ['test'] }
      ],
      pagination: { total: 1, page: 1, pageSize: 10 }
    });
    
    RegistryClient.prototype.getServerDetails.mockResolvedValue({
      id: 'test-server',
      name: 'Test Server',
      description: 'A test server',
      tags: ['test'],
      recommendedPermissions: ['read', 'write'],
      requiredParams: ['apiKey'],
      optionalParams: [{ name: 'region', type: 'input', default: 'us-east-1' }]
    });
  });
  
  describe('initialize', () => {
    it('should initialize the wizard core with default options', async () => {
      const result = await wizardCore.initialize();
      
      expect(result.success).toBe(true);
      expect(fileManager.createDirectory).toHaveBeenCalled();
      expect(wizardCore.options).toHaveProperty('projectPath');
      expect(wizardCore.options).toHaveProperty('mcpConfigPath');
      expect(wizardCore.options).toHaveProperty('roomodesPath');
      expect(wizardCore.registryClient).toBeInstanceOf(RegistryClient);
    });
    
    it('should initialize with custom options', async () => {
      const customOptions = {
        projectPath: testProjectPath,
        mcpConfigPath: 'custom/path/mcp.json',
        registryUrl: 'https://custom-registry.example.com'
      };
      
      const result = await wizardCore.initialize(customOptions);
      
      expect(result.success).toBe(true);
      expect(wizardCore.options.projectPath).toBe(customOptions.projectPath);
      expect(wizardCore.options.mcpConfigPath).toBe(customOptions.mcpConfigPath);
      expect(wizardCore.options.registryUrl).toBe(customOptions.registryUrl);
    });
    
    it('should handle initialization errors', async () => {
      fileManager.createDirectory.mockRejectedValue(new Error('Directory creation failed'));
      
      const result = await wizardCore.initialize();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Directory creation failed');
    });
  });
  
  describe('discoverServers', () => {
    beforeEach(async () => {
      await wizardCore.initialize();
    });
    
    it('should discover available servers', async () => {
      const result = await wizardCore.discoverServers();
      
      expect(result.success).toBe(true);
      expect(result.servers).toHaveLength(1);
      expect(result.servers[0].id).toBe('test-server');
      expect(RegistryClient.prototype.getServers).toHaveBeenCalled();
    });
    
    it('should pass search parameters to registry client', async () => {
      const searchParams = { search: 'test', tags: 'database,cloud' };
      
      await wizardCore.discoverServers(searchParams);
      
      expect(RegistryClient.prototype.getServers).toHaveBeenCalledWith(searchParams);
    });
    
    it('should handle registry client errors', async () => {
      RegistryClient.prototype.getServers.mockRejectedValue(new Error('Registry error'));
      
      const result = await wizardCore.discoverServers();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Registry error');
    });
  });
  
  describe('getServerDetails', () => {
    beforeEach(async () => {
      await wizardCore.initialize();
    });
    
    it('should get server details', async () => {
      const result = await wizardCore.getServerDetails('test-server');
      
      expect(result.success).toBe(true);
      expect(result.server.id).toBe('test-server');
      expect(result.server.name).toBe('Test Server');
      expect(RegistryClient.prototype.getServerDetails).toHaveBeenCalledWith('test-server');
    });
    
    it('should handle registry client errors', async () => {
      RegistryClient.prototype.getServerDetails.mockRejectedValue(new Error('Server not found'));
      
      const result = await wizardCore.getServerDetails('non-existent-server');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Server not found');
    });
  });
  
  describe('validateConfiguration', () => {
    beforeEach(async () => {
      await wizardCore.initialize({
        projectPath: testProjectPath,
        mcpConfigPath: testMcpConfigPath
      });
    });
    
    it('should validate a valid configuration', async () => {
      // Mock a valid configuration
      fileManager.safeReadConfig.mockResolvedValue({
        mcpServers: {
          'test-server': {
            command: 'npx',
            args: ['-y', '@test-server/mcp-server@latest'],
            alwaysAllow: ['read', 'write']
          }
        }
      });
      
      const result = await wizardCore.validateConfiguration();
      
      expect(result.success).toBe(true);
      expect(result.config).toHaveProperty('mcpServers.test-server');
    });
    
    it('should detect invalid configuration', async () => {
      // Mock an invalid configuration
      fileManager.safeReadConfig.mockResolvedValue({
        mcpServers: {
          'test-server': {
            // Missing required fields
            args: 'not-an-array' // Invalid type
          }
        }
      });
      
      const result = await wizardCore.validateConfiguration();
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeInstanceOf(Array);
      expect(result.errors.length).toBeGreaterThan(0);
    });
    
    it('should handle file read errors', async () => {
      fileManager.safeReadConfig.mockRejectedValue(new Error('File not found'));
      
      const result = await wizardCore.validateConfiguration();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('File not found');
    });
  });
  
  describe('backupConfiguration', () => {
    beforeEach(async () => {
      await wizardCore.initialize({
        projectPath: testProjectPath,
        mcpConfigPath: testMcpConfigPath,
        roomodesPath: testRoomodesPath
      });
    });
    
    it('should create backups of existing configuration files', async () => {
      fileManager.exists.mockImplementation(async (filePath) => {
        return true; // Both files exist
      });
      
      const result = await wizardCore.backupConfiguration();
      
      expect(result.success).toBe(true);
      expect(result.backupPaths).toHaveProperty('mcpConfig');
      expect(result.backupPaths).toHaveProperty('roomodes');
      expect(fileManager.createBackup).toHaveBeenCalledTimes(2);
    });
    
    it('should handle missing configuration files', async () => {
      fileManager.exists.mockImplementation(async (filePath) => {
        return filePath.includes('mcp.json'); // Only MCP config exists
      });
      
      const result = await wizardCore.backupConfiguration();
      
      expect(result.success).toBe(true);
      expect(result.backupPaths).toHaveProperty('mcpConfig');
      expect(result.backupPaths).not.toHaveProperty('roomodes');
      expect(fileManager.createBackup).toHaveBeenCalledTimes(1);
    });
    
    it('should handle backup errors', async () => {
      fileManager.createBackup.mockRejectedValue(new Error('Backup failed'));
      
      const result = await wizardCore.backupConfiguration();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Backup failed');
    });
  });
  
  describe('restoreConfiguration', () => {
    beforeEach(async () => {
      await wizardCore.initialize({
        projectPath: testProjectPath,
        mcpConfigPath: testMcpConfigPath,
        roomodesPath: testRoomodesPath
      });
    });
    
    it('should restore configuration from backups', async () => {
      const backupPaths = {
        mcpConfig: '/path/to/mcp.json.bak',
        roomodes: '/path/to/roomodes.bak'
      };
      
      const result = await wizardCore.restoreConfiguration(backupPaths);
      
      expect(result.success).toBe(true);
      expect(result.results).toHaveProperty('mcpConfig');
      expect(result.results).toHaveProperty('roomodes');
      expect(fileManager.restoreFromBackup).toHaveBeenCalledTimes(2);
    });
    
    it('should handle partial backups', async () => {
      const backupPaths = {
        mcpConfig: '/path/to/mcp.json.bak'
        // No roomodes backup
      };
      
      const result = await wizardCore.restoreConfiguration(backupPaths);
      
      expect(result.success).toBe(true);
      expect(result.results).toHaveProperty('mcpConfig');
      expect(result.results).not.toHaveProperty('roomodes');
      expect(fileManager.restoreFromBackup).toHaveBeenCalledTimes(1);
    });
    
    it('should handle restore errors', async () => {
      fileManager.restoreFromBackup.mockRejectedValue(new Error('Restore failed'));
      
      const backupPaths = {
        mcpConfig: '/path/to/mcp.json.bak'
      };
      
      const result = await wizardCore.restoreConfiguration(backupPaths);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Restore failed');
    });
  });
  
  describe('configureServerWorkflow', () => {
    beforeEach(async () => {
      await wizardCore.initialize({
        projectPath: testProjectPath,
        mcpConfigPath: testMcpConfigPath,
        roomodesPath: testRoomodesPath
      });
      
      // Mock the internal methods
      wizardCore.backupConfiguration = jest.fn().mockResolvedValue({
        success: true,
        backupPaths: {
          mcpConfig: '/path/to/mcp.json.bak',
          roomodes: '/path/to/roomodes.bak'
        }
      });
      
      wizardCore.configureServer = jest.fn().mockResolvedValue({
        success: true,
        mcpConfig: { mcpServers: { 'test-server': {} } },
        roomodes: { customModes: [] }
      });
      
      wizardCore.validateConfiguration = jest.fn().mockResolvedValue({
        success: true,
        config: { mcpServers: { 'test-server': {} } }
      });
      
      wizardCore.restoreConfiguration = jest.fn().mockResolvedValue({
        success: true,
        results: { mcpConfig: true, roomodes: true }
      });
    });
    
    it('should execute the complete configuration workflow', async () => {
      const userParams = { apiKey: '${env:TEST_SERVER_API_KEY}', region: 'us-east-1' };
      
      const result = await wizardCore.configureServerWorkflow('test-server', userParams);
      
      expect(result.success).toBe(true);
      expect(result.serverId).toBe('test-server');
      expect(result).toHaveProperty('backupPaths');
      expect(result).toHaveProperty('mcpConfig');
      expect(result).toHaveProperty('roomodes');
      
      // Verify workflow steps
      expect(wizardCore.backupConfiguration).toHaveBeenCalled();
      expect(wizardCore.configureServer).toHaveBeenCalledWith('test-server', userParams);
      expect(wizardCore.validateConfiguration).toHaveBeenCalled();
      expect(wizardCore.restoreConfiguration).not.toHaveBeenCalled(); // No errors, no restore needed
    });
    
    it('should restore from backup if configuration fails', async () => {
      wizardCore.configureServer.mockResolvedValue({
        success: false,
        error: 'Configuration failed'
      });
      
      const result = await wizardCore.configureServerWorkflow('test-server', {});
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Configuration failed');
      expect(wizardCore.restoreConfiguration).toHaveBeenCalled();
    });
    
    it('should restore from backup if validation fails', async () => {
      wizardCore.validateConfiguration.mockResolvedValue({
        success: false,
        errors: [{ property: 'mcpServers.test-server.args', message: 'Invalid args' }]
      });
      
      const result = await wizardCore.configureServerWorkflow('test-server', {});
      
      expect(result.success).toBe(false);
      expect(wizardCore.restoreConfiguration).toHaveBeenCalled();
    });
    
    it('should handle workflow errors', async () => {
      wizardCore.backupConfiguration.mockRejectedValue(new Error('Backup failed'));
      
      const result = await wizardCore.configureServerWorkflow('test-server', {});
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Backup failed');
    });
  });
});