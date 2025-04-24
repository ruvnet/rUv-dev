/**
 * Unit tests for CLI commands
 */

const { initCommand } = require('../../src/cli/commands/init');
const { addCommand } = require('../../src/cli/commands/add');
const { helpCommand } = require('../../src/cli/commands/help');
const { projectGenerator } = require('../../src/core/project-generator');

describe('CLI Commands', () => {
  // Mock Commander program
  let program;
  let commandMock;
  let actionCallback;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Create a mock for the Commander program
    commandMock = {
      description: jest.fn().mockReturnThis(),
      option: jest.fn().mockReturnThis(),
      action: jest.fn().mockImplementation((callback) => {
        actionCallback = callback;
        return commandMock;
      })
    };
    
    program = {
      command: jest.fn().mockReturnValue(commandMock)
    };
  });

  describe('initCommand', () => {
    test('should register init command with program', () => {
      initCommand(program);
      
      expect(program.command).toHaveBeenCalledWith('init [name]');
      expect(commandMock.description).toHaveBeenCalledWith('Create a new SPARC project');
      expect(commandMock.option).toHaveBeenCalledWith('-t, --template <name>', 'Template to use', 'default');
      expect(commandMock.action).toHaveBeenCalled();
    });

    test('should call projectGenerator.generateProject with correct config', async () => {
      // Mock projectGenerator.generateProject
      const generateProjectSpy = jest.spyOn(projectGenerator, 'generateProject').mockResolvedValue();
      
      // Register the command
      initCommand(program);
      
      // Call the action callback with arguments and options
      const projectName = 'test-project';
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

    test('should handle errors during project generation', async () => {
      // Mock console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock process.exit
      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
      
      // Mock projectGenerator.generateProject to throw an error
      const generateProjectSpy = jest.spyOn(projectGenerator, 'generateProject')
        .mockRejectedValue(new Error('Test error'));
      
      // Register the command
      initCommand(program);
      
      // Call the action callback
      await actionCallback('test-project', {
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

    test('should use current directory when no project name is provided', async () => {
      // Mock projectGenerator.generateProject
      const generateProjectSpy = jest.spyOn(projectGenerator, 'generateProject').mockResolvedValue();
      
      // Register the command
      initCommand(program);
      
      // Call the action callback without a project name
      await actionCallback(undefined, {
        template: 'default',
        skipInstall: false,
        git: true
      });
      
      // Check if generateProject was called with the correct config
      expect(generateProjectSpy).toHaveBeenCalledWith(expect.objectContaining({
        projectPath: '.'
      }));
      
      // Restore the mock
      generateProjectSpy.mockRestore();
    });

    test('should determine correct npm client based on options', async () => {
      // Mock projectGenerator.generateProject
      const generateProjectSpy = jest.spyOn(projectGenerator, 'generateProject').mockResolvedValue();
      
      // Register the command
      initCommand(program);
      
      // Test npm (default)
      await actionCallback('test-project', {
        template: 'default',
        useNpm: true,
        useYarn: false,
        usePnpm: false
      });
      
      expect(generateProjectSpy).toHaveBeenCalledWith(expect.objectContaining({
        npmClient: 'npm'
      }));
      
      // Test yarn
      await actionCallback('test-project', {
        template: 'default',
        useNpm: false,
        useYarn: true,
        usePnpm: false
      });
      
      expect(generateProjectSpy).toHaveBeenCalledWith(expect.objectContaining({
        npmClient: 'yarn'
      }));
      
      // Test pnpm
      await actionCallback('test-project', {
        template: 'default',
        useNpm: false,
        useYarn: false,
        usePnpm: true
      });
      
      expect(generateProjectSpy).toHaveBeenCalledWith(expect.objectContaining({
        npmClient: 'pnpm'
      }));
      
      // Restore the mock
      generateProjectSpy.mockRestore();
    });
  });

  describe('addCommand', () => {
    test('should register add command with program', () => {
      addCommand(program);
      
      expect(program.command).toHaveBeenCalledWith('add [component]');
      expect(commandMock.description).toHaveBeenCalledWith('Add a component to an existing SPARC project');
      expect(commandMock.option).toHaveBeenCalledTimes(3);
      expect(commandMock.action).toHaveBeenCalled();
    });
    
    test('should handle missing component argument', async () => {
      // Mock console.log
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Mock process.exit
      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
      
      // Mock logger
      const { logger } = require('../../src/utils');
      const loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation();
      
      // Register the command
      addCommand(program);
      
      // Call the action callback with no component
      await actionCallback(null, {});
      
      // Verify error handling
      expect(loggerErrorSpy).toHaveBeenCalledWith('Component type is required');
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(1);
      
      // Restore mocks
      consoleLogSpy.mockRestore();
      processExitSpy.mockRestore();
      loggerErrorSpy.mockRestore();
    });
    
    test('should handle missing project configuration', async () => {
      // Mock process.exit
      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
      
      // Mock configManager
      const { configManager } = require('../../src/core/config-manager');
      const findProjectConfigSpy = jest.spyOn(configManager, 'findProjectConfig').mockResolvedValue(null);
      
      // Mock logger
      const { logger } = require('../../src/utils');
      const loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation();
      const loggerInfoSpy = jest.spyOn(logger, 'info').mockImplementation();
      
      // Register the command
      addCommand(program);
      
      // Call the action callback with a component
      await actionCallback('test-component', {});
      
      // Verify error handling
      expect(findProjectConfigSpy).toHaveBeenCalled();
      expect(loggerErrorSpy).toHaveBeenCalledWith('Not in a SPARC project directory');
      expect(loggerInfoSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(1);
      
      // Restore mocks
      processExitSpy.mockRestore();
      findProjectConfigSpy.mockRestore();
      loggerErrorSpy.mockRestore();
      loggerInfoSpy.mockRestore();
    });
    
    test('should add component to project when configuration is valid', async () => {
      // Mock configManager
      const { configManager } = require('../../src/core/config-manager');
      const mockProjectConfig = { name: 'test-project' };
      const findProjectConfigSpy = jest.spyOn(configManager, 'findProjectConfig').mockResolvedValue(mockProjectConfig);
      
      // Mock projectGenerator
      const { projectGenerator } = require('../../src/core/project-generator');
      const addComponentSpy = jest.spyOn(projectGenerator, 'addComponent').mockResolvedValue();
      
      // Mock logger
      const { logger } = require('../../src/utils');
      const loggerInfoSpy = jest.spyOn(logger, 'info').mockImplementation();
      const loggerSuccessSpy = jest.spyOn(logger, 'success').mockImplementation();
      
      // Register the command
      addCommand(program);
      
      // Call the action callback with a component and options
      const options = { name: 'custom-name', type: 'service', path: 'custom/path' };
      await actionCallback('test-component', options);
      
      // Verify component was added
      expect(findProjectConfigSpy).toHaveBeenCalled();
      expect(loggerInfoSpy).toHaveBeenCalled();
      expect(addComponentSpy).toHaveBeenCalledWith({
        name: 'custom-name',
        type: 'service',
        path: 'custom/path',
        projectConfig: mockProjectConfig
      });
      expect(loggerSuccessSpy).toHaveBeenCalled();
      
      // Restore mocks
      findProjectConfigSpy.mockRestore();
      addComponentSpy.mockRestore();
      loggerInfoSpy.mockRestore();
      loggerSuccessSpy.mockRestore();
    });
    
    test('should handle errors during component addition', async () => {
      // Mock process.exit and console.error
      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock configManager
      const { configManager } = require('../../src/core/config-manager');
      const mockProjectConfig = { name: 'test-project' };
      const findProjectConfigSpy = jest.spyOn(configManager, 'findProjectConfig').mockResolvedValue(mockProjectConfig);
      
      // Mock projectGenerator to throw an error
      const { projectGenerator } = require('../../src/core/project-generator');
      const testError = new Error('Test error');
      const addComponentSpy = jest.spyOn(projectGenerator, 'addComponent').mockRejectedValue(testError);
      
      // Mock logger
      const { logger } = require('../../src/utils');
      const loggerInfoSpy = jest.spyOn(logger, 'info').mockImplementation();
      const loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation();
      
      // Register the command
      addCommand(program);
      
      // Set DEBUG environment variable to test error logging
      const originalDebug = process.env.DEBUG;
      process.env.DEBUG = 'true';
      
      try {
        // Call the action callback
        await actionCallback('test-component', {});
        
        // Verify error handling
        expect(loggerErrorSpy).toHaveBeenCalledWith('Failed to add component: Test error');
        expect(consoleErrorSpy).toHaveBeenCalledWith(testError);
        expect(processExitSpy).toHaveBeenCalledWith(1);
      } finally {
        // Restore DEBUG environment variable
        process.env.DEBUG = originalDebug;
        
        // Restore mocks
        processExitSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        findProjectConfigSpy.mockRestore();
        addComponentSpy.mockRestore();
        loggerInfoSpy.mockRestore();
        loggerErrorSpy.mockRestore();
      }
    });
  });

  describe('helpCommand', () => {
    test('should register help command with program', () => {
      helpCommand(program);
      
      expect(program.command).toHaveBeenCalledWith('help [command]');
      expect(commandMock.description).toHaveBeenCalledWith('Display help for a specific command');
      expect(commandMock.action).toHaveBeenCalled();
    });
    
    test('should display help for a specific command when it exists', () => {
      // Mock program with commands
      const mockCommand = {
        name: jest.fn().mockReturnValue('init'),
        aliases: jest.fn().mockReturnValue([]),
        help: jest.fn()
      };
      
      const programWithCommands = {
        command: jest.fn().mockReturnValue(commandMock),
        commands: [mockCommand],
        help: jest.fn()
      };
      
      // Register the command
      helpCommand(programWithCommands);
      
      // Call the action callback with a command name
      actionCallback('init');
      
      // Verify the specific command's help was called
      expect(mockCommand.name).toHaveBeenCalled();
      expect(mockCommand.help).toHaveBeenCalled();
      expect(programWithCommands.help).not.toHaveBeenCalled();
    });
    
    test('should display general help when command does not exist', () => {
      // Mock console.log
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Mock program with commands
      const mockCommand = {
        name: jest.fn().mockReturnValue('init'),
        aliases: jest.fn().mockReturnValue([]),
        help: jest.fn()
      };
      
      const programWithCommands = {
        command: jest.fn().mockReturnValue(commandMock),
        commands: [mockCommand],
        help: jest.fn()
      };
      
      // Register the command
      helpCommand(programWithCommands);
      
      // Call the action callback with a non-existent command name
      actionCallback('non-existent');
      
      // Verify error message was logged and general help was displayed
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(programWithCommands.help).toHaveBeenCalled();
      
      // Restore mock
      consoleLogSpy.mockRestore();
    });
    
    test('should display general help when no command is specified', () => {
      // Mock program
      const programWithHelp = {
        command: jest.fn().mockReturnValue(commandMock),
        help: jest.fn()
      };
      
      // Register the command
      helpCommand(programWithHelp);
      
      // Call the action callback with no command name
      actionCallback();
      
      // Verify general help was displayed
      expect(programWithHelp.help).toHaveBeenCalled();
    });
  });
});