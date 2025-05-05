/**
 * Unit tests for AIGI CLI command
 */

const { aigiCommand } = require('../../src/cli/commands/aigi');
const { projectGenerator } = require('../../src/core/project-generator');

describe('AIGI Command', () => {
  // Mock Commander program
  let program;
  let aigiCommandMock;
  let initCommandMock;
  let actionCallback;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Create a mock for the init subcommand
    initCommandMock = {
      description: jest.fn().mockReturnThis(),
      option: jest.fn().mockReturnThis(),
      action: jest.fn().mockImplementation((callback) => {
        actionCallback = callback;
        return initCommandMock;
      })
    };
    
    // Create a mock for the aigi command
    aigiCommandMock = {
      description: jest.fn().mockReturnThis(),
      command: jest.fn().mockReturnValue(initCommandMock)
    };
    
    program = {
      command: jest.fn().mockReturnValue(aigiCommandMock)
    };
  });

  test('should register aigi command with program and init subcommand', () => {
    aigiCommand(program);
    
    // Check if aigi command is registered
    expect(program.command).toHaveBeenCalledWith('aigi');
    expect(aigiCommandMock.description).toHaveBeenCalledWith('AIGI project commands');
    
    // Check if init subcommand is registered
    expect(aigiCommandMock.command).toHaveBeenCalledWith('init [name]');
    expect(initCommandMock.description).toHaveBeenCalledWith('Create a new AIGI project');
    expect(initCommandMock.option).toHaveBeenCalledWith('-t, --template <name>', 'Template to use', 'default');
    expect(initCommandMock.action).toHaveBeenCalled();
  });

  test('should call projectGenerator.generateProject with correct config', async () => {
    // Mock projectGenerator.generateProject
    const generateProjectSpy = jest.spyOn(projectGenerator, 'generateProject').mockResolvedValue();
    
    // Register the command
    aigiCommand(program);
    
    // Call the action callback with arguments and options
    const projectName = 'test-aigi-project';
    const options = {
      template: 'default',
      skipInstall: false,
      useNpm: true,
      useYarn: false,
      usePnpm: false,
      git: true,
      typescript: false,
      symlink: true,
      verbose: false
    };
    
    await actionCallback(projectName, options);
    
    // Check if generateProject was called with the correct config
    expect(generateProjectSpy).toHaveBeenCalledWith(expect.objectContaining({
      projectName,
      projectPath: projectName,
      template: 'default',
      installDependencies: true,
      sourceDir: 'aiGI', // Check for the new sourceDir parameter
      symlink: {
        enabled: true,
        paths: ['.roo', '.roomodes']
      },
      features: {
        typescript: false,
        testing: true,
        cicd: false
      },
      npmClient: 'npm',
      git: {
        init: true,
        initialCommit: true
      }
    }));
    
    // Restore the mock
    generateProjectSpy.mockRestore();
  });

  test('should use "aigi-project" as default project name', async () => {
    // Mock projectGenerator.generateProject
    const generateProjectSpy = jest.spyOn(projectGenerator, 'generateProject').mockResolvedValue();
    
    // Register the command
    aigiCommand(program);
    
    // Call the action callback without a project name
    await actionCallback(undefined, {
      template: 'default',
      skipInstall: false,
      git: true
    });
    // Check if generateProject was called with the correct config
    expect(generateProjectSpy).toHaveBeenCalledWith(expect.objectContaining({
      projectName: 'aigi-project',
      projectPath: '.',
      sourceDir: 'aiGI' // Check for the new sourceDir parameter
    }));
    
    // Restore the mock
    generateProjectSpy.mockRestore();
  });

  test('should display "AIGI files created successfully" message when skipProjectStructure is true', async () => {
    // Mock projectGenerator.generateProject
    const generateProjectSpy = jest.spyOn(projectGenerator, 'generateProject').mockResolvedValue();
    
    // Mock logger
    const { logger } = require('../../src/utils');
    const loggerSuccessSpy = jest.spyOn(logger, 'success').mockImplementation();
    
    // Register the command
    aigiCommand(program);
    
    // Call the action callback without a project name
    await actionCallback(undefined, {
      template: 'default',
      skipInstall: false,
      git: true
    });
    
    // Check if success message contains "AIGI files"
    expect(loggerSuccessSpy).toHaveBeenCalledWith(
      expect.stringContaining('AIGI files')
    );
    
    // Restore the mocks
    generateProjectSpy.mockRestore();
    loggerSuccessSpy.mockRestore();
  });

  test('should handle errors during project generation', async () => {
    // Mock console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Mock process.exit
    const processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
    
    // Mock projectGenerator.generateProject to throw an error
    const generateProjectSpy = jest.spyOn(projectGenerator, 'generateProject')
      .mockRejectedValue(new Error('Test error'));
    
    // Register the command
    aigiCommand(program);
    
    // Call the action callback
    await actionCallback('test-aigi-project', {
      template: 'default',
      skipInstall: false,
      git: true
    });
    
    // Check if error was logged and process.exit was called
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(processExitSpy).toHaveBeenCalledWith(1);
    
    // Restore the mocks
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    generateProjectSpy.mockRestore();
  });
});