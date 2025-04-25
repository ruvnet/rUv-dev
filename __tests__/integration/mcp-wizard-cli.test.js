/**
 * End-to-End tests for MCP Configuration Wizard CLI Integration
 * 
 * These tests verify that the MCP Configuration Wizard CLI commands
 * work correctly in various real-world scenarios.
 */

const path = require('path');
const fs = require('fs-extra');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Create a temporary test directory
const TEST_DIR = path.join(__dirname, '../fixtures/mcp-wizard-cli-e2e');
const MCP_CONFIG_PATH = path.join(TEST_DIR, '.roo/mcp.json');
const ROOMODES_PATH = path.join(TEST_DIR, '.roomodes');
const CLI_PATH = path.join(__dirname, '../../bin/index.js');

// Helper function to run CLI commands
async function runCommand(command) {
  try {
    // Replace environment variable references in the command
    const processedCommand = command.replace(/\${env:([^}]+)}/g, (match, envVar) => {
      return process.env[envVar] || match;
    });
    
    const { stdout, stderr } = await execPromise(`node ${CLI_PATH} ${processedCommand}`, {
      cwd: TEST_DIR,
      env: { ...process.env, NODE_ENV: 'test' }
    });
    return { success: true, stdout, stderr };
  } catch (error) {
    return {
      success: false,
      stdout: error.stdout,
      stderr: error.stderr,
      error
    };
  }
}

// Mock environment variables for testing
process.env.TEST_SERVER_API_KEY = 'test-api-key-12345';
process.env.OPENAI_API_KEY = 'test-openai-key-67890';

describe('MCP Wizard CLI End-to-End', () => {
  beforeAll(async () => {
    // Create test directory structure
    await fs.ensureDir(path.join(TEST_DIR, '.roo'));
    
    // Create a basic package.json for the test directory
    await fs.writeJson(path.join(TEST_DIR, 'package.json'), {
      name: 'mcp-wizard-cli-test',
      version: '1.0.0',
      description: 'Test package for MCP Wizard CLI E2E tests'
    });
    
    // Create a mock registry for testing
    // This would normally be done by mocking network requests,
    // but for simplicity we'll use a file-based approach
    await fs.writeJson(path.join(TEST_DIR, '.roo/mock-registry.json'), {
      servers: [
        {
          id: 'test-server',
          name: 'Test Server',
          description: 'A test server for E2E testing',
          tags: ['test', 'e2e'],
          command: 'npx',
          args: ['-y', '@test-server/mcp-server@latest'],
          recommendedPermissions: ['read', 'write']
        },
        {
          id: 'openai',
          name: 'OpenAI',
          description: 'OpenAI API integration',
          tags: ['ai', 'openai'],
          command: 'npx',
          args: ['-y', '@openai/mcp-server@latest'],
          recommendedPermissions: ['read', 'write']
        }
      ]
    });
  });
  
  afterAll(async () => {
    // Clean up test directory
    await fs.remove(TEST_DIR);
  });
  
  beforeEach(async () => {
    // Reset test files before each test
    await fs.emptyDir(path.join(TEST_DIR, '.roo'));
    if (await fs.pathExists(ROOMODES_PATH)) {
      await fs.remove(ROOMODES_PATH);
    }
    
    // Restore the mock registry
    await fs.ensureDir(path.join(TEST_DIR, '.roo'));
    await fs.writeJson(path.join(TEST_DIR, '.roo/mock-registry.json'), {
      servers: [
        {
          id: 'test-server',
          name: 'Test Server',
          description: 'A test server for E2E testing',
          tags: ['test', 'e2e'],
          command: 'npx',
          args: ['-y', '@test-server/mcp-server@latest'],
          recommendedPermissions: ['read', 'write']
        },
        {
          id: 'openai',
          name: 'OpenAI',
          description: 'OpenAI API integration',
          tags: ['ai', 'openai'],
          command: 'npx',
          args: ['-y', '@openai/mcp-server@latest'],
          recommendedPermissions: ['read', 'write']
        }
      ]
    });
  });
  
  describe('CLI Command Integration', () => {
    // This test uses a mock stdin to simulate user input
    // It's more complex and might be skipped in CI environments
    test.skip('interactive wizard workflow', async () => {
      // This would require mocking stdin which is complex
      // For now, we'll focus on the non-interactive commands
    });
    
    test('list servers when none are configured', async () => {
      const result = await runCommand('wizard --list');
      
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('No MCP servers configured');
    });
    
    test('add server with specific options', async () => {
      // Use --no-interactive to avoid prompts
      const result = await runCommand(
        'wizard --add test-server --no-interactive ' +
        '--api-key "${env:TEST_SERVER_API_KEY}" ' +
        '--region us-west-2 ' +
        '--permissions read,write'
      );
      
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('added successfully');
      
      // Verify configuration files were created
      const mcpConfigExists = await fs.pathExists(MCP_CONFIG_PATH);
      const roomodesExists = await fs.pathExists(ROOMODES_PATH);
      expect(mcpConfigExists).toBe(true);
      expect(roomodesExists).toBe(true);
      
      // Verify configuration content
      const mcpConfig = await fs.readJson(MCP_CONFIG_PATH);
      expect(mcpConfig).toHaveProperty('mcpServers');
      expect(mcpConfig.mcpServers).toHaveProperty('test-server');
      expect(mcpConfig.mcpServers['test-server'].command).toBe('npx');
    });
    
    test('list servers after configuration', async () => {
      // First add a server
      await runCommand(
        'wizard --add test-server --no-interactive ' +
        '--api-key "${env:TEST_SERVER_API_KEY}" ' +
        '--region us-west-2 ' +
        '--permissions read,write'
      );
      
      // Then list servers
      const result = await runCommand('wizard --list');
      
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('test-server');
      expect(result.stdout).toContain('npx');
    });
    
    test('update server configuration', async () => {
      // First add a server
      await runCommand(
        'wizard --add test-server --no-interactive ' +
        '--api-key "${env:TEST_SERVER_API_KEY}" ' +
        '--region us-west-2 ' +
        '--permissions read,write'
      );
      
      // Then update it
      const result = await runCommand(
        'wizard --update test-server --no-interactive ' +
        '--api-key "${env:TEST_SERVER_API_KEY}" ' +
        '--region eu-central-1 ' +
        '--permissions read,write,delete'
      );
      
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('updated successfully');
      
      // Verify the update
      const mcpConfig = await fs.readJson(MCP_CONFIG_PATH);
      const serverConfig = mcpConfig.mcpServers['test-server'];
      
      // Check if the args contain the updated region
      const regionArgIndex = serverConfig.args.findIndex(arg => arg === '--region') + 1;
      expect(serverConfig.args[regionArgIndex]).toBe('eu-central-1');
      
      // Check if permissions were updated
      expect(serverConfig.alwaysAllow).toContain('delete');
    });
    
    test('remove server configuration', async () => {
      // First add a server
      await runCommand(
        'wizard --add test-server --no-interactive ' +
        '--api-key "${env:TEST_SERVER_API_KEY}" ' +
        '--region us-west-2 ' +
        '--permissions read,write'
      );
      
      // Then remove it
      const result = await runCommand(
        'wizard --remove test-server --no-interactive'
      );
      
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('removed successfully');
      
      // Verify the server was removed
      const mcpConfig = await fs.readJson(MCP_CONFIG_PATH);
      expect(mcpConfig.mcpServers).not.toHaveProperty('test-server');
    });
    
    test('configure multiple servers', async () => {
      // Add first server
      await runCommand(
        'wizard --add test-server --no-interactive ' +
        '--api-key "${env:TEST_SERVER_API_KEY}" ' +
        '--region us-west-2 ' +
        '--permissions read,write'
      );
      
      // Add second server
      await runCommand(
        'wizard --add openai --no-interactive ' +
        '--api-key "${env:OPENAI_API_KEY}" ' +
        '--region us-east-1 ' +
        '--permissions read,write'
      );
      
      // List servers
      const result = await runCommand('wizard --list');
      
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('test-server');
      expect(result.stdout).toContain('openai');
      
      // Verify configuration
      const mcpConfig = await fs.readJson(MCP_CONFIG_PATH);
      expect(Object.keys(mcpConfig.mcpServers)).toHaveLength(2);
      expect(mcpConfig.mcpServers).toHaveProperty('test-server');
      expect(mcpConfig.mcpServers).toHaveProperty('openai');
    });
    
    test('handle invalid server ID', async () => {
      const result = await runCommand(
        'wizard --add invalid!server --no-interactive ' +
        '--api-key "test-key" ' +
        '--region us-west-2 ' +
        '--permissions read,write'
      );
      
      expect(result.success).toBe(false);
      expect(result.stderr).toContain('Invalid server ID');
    });
    
    test('handle non-existent server for update', async () => {
      const result = await runCommand(
        'wizard --update non-existent-server --no-interactive ' +
        '--api-key "test-key" ' +
        '--region us-west-2 ' +
        '--permissions read,write'
      );
      
      expect(result.success).toBe(false);
      expect(result.stderr).toContain('not found');
    });
    
    test('handle non-existent server for removal', async () => {
      const result = await runCommand(
        'wizard --remove non-existent-server --no-interactive'
      );
      
      expect(result.success).toBe(false);
      expect(result.stderr).toContain('not found');
    });
  });
  
  describe('Complete Workflows', () => {
    test('full lifecycle: add, list, update, remove', async () => {
      // Step 1: Add a server
      let result = await runCommand(
        'wizard --add test-server --no-interactive ' +
        '--api-key "${env:TEST_SERVER_API_KEY}" ' +
        '--region us-west-2 ' +
        '--permissions read,write'
      );
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('added successfully');
      
      // Step 2: List servers
      result = await runCommand('wizard --list');
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('test-server');
      
      // Step 3: Update server
      result = await runCommand(
        'wizard --update test-server --no-interactive ' +
        '--api-key "${env:TEST_SERVER_API_KEY}" ' +
        '--region eu-central-1 ' +
        '--permissions read,write,delete'
      );
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('updated successfully');
      
      // Step 4: List servers again to verify update
      result = await runCommand('wizard --list');
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('test-server');
      
      // Step 5: Remove server
      result = await runCommand(
        'wizard --remove test-server --no-interactive'
      );
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('removed successfully');
      
      // Step 6: List servers to verify removal
      result = await runCommand('wizard --list');
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('No MCP servers configured');
    });
    
    test('multiple server configuration with different options', async () => {
      // Add first server with minimal options
      let result = await runCommand(
        'wizard --add test-server --no-interactive ' +
        '--api-key "${env:TEST_SERVER_API_KEY}"'
      );
      expect(result.success).toBe(true);
      
      // Add second server with all options
      result = await runCommand(
        'wizard --add openai --no-interactive ' +
        '--api-key "${env:OPENAI_API_KEY}" ' +
        '--region us-east-1 ' +
        '--permissions read,write,delete ' +
        '--model gpt-4 ' +
        '--timeout 30'
      );
      expect(result.success).toBe(true);
      
      // Verify configuration
      const mcpConfig = await fs.readJson(MCP_CONFIG_PATH);
      expect(Object.keys(mcpConfig.mcpServers)).toHaveLength(2);
      
      // First server should have default values
      expect(mcpConfig.mcpServers['test-server'].args).toContain('--region');
      expect(mcpConfig.mcpServers['test-server'].args).toContain('us-east-1'); // Default region
      
      // Second server should have custom values
      const openaiServer = mcpConfig.mcpServers['openai'];
      expect(openaiServer.args).toContain('--region');
      expect(openaiServer.args).toContain('us-east-1');
      expect(openaiServer.args).toContain('--model');
      expect(openaiServer.args).toContain('gpt-4');
      expect(openaiServer.args).toContain('--timeout');
      expect(openaiServer.args).toContain('30');
      expect(openaiServer.alwaysAllow).toContain('delete');
    });
    
    test('error recovery: add server, corrupt config, fix with update', async () => {
      // Step 1: Add a server
      let result = await runCommand(
        'wizard --add test-server --no-interactive ' +
        '--api-key "${env:TEST_SERVER_API_KEY}" ' +
        '--region us-west-2 ' +
        '--permissions read,write'
      );
      expect(result.success).toBe(true);
      
      // Step 2: Corrupt the configuration
      const mcpConfig = await fs.readJson(MCP_CONFIG_PATH);
      mcpConfig.mcpServers['test-server'].args = 'not-an-array'; // Invalid type
      await fs.writeJson(MCP_CONFIG_PATH, mcpConfig);
      
      // Step 3: Attempt to list servers (should fail or show warning)
      result = await runCommand('wizard --list');
      // We don't assert success/failure here as implementations may vary
      
      // Step 4: Fix with update
      result = await runCommand(
        'wizard --update test-server --no-interactive ' +
        '--api-key "${env:TEST_SERVER_API_KEY}" ' +
        '--region us-west-2 ' +
        '--permissions read,write'
      );
      expect(result.success).toBe(true);
      
      // Step 5: Verify configuration is fixed
      const fixedConfig = await fs.readJson(MCP_CONFIG_PATH);
      expect(Array.isArray(fixedConfig.mcpServers['test-server'].args)).toBe(true);
    });
  });
});