/**
 * Tests for MCP Wizard CLI command options
 * 
 * These tests verify that the new CLI options for the MCP Wizard
 * are properly handled and passed to the appropriate functions.
 */

const { wizardCommand } = require('../../src/cli/commands/wizard');
const { mcpWizard } = require('../../src/core/mcp-wizard');
const { wizardCore } = require('../../src/core/mcp-wizard/wizard-core');
const inquirer = require('inquirer');

// Mock dependencies
jest.mock('../../src/core/mcp-wizard', () => ({
  mcpWizard: {
    listServers: jest.fn(),
    addServer: jest.fn(),
    removeServer: jest.fn(),
    updateServer: jest.fn()
  }
}));

jest.mock('../../src/core/mcp-wizard/wizard-core', () => ({
  wizardCore: {
    initialize: jest.fn(),
    validateConfiguration: jest.fn(),
    backupConfiguration: jest.fn(),
    restoreConfiguration: jest.fn()
  }
}));

jest.mock('inquirer');
jest.mock('../../src/utils', () => ({
  logger: {
    info: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    setLevel: jest.fn()
  }
}));

describe('MCP Wizard CLI Command Options', () => {
  let program;
  let action;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock Commander program
    action = jest.fn();
    program = {
      command: jest.fn().mockReturnThis(),
      description: jest.fn().mockReturnThis(),
      option: jest.fn().mockReturnThis(),
      action: jest.fn(fn => {
        action = fn;
        return program;
      })
    };
    
    // Register command
    wizardCommand(program);
    
    // Mock successful responses
    mcpWizard.listServers.mockResolvedValue({
      success: true,
      servers: {
        'test-server': {
          command: 'npx',
          args: ['-y', '@test/mcp-server@latest'],
          permissions: ['read', 'write']
        }
      }
    });
    
    mcpWizard.addServer.mockResolvedValue({
      success: true
    });
    
    mcpWizard.updateServer.mockResolvedValue({
      success: true
    });
    
    mcpWizard.removeServer.mockResolvedValue({
      success: true
    });
    
    wizardCore.validateConfiguration.mockResolvedValue({
      success: true,
      config: {
        mcpServers: {
          'test-server': {
            command: 'npx',
            args: ['-y', '@test/mcp-server@latest'],
            alwaysAllow: ['read', 'write']
          }
        }
      }
    });
    
    wizardCore.backupConfiguration.mockResolvedValue({
      success: true,
      backupPaths: {
        mcpConfig: '/path/to/backup/mcp.json',
        roomodes: '/path/to/backup/roomodes'
      }
    });
  });
  
  test('registers all CLI options', () => {
    expect(program.command).toHaveBeenCalledWith('wizard');
    expect(program.description).toHaveBeenCalled();
    expect(program.option).toHaveBeenCalledTimes(15); // Check that all options are registered
    expect(program.action).toHaveBeenCalled();
  });
  
  test('debug option sets environment variable and logger level', async () => {
    // Call action with debug option
    await action({ debug: true });
    
    // Verify DEBUG environment variable is set
    expect(process.env.DEBUG).toBe('true');
    
    // Verify logger level is set to debug
    const { logger } = require('../../src/utils');
    expect(logger.setLevel).toHaveBeenCalledWith('debug');
  });
  
  test('validate option calls wizardCore.validateConfiguration', async () => {
    // Call action with validate option
    await action({ validate: true, configPath: '.roo/mcp.json', roomodesPath: '.roomodes' });
    
    // Verify wizardCore.initialize was called
    expect(wizardCore.initialize).toHaveBeenCalledWith({
      projectPath: expect.any(String),
      mcpConfigPath: '.roo/mcp.json',
      roomodesPath: '.roomodes'
    });
    
    // Verify wizardCore.validateConfiguration was called
    expect(wizardCore.validateConfiguration).toHaveBeenCalled();
  });
  
  test('non-interactive add with all parameters', async () => {
    // Call action with add option and all parameters
    await action({
      add: 'test-server',
      interactive: false,
      apiKey: '${env:TEST_API_KEY}',
      region: 'us-west-2',
      permissions: 'read,write,delete',
      model: 'gpt-4',
      timeout: '30',
      configPath: '.roo/mcp.json',
      roomodesPath: '.roomodes'
    });
    
    // Verify mcpWizard.addServer was called with correct parameters
    expect(mcpWizard.addServer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-server',
        name: 'test-server'
      }),
      expect.objectContaining({
        apiKey: '${env:TEST_API_KEY}',
        region: 'us-west-2',
        permissions: ['read', 'write', 'delete'],
        model: 'gpt-4',
        timeout: '30'
      }),
      expect.objectContaining({
        projectPath: expect.any(String),
        mcpConfigPath: '.roo/mcp.json',
        roomodesPath: '.roomodes'
      })
    );
  });
  
  test('non-interactive update with all parameters', async () => {
    // Call action with update option and all parameters
    await action({
      update: 'test-server',
      interactive: false,
      apiKey: '${env:TEST_API_KEY}',
      region: 'eu-central-1',
      permissions: 'read,write,admin',
      model: 'gpt-4-turbo',
      timeout: '60',
      configPath: '.roo/mcp.json',
      roomodesPath: '.roomodes'
    });
    
    // Verify mcpWizard.updateServer was called with correct parameters
    expect(mcpWizard.updateServer).toHaveBeenCalledWith(
      'test-server',
      expect.objectContaining({
        apiKey: '${env:TEST_API_KEY}',
        region: 'eu-central-1',
        permissions: ['read', 'write', 'admin'],
        model: 'gpt-4-turbo',
        timeout: '60'
      }),
      expect.objectContaining({
        projectPath: expect.any(String),
        mcpConfigPath: '.roo/mcp.json',
        roomodesPath: '.roomodes'
      })
    );
  });
  
  test('non-interactive remove with backup and restore', async () => {
    // Call action with remove option
    await action({
      remove: 'test-server',
      interactive: false,
      configPath: '.roo/mcp.json',
      roomodesPath: '.roomodes'
    });
    
    // Verify wizardCore.backupConfiguration was called
    expect(wizardCore.backupConfiguration).toHaveBeenCalled();
    
    // Verify mcpWizard.removeServer was called
    expect(mcpWizard.removeServer).toHaveBeenCalledWith(
      'test-server',
      expect.objectContaining({
        projectPath: expect.any(String),
        mcpConfigPath: '.roo/mcp.json',
        roomodesPath: '.roomodes'
      })
    );
    
    // Simulate failure to test restore
    mcpWizard.removeServer.mockRejectedValueOnce(new Error('Simulated failure'));
    
    // Call action with remove option again
    await action({
      remove: 'test-server',
      interactive: false,
      configPath: '.roo/mcp.json',
      roomodesPath: '.roomodes'
    });
    
    // Verify wizardCore.restoreConfiguration was called
    expect(wizardCore.restoreConfiguration).toHaveBeenCalledWith(
      expect.objectContaining({
        mcpConfig: expect.any(String),
        roomodes: expect.any(String)
      })
    );
  });
  
  test('custom registry URL is used', async () => {
    // Mock inquirer responses
    inquirer.prompt.mockResolvedValueOnce({ operation: 'add' })
              .mockResolvedValueOnce({ serverId: 'custom-server' })
              .mockResolvedValueOnce({
                apiKey: 'test-api-key',
                region: 'us-west-2',
                permissions: ['read', 'write']
              })
              .mockResolvedValueOnce({ continue: false });
    
    // Call action with registry option
    await action({
      registry: 'https://custom-registry.example.com',
      interactive: true,
      configPath: '.roo/mcp.json',
      roomodesPath: '.roomodes'
    });
    
    // Verify the registry URL was logged
    const { logger } = require('../../src/utils');
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('custom-registry.example.com'));
  });
});