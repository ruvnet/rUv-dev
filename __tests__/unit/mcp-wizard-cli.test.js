/**
 * Tests for MCP Wizard CLI command
 */

const { wizardCommand } = require('../../src/cli/commands/wizard');
const { mcpWizard } = require('../../src/core/mcp-wizard');
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

jest.mock('inquirer');
jest.mock('../../src/utils', () => ({
  logger: {
    info: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    setLevel: jest.fn()
  }
}));

describe('MCP Wizard CLI Command', () => {
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
  });
  
  test('registers wizard command with correct options', () => {
    expect(program.command).toHaveBeenCalledWith('wizard');
    expect(program.description).toHaveBeenCalled();
    expect(program.option).toHaveBeenCalledTimes(15);
    expect(program.action).toHaveBeenCalled();
  });
  
  test('list servers option calls mcpWizard.listServers', async () => {
    // Mock successful response
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
    
    // Call action with list option
    await action({ list: true, configPath: '.roo/mcp.json' });
    
    // Verify mcpWizard.listServers was called
    expect(mcpWizard.listServers).toHaveBeenCalledWith({
      projectPath: expect.any(String),
      mcpConfigPath: '.roo/mcp.json'
    });
  });
  
  test('remove server option calls mcpWizard.removeServer with confirmation', async () => {
    // Mock inquirer confirmation
    inquirer.prompt.mockResolvedValue({ confirm: true });
    
    // Mock successful response
    mcpWizard.removeServer.mockResolvedValue({
      success: true
    });
    
    // Call action with remove option
    await action({ 
      remove: 'test-server', 
      interactive: true,
      configPath: '.roo/mcp.json',
      roomodesPath: '.roomodes'
    });
    
    // Verify inquirer.prompt was called for confirmation
    expect(inquirer.prompt).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        type: 'confirm',
        name: 'confirm'
      })
    ]));
    
    // Verify mcpWizard.removeServer was called
    expect(mcpWizard.removeServer).toHaveBeenCalledWith('test-server', {
      projectPath: expect.any(String),
      mcpConfigPath: '.roo/mcp.json',
      roomodesPath: '.roomodes'
    });
  });
  
  test('add server option calls mcpWizard.addServer with parameters', async () => {
    // Mock inquirer responses for server parameters
    inquirer.prompt.mockResolvedValue({
      apiKey: 'test-api-key',
      region: 'us-west-2',
      permissions: ['read', 'write']
    });
    
    // Mock successful response
    mcpWizard.addServer.mockResolvedValue({
      success: true
    });
    
    // Call action with add option
    await action({ 
      add: 'test-server', 
      interactive: true,
      configPath: '.roo/mcp.json',
      roomodesPath: '.roomodes'
    });
    
    // Verify inquirer.prompt was called for parameters
    expect(inquirer.prompt).toHaveBeenCalled();
    
    // Verify mcpWizard.addServer was called with correct parameters
    expect(mcpWizard.addServer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-server',
        name: 'test-server'
      }),
      expect.objectContaining({
        apiKey: expect.stringContaining('env:'),
        region: expect.any(String),
        permissions: expect.any(Array)
      }),
      expect.objectContaining({
        projectPath: expect.any(String),
        mcpConfigPath: '.roo/mcp.json',
        roomodesPath: '.roomodes'
      })
    );
  });
  
  test('update server option calls mcpWizard.updateServer with parameters', async () => {
    // Mock inquirer responses for server parameters
    inquirer.prompt.mockResolvedValue({
      apiKey: 'test-api-key',
      region: 'us-west-2',
      permissions: ['read', 'write']
    });
    
    // Mock successful response
    mcpWizard.updateServer.mockResolvedValue({
      success: true
    });
    
    // Call action with update option
    await action({ 
      update: 'test-server', 
      interactive: true,
      configPath: '.roo/mcp.json',
      roomodesPath: '.roomodes'
    });
    
    // Verify inquirer.prompt was called for parameters
    expect(inquirer.prompt).toHaveBeenCalled();
    
    // Verify mcpWizard.updateServer was called with correct parameters
    expect(mcpWizard.updateServer).toHaveBeenCalledWith(
      'test-server',
      expect.objectContaining({
        apiKey: expect.stringContaining('env:'),
        region: expect.any(String),
        permissions: expect.any(Array)
      }),
      expect.objectContaining({
        projectPath: expect.any(String),
        mcpConfigPath: '.roo/mcp.json',
        roomodesPath: '.roomodes'
      })
    );
  });
  
  test('interactive wizard prompts for operation and executes selected action', async () => {
    // Mock list servers response
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
    
    // Mock inquirer responses for operation selection and server ID
    inquirer.prompt.mockResolvedValueOnce({ operation: 'add' })
                   .mockResolvedValueOnce({ serverId: 'new-server' })
                   .mockResolvedValueOnce({
                     apiKey: 'test-api-key',
                     region: 'us-west-2',
                     permissions: ['read', 'write']
                   });
    
    // Mock successful response
    mcpWizard.addServer.mockResolvedValue({
      success: true
    });
    
    // Call action without specific options to trigger interactive wizard
    await action({ 
      interactive: true,
      configPath: '.roo/mcp.json',
      roomodesPath: '.roomodes'
    });
    
    // Verify inquirer.prompt was called for operation selection
    expect(inquirer.prompt).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        type: 'list',
        name: 'operation'
      })
    ]));
    
    // Verify inquirer.prompt was called for server ID
    expect(inquirer.prompt).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        type: 'input',
        name: 'serverId'
      })
    ]));
    
    // Verify mcpWizard.addServer was called with correct parameters
    expect(mcpWizard.addServer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'new-server',
        name: 'new-server'
      }),
      expect.any(Object),
      expect.objectContaining({
        projectPath: expect.any(String),
        mcpConfigPath: '.roo/mcp.json',
        roomodesPath: '.roomodes'
      })
    );
  });
});