/**
 * Integration tests for MCP Configuration Wizard
 * 
 * These tests verify that all components of the MCP Configuration Wizard
 * work together correctly in various scenarios.
 */

const path = require('path');
const fs = require('fs-extra');
const { wizardCore } = require('../../src/core/mcp-wizard');
const { RegistryClient } = require('../../src/core/registry-client');
const { fileManager } = require('../../src/core/file-manager');

// Create a temporary test directory
const TEST_DIR = path.join(__dirname, '../fixtures/mcp-wizard-integration');
const MCP_CONFIG_PATH = path.join(TEST_DIR, '.roo/mcp.json');
const ROOMODES_PATH = path.join(TEST_DIR, '.roomodes');

// Sample server data for testing
const TEST_SERVER = {
  id: 'test-server',
  name: 'Test Server',
  description: 'A test server for integration testing',
  tags: ['test', 'integration'],
  command: 'npx',
  args: ['-y', '@test-server/mcp-server@latest'],
  recommendedPermissions: ['read', 'write']
};

// Sample user parameters
const TEST_USER_PARAMS = {
  apiKey: '${env:TEST_SERVER_API_KEY}',
  region: 'us-east-1'
};

describe('MCP Wizard Integration', () => {
  beforeAll(async () => {
    // Create test directory structure
    await fs.ensureDir(path.join(TEST_DIR, '.roo'));
    
    // Mock the registry client
    jest.spyOn(RegistryClient.prototype, 'getServerDetails').mockImplementation(async (serverId) => {
      if (serverId === TEST_SERVER.id) {
        return TEST_SERVER;
      }
      throw new Error(`Server not found: ${serverId}`);
    });
    
    jest.spyOn(RegistryClient.prototype, 'getServers').mockResolvedValue({
      items: [TEST_SERVER],
      pagination: { total: 1, page: 1, pageSize: 10 }
    });
  });
  
  afterAll(async () => {
    // Clean up test directory
    await fs.remove(TEST_DIR);
    
    // Restore mocks
    jest.restoreAllMocks();
  });
  
  beforeEach(async () => {
    // Reset test files before each test
    await fs.emptyDir(path.join(TEST_DIR, '.roo'));
    if (await fs.pathExists(ROOMODES_PATH)) {
      await fs.remove(ROOMODES_PATH);
    }
    
    // Initialize wizard core with test directory
    await wizardCore.initialize({
      projectPath: TEST_DIR,
      mcpConfigPath: '.roo/mcp.json',
      roomodesPath: '.roomodes'
    });
  });
  
  describe('End-to-end configuration workflow', () => {
    it('should configure a server from scratch', async () => {
      // Step 1: Discover available servers
      const discoverResult = await wizardCore.discoverServers();
      expect(discoverResult.success).toBe(true);
      expect(discoverResult.servers).toHaveLength(1);
      expect(discoverResult.servers[0].id).toBe(TEST_SERVER.id);
      
      // Step 2: Get server details
      const detailsResult = await wizardCore.getServerDetails(TEST_SERVER.id);
      expect(detailsResult.success).toBe(true);
      expect(detailsResult.server.id).toBe(TEST_SERVER.id);
      
      // Step 3: Configure the server
      const configResult = await wizardCore.configureServerWorkflow(TEST_SERVER.id, TEST_USER_PARAMS);
      expect(configResult.success).toBe(true);
      
      // Step 4: Verify configuration files were created
      const mcpConfigExists = await fs.pathExists(MCP_CONFIG_PATH);
      const roomodesExists = await fs.pathExists(ROOMODES_PATH);
      expect(mcpConfigExists).toBe(true);
      expect(roomodesExists).toBe(true);
      
      // Step 5: Verify configuration content
      const mcpConfig = await fs.readJson(MCP_CONFIG_PATH);
      expect(mcpConfig).toHaveProperty('mcpServers');
      expect(mcpConfig.mcpServers).toHaveProperty(TEST_SERVER.id);
      expect(mcpConfig.mcpServers[TEST_SERVER.id].command).toBe(TEST_SERVER.command);
      
      const roomodes = await fs.readJson(ROOMODES_PATH);
      expect(roomodes).toHaveProperty('customModes');
      expect(roomodes.customModes.some(mode => mode.slug === `mcp-${TEST_SERVER.id}`)).toBe(true);
      
      // Step 6: List configured servers
      const listResult = await wizardCore.listConfiguredServers();
      expect(listResult.success).toBe(true);
      expect(listResult.servers).toHaveProperty(TEST_SERVER.id);
    });
    
    it('should update an existing server configuration', async () => {
      // First, add a server
      await wizardCore.configureServerWorkflow(TEST_SERVER.id, TEST_USER_PARAMS);
      
      // Then update it with new parameters
      const updatedParams = {
        ...TEST_USER_PARAMS,
        region: 'eu-west-1',
        permissions: ['read', 'write', 'delete']
      };
      
      const updateResult = await wizardCore.updateServerConfig(TEST_SERVER.id, updatedParams);
      expect(updateResult.success).toBe(true);
      
      // Verify the update
      const mcpConfig = await fs.readJson(MCP_CONFIG_PATH);
      const serverConfig = mcpConfig.mcpServers[TEST_SERVER.id];
      
      // Check if the args contain the updated region
      const regionArgIndex = serverConfig.args.findIndex(arg => arg === '--region') + 1;
      expect(serverConfig.args[regionArgIndex]).toBe(updatedParams.region);
      
      // Check if permissions were updated
      expect(serverConfig.alwaysAllow).toContain('delete');
    });
    
    it('should remove a configured server', async () => {
      // First, add a server
      await wizardCore.configureServerWorkflow(TEST_SERVER.id, TEST_USER_PARAMS);
      
      // Then remove it
      const removeResult = await wizardCore.removeServer(TEST_SERVER.id);
      expect(removeResult.success).toBe(true);
      
      // Verify the server was removed
      const mcpConfig = await fs.readJson(MCP_CONFIG_PATH);
      expect(mcpConfig.mcpServers).not.toHaveProperty(TEST_SERVER.id);
      
      const roomodes = await fs.readJson(ROOMODES_PATH);
      expect(roomodes.customModes.some(mode => mode.slug === `mcp-${TEST_SERVER.id}`)).toBe(false);
    });
    
    it('should validate configuration', async () => {
      // First, add a server
      await wizardCore.configureServerWorkflow(TEST_SERVER.id, TEST_USER_PARAMS);
      
      // Validate the configuration
      const validationResult = await wizardCore.validateConfiguration();
      expect(validationResult.success).toBe(true);
      
      // Corrupt the configuration
      const mcpConfig = await fs.readJson(MCP_CONFIG_PATH);
      mcpConfig.mcpServers[TEST_SERVER.id].args = 'not-an-array'; // Invalid type
      await fs.writeJson(MCP_CONFIG_PATH, mcpConfig);
      
      // Validate again
      const invalidResult = await wizardCore.validateConfiguration();
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });
    
    it('should create and restore backups', async () => {
      // First, add a server
      await wizardCore.configureServerWorkflow(TEST_SERVER.id, TEST_USER_PARAMS);
      
      // Create a backup
      const backupResult = await wizardCore.backupConfiguration();
      expect(backupResult.success).toBe(true);
      expect(backupResult.backupPaths).toHaveProperty('mcpConfig');
      expect(backupResult.backupPaths).toHaveProperty('roomodes');
      
      // Verify backup files exist
      const mcpBackupExists = await fs.pathExists(backupResult.backupPaths.mcpConfig);
      const roomodesBackupExists = await fs.pathExists(backupResult.backupPaths.roomodes);
      expect(mcpBackupExists).toBe(true);
      expect(roomodesBackupExists).toBe(true);
      
      // Corrupt the configuration
      await fs.writeJson(MCP_CONFIG_PATH, { corrupted: true });
      
      // Restore from backup
      const restoreResult = await wizardCore.restoreConfiguration(backupResult.backupPaths);
      expect(restoreResult.success).toBe(true);
      
      // Verify configuration was restored
      const mcpConfig = await fs.readJson(MCP_CONFIG_PATH);
      expect(mcpConfig).toHaveProperty('mcpServers');
      expect(mcpConfig.mcpServers).toHaveProperty(TEST_SERVER.id);
    });
  });
  
  describe('Error handling', () => {
    it('should handle non-existent server', async () => {
      const result = await wizardCore.getServerDetails('non-existent-server');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Server not found');
    });
    
    it('should handle invalid server parameters', async () => {
      // Create an invalid configuration by directly manipulating files
      const invalidConfig = {
        mcpServers: {
          [TEST_SERVER.id]: {
            command: 123, // Invalid type, should be string
            args: ['--invalid'],
            alwaysAllow: 'not-an-array' // Invalid type
          }
        }
      };
      
      await fs.ensureDir(path.dirname(MCP_CONFIG_PATH));
      await fs.writeJson(MCP_CONFIG_PATH, invalidConfig);
      
      // Validate the configuration
      const validationResult = await wizardCore.validateConfiguration();
      expect(validationResult.success).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);
    });
    
    it('should handle file system errors', async () => {
      // Make the directory read-only to cause write errors
      const readOnlyDir = path.join(TEST_DIR, 'read-only');
      await fs.ensureDir(readOnlyDir);
      
      // Initialize with read-only directory
      await wizardCore.initialize({
        projectPath: readOnlyDir,
        mcpConfigPath: '.roo/mcp.json',
        roomodesPath: '.roomodes'
      });
      
      // Mock fs.ensureDir to simulate permission error
      const originalEnsureDir = fs.ensureDir;
      fs.ensureDir = jest.fn().mockRejectedValue(new Error('Permission denied'));
      
      // Attempt to configure a server
      const result = await wizardCore.configureServerWorkflow(TEST_SERVER.id, TEST_USER_PARAMS);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
      
      // Restore original function
      fs.ensureDir = originalEnsureDir;
    });
  });
});