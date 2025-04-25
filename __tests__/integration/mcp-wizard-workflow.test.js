/**
 * End-to-End Workflow tests for MCP Configuration Wizard
 * 
 * These tests verify complete workflows from start to finish,
 * simulating real-world usage scenarios.
 */

const path = require('path');
const fs = require('fs-extra');
const { wizardCore } = require('../../src/core/mcp-wizard/wizard-core');
const { RegistryClient } = require('../../src/core/registry-client');
const { fileManager } = require('../../src/core/file-manager');
const { mcpWizard } = require('../../src/core/mcp-wizard');

// Create a temporary test directory
const TEST_DIR = path.join(__dirname, '../fixtures/mcp-wizard-workflow');
const MCP_CONFIG_PATH = path.join(TEST_DIR, '.roo/mcp.json');
const ROOMODES_PATH = path.join(TEST_DIR, '.roomodes');

// Sample server data for testing
const TEST_SERVERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'OpenAI API integration',
    tags: ['ai', 'openai'],
    command: 'npx',
    args: ['-y', '@openai/mcp-server@latest'],
    recommendedPermissions: ['read', 'write']
  },
  {
    id: 'azure',
    name: 'Azure',
    description: 'Azure API integration',
    tags: ['cloud', 'azure'],
    command: 'npx',
    args: ['-y', '@azure/mcp-server@latest'],
    recommendedPermissions: ['read', 'write']
  },
  {
    id: 'aws',
    name: 'AWS',
    description: 'AWS API integration',
    tags: ['cloud', 'aws'],
    command: 'npx',
    args: ['-y', '@aws/mcp-server@latest'],
    recommendedPermissions: ['read', 'write', 'delete']
  }
];

// Sample user parameters
const TEST_USER_PARAMS = {
  openai: {
    apiKey: '${env:OPENAI_API_KEY}',
    region: 'us-east-1',
    model: 'gpt-4',
    permissions: ['read', 'write']
  },
  azure: {
    apiKey: '${env:AZURE_API_KEY}',
    region: 'eastus',
    permissions: ['read', 'write']
  },
  aws: {
    apiKey: '${env:AWS_API_KEY}',
    region: 'us-west-2',
    permissions: ['read', 'write', 'delete']
  }
};

describe('MCP Wizard Complete Workflows', () => {
  beforeAll(async () => {
    // Create test directory structure
    await fs.ensureDir(path.join(TEST_DIR, '.roo'));
    
    // Mock the registry client
    jest.spyOn(RegistryClient.prototype, 'getServerDetails').mockImplementation(async (serverId) => {
      const server = TEST_SERVERS.find(s => s.id === serverId);
      if (server) {
        return server;
      }
      throw new Error(`Server not found: ${serverId}`);
    });
    
    jest.spyOn(RegistryClient.prototype, 'getServers').mockResolvedValue({
      items: TEST_SERVERS,
      pagination: { total: TEST_SERVERS.length, page: 1, pageSize: 10 }
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
  
  describe('Multi-server configuration workflow', () => {
    it('should configure multiple servers and validate the complete setup', async () => {
      // Step 1: Discover available servers
      const discoverResult = await wizardCore.discoverServers();
      expect(discoverResult.success).toBe(true);
      expect(discoverResult.servers).toHaveLength(TEST_SERVERS.length);
      
      // Step 2: Configure each server one by one
      for (const server of TEST_SERVERS) {
        const configResult = await wizardCore.configureServerWorkflow(
          server.id, 
          TEST_USER_PARAMS[server.id]
        );
        expect(configResult.success).toBe(true);
      }
      
      // Step 3: Verify all servers are configured
      const listResult = await wizardCore.listConfiguredServers();
      expect(listResult.success).toBe(true);
      expect(Object.keys(listResult.servers)).toHaveLength(TEST_SERVERS.length);
      
      // Step 4: Validate the configuration
      const validationResult = await wizardCore.validateConfiguration();
      expect(validationResult.success).toBe(true);
      
      // Step 5: Verify configuration content
      const mcpConfig = await fs.readJson(MCP_CONFIG_PATH);
      expect(mcpConfig).toHaveProperty('mcpServers');
      
      for (const server of TEST_SERVERS) {
        expect(mcpConfig.mcpServers).toHaveProperty(server.id);
        expect(mcpConfig.mcpServers[server.id].command).toBe(server.command);
        
        // Verify server-specific parameters
        const serverConfig = mcpConfig.mcpServers[server.id];
        const userParams = TEST_USER_PARAMS[server.id];
        
        // Check if the args contain the region
        const regionArgIndex = serverConfig.args.findIndex(arg => arg === '--region') + 1;
        expect(serverConfig.args[regionArgIndex]).toBe(userParams.region);
        
        // Check if permissions were set correctly
        expect(serverConfig.alwaysAllow).toEqual(expect.arrayContaining(userParams.permissions));
        
        // Check model parameter for OpenAI
        if (server.id === 'openai') {
          const modelArgIndex = serverConfig.args.findIndex(arg => arg === '--model') + 1;
          expect(serverConfig.args[modelArgIndex]).toBe(userParams.model);
        }
      }
      
      // Step 6: Verify roomodes file
      const roomodes = await fs.readJson(ROOMODES_PATH);
      expect(roomodes).toHaveProperty('customModes');
      
      // Check that each server has a corresponding roomode
      for (const server of TEST_SERVERS) {
        expect(roomodes.customModes.some(mode => mode.slug === `mcp-${server.id}`)).toBe(true);
      }
    });
    
    it('should handle updates to multiple servers', async () => {
      // Step 1: Configure all servers
      for (const server of TEST_SERVERS) {
        await wizardCore.configureServerWorkflow(
          server.id, 
          TEST_USER_PARAMS[server.id]
        );
      }
      
      // Step 2: Update each server with new parameters
      for (const server of TEST_SERVERS) {
        const updatedParams = {
          ...TEST_USER_PARAMS[server.id],
          region: 'eu-west-1', // Change region for all servers
          permissions: [...TEST_USER_PARAMS[server.id].permissions, 'admin'] // Add admin permission
        };
        
        const updateResult = await wizardCore.updateServerConfig(server.id, updatedParams);
        expect(updateResult.success).toBe(true);
      }
      
      // Step 3: Verify updates
      const mcpConfig = await fs.readJson(MCP_CONFIG_PATH);
      
      for (const server of TEST_SERVERS) {
        const serverConfig = mcpConfig.mcpServers[server.id];
        
        // Check if the region was updated
        const regionArgIndex = serverConfig.args.findIndex(arg => arg === '--region') + 1;
        expect(serverConfig.args[regionArgIndex]).toBe('eu-west-1');
        
        // Check if admin permission was added
        expect(serverConfig.alwaysAllow).toContain('admin');
      }
    });
    
    it('should handle selective removal of servers', async () => {
      // Step 1: Configure all servers
      for (const server of TEST_SERVERS) {
        await wizardCore.configureServerWorkflow(
          server.id, 
          TEST_USER_PARAMS[server.id]
        );
      }
      
      // Step 2: Remove one server
      const serverToRemove = TEST_SERVERS[1]; // Azure
      const removeResult = await wizardCore.removeServer(serverToRemove.id);
      expect(removeResult.success).toBe(true);
      
      // Step 3: Verify the server was removed
      const listResult = await wizardCore.listConfiguredServers();
      expect(listResult.success).toBe(true);
      expect(Object.keys(listResult.servers)).toHaveLength(TEST_SERVERS.length - 1);
      expect(listResult.servers).not.toHaveProperty(serverToRemove.id);
      
      // Step 4: Verify remaining servers are still configured correctly
      const mcpConfig = await fs.readJson(MCP_CONFIG_PATH);
      
      for (const server of TEST_SERVERS) {
        if (server.id !== serverToRemove.id) {
          expect(mcpConfig.mcpServers).toHaveProperty(server.id);
        } else {
          expect(mcpConfig.mcpServers).not.toHaveProperty(server.id);
        }
      }
      
      // Step 5: Verify roomodes file
      const roomodes = await fs.readJson(ROOMODES_PATH);
      
      // Check that the removed server doesn't have a roomode
      expect(roomodes.customModes.some(mode => mode.slug === `mcp-${serverToRemove.id}`)).toBe(false);
      
      // Check that other servers still have roomodes
      for (const server of TEST_SERVERS) {
        if (server.id !== serverToRemove.id) {
          expect(roomodes.customModes.some(mode => mode.slug === `mcp-${server.id}`)).toBe(true);
        }
      }
    });
  });
  
  describe('Error recovery workflows', () => {
    it('should restore from backup if configuration fails', async () => {
      // Step 1: Configure a server successfully
      const server = TEST_SERVERS[0];
      await wizardCore.configureServerWorkflow(
        server.id, 
        TEST_USER_PARAMS[server.id]
      );
      
      // Step 2: Create a backup of the current configuration
      const backupResult = await wizardCore.backupConfiguration();
      expect(backupResult.success).toBe(true);
      
      // Step 3: Mock a failure during configuration
      const originalAddServer = mcpWizard.addServer;
      mcpWizard.addServer = jest.fn().mockRejectedValue(new Error('Simulated failure'));
      
      // Step 4: Attempt to configure another server (should fail)
      const failedServer = TEST_SERVERS[1];
      const failedResult = await wizardCore.configureServerWorkflow(
        failedServer.id, 
        TEST_USER_PARAMS[failedServer.id]
      );
      
      expect(failedResult.success).toBe(false);
      
      // Step 5: Verify the configuration was restored from backup
      const mcpConfig = await fs.readJson(MCP_CONFIG_PATH);
      expect(Object.keys(mcpConfig.mcpServers)).toHaveLength(1);
      expect(mcpConfig.mcpServers).toHaveProperty(server.id);
      expect(mcpConfig.mcpServers).not.toHaveProperty(failedServer.id);
      
      // Restore the original function
      mcpWizard.addServer = originalAddServer;
    });
    
    it('should handle validation failures during configuration', async () => {
      // Step 1: Configure a server successfully
      const server = TEST_SERVERS[0];
      await wizardCore.configureServerWorkflow(
        server.id,
        TEST_USER_PARAMS[server.id]
      );
      
      // Step 2: Mock the validateConfiguration method to simulate a validation failure
      const originalValidateConfiguration = wizardCore.validateConfiguration;
      wizardCore.validateConfiguration = jest.fn().mockResolvedValue({
        success: false,
        errors: [{ message: 'Simulated validation error' }]
      });
      
      // Step 3: Attempt to configure another server (should fail validation)
      const failedServer = TEST_SERVERS[1];
      const failedResult = await wizardCore.configureServerWorkflow(
        failedServer.id,
        TEST_USER_PARAMS[failedServer.id]
      );
      
      // Step 4: Verify the result is a failure
      expect(failedResult.success).toBe(false);
      
      // Step 5: Verify the configuration was restored from backup
      const mcpConfig = await fs.readJson(MCP_CONFIG_PATH);
      expect(Object.keys(mcpConfig.mcpServers)).toHaveLength(1);
      
      // Restore the original function
      wizardCore.validateConfiguration = originalValidateConfiguration;
      expect(mcpConfig.mcpServers).toHaveProperty(server.id);
      expect(mcpConfig.mcpServers).not.toHaveProperty(failedServer.id);
      
      // Restore the original function
      wizardCore.validateConfiguration = originalValidateConfiguration;
    });
  });
  
  describe('Advanced configuration scenarios', () => {
    it('should handle servers with custom parameters', async () => {
      // Create a server with custom parameters
      const customServer = {
        id: 'custom-server',
        name: 'Custom Server',
        description: 'Server with custom parameters',
        tags: ['custom'],
        command: 'npx',
        args: ['-y', '@custom/mcp-server@latest'],
        recommendedPermissions: ['read', 'write'],
        parameters: [
          {
            name: 'customParam1',
            type: 'string',
            required: true,
            description: 'Custom parameter 1'
          },
          {
            name: 'customParam2',
            type: 'number',
            required: false,
            default: 42,
            description: 'Custom parameter 2'
          }
        ]
      };
      
      // Mock getServerDetails for the custom server
      const originalGetServerDetails = RegistryClient.prototype.getServerDetails;
      RegistryClient.prototype.getServerDetails = jest.fn().mockImplementation(async (serverId) => {
        if (serverId === customServer.id) {
          return customServer;
        }
        return originalGetServerDetails.call(this, serverId);
      });
      
      // Configure the custom server
      const customParams = {
        apiKey: '${env:CUSTOM_API_KEY}',
        region: 'us-central1',
        permissions: ['read', 'write'],
        customParam1: 'custom-value',
        customParam2: 100
      };
      
      const configResult = await wizardCore.configureServerWorkflow(
        customServer.id,
        customParams
      );
      
      expect(configResult.success).toBe(true);
      
      // Verify custom parameters were included
      const mcpConfig = await fs.readJson(MCP_CONFIG_PATH);
      const serverConfig = mcpConfig.mcpServers[customServer.id];
      
      expect(serverConfig.args).toContain('--customParam1');
      const param1Index = serverConfig.args.findIndex(arg => arg === '--customParam1') + 1;
      expect(serverConfig.args[param1Index]).toBe('custom-value');
      
      expect(serverConfig.args).toContain('--customParam2');
      const param2Index = serverConfig.args.findIndex(arg => arg === '--customParam2') + 1;
      expect(serverConfig.args[param2Index]).toBe('100');
      
      // Restore the original function
      RegistryClient.prototype.getServerDetails = originalGetServerDetails;
    });
  });
});