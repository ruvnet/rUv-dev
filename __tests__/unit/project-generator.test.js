/**
 * Unit tests for the project generator
 */

const fs = require('fs-extra');
const path = require('path');
const { projectGenerator } = require('../../src/core/project-generator');
const { mockFileSystem, mockExecSync } = require('../utils/test-utils');

describe('Project Generator', () => {
  let mockFs;
  let mockExec;
  let testDir;

  beforeEach(async () => {
    // Create a fresh test directory for each test
    testDir = await createTestDir('project-generator-test');
    
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore any mocked functions
    if (mockFs) {
      mockFs.restore();
      mockFs = null;
    }
    if (mockExec) {
      mockExec.restore();
      mockExec = null;
    }
  });

  describe('generateProject', () => {
    test('should validate configuration before generating project', async () => {
      // Mock the configManager.validateConfig method
      const validateConfigSpy = jest.spyOn(require('../../src/core/config-manager').configManager, 'validateConfig');
      validateConfigSpy.mockReturnValue({ valid: false, errors: [{ property: 'projectName', message: 'is required' }] });
      
      const config = {
        // Invalid config - missing required fields
      };
      
      await expect(projectGenerator.generateProject(config))
        .rejects.toThrow('Invalid configuration');
      
      expect(validateConfigSpy).toHaveBeenCalledWith(config);
      
      // Restore the mock
      validateConfigSpy.mockRestore();
    });

    test('should create project directory and setup SPARC structure', async () => {
      // Mock the internal methods
      const createDirSpy = jest.spyOn(projectGenerator, '_createProjectDirectory').mockResolvedValue();
      const setupStructureSpy = jest.spyOn(projectGenerator, '_setupSparcStructure').mockResolvedValue();
      const generateConfigSpy = jest.spyOn(projectGenerator, '_generateConfigFiles').mockResolvedValue();
      
      // Mock the configManager.validateConfig method
      const validateConfigSpy = jest.spyOn(require('../../src/core/config-manager').configManager, 'validateConfig');
      validateConfigSpy.mockReturnValue({ valid: true });
      
      const config = {
        projectName: 'test-project',
        projectPath: testDir,
        template: 'default',
        installDependencies: false,
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
          init: false
        }
      };
      
      await projectGenerator.generateProject(config);
      
      expect(createDirSpy).toHaveBeenCalledWith(config);
      expect(setupStructureSpy).toHaveBeenCalledWith(config);
      expect(generateConfigSpy).toHaveBeenCalledWith(config);
      
      // Restore the mocks
      createDirSpy.mockRestore();
      setupStructureSpy.mockRestore();
      generateConfigSpy.mockRestore();
      validateConfigSpy.mockRestore();
    });

    test('should install dependencies when installDependencies is true', async () => {
      // Mock the internal methods
      const createDirSpy = jest.spyOn(projectGenerator, '_createProjectDirectory').mockResolvedValue();
      const setupStructureSpy = jest.spyOn(projectGenerator, '_setupSparcStructure').mockResolvedValue();
      const generateConfigSpy = jest.spyOn(projectGenerator, '_generateConfigFiles').mockResolvedValue();
      const installDepsSpy = jest.spyOn(projectGenerator, '_installDependencies').mockResolvedValue();
      
      // Mock the configManager.validateConfig method
      const validateConfigSpy = jest.spyOn(require('../../src/core/config-manager').configManager, 'validateConfig');
      validateConfigSpy.mockReturnValue({ valid: true });
      
      const config = {
        projectName: 'test-project',
        projectPath: testDir,
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
          init: false
        }
      };
      
      await projectGenerator.generateProject(config);
      
      expect(installDepsSpy).toHaveBeenCalledWith(config);
      
      // Restore the mocks
      createDirSpy.mockRestore();
      setupStructureSpy.mockRestore();
      generateConfigSpy.mockRestore();
      installDepsSpy.mockRestore();
      validateConfigSpy.mockRestore();
    });

    test('should initialize git when git.init is true', async () => {
      // Mock the internal methods
      const createDirSpy = jest.spyOn(projectGenerator, '_createProjectDirectory').mockResolvedValue();
      const setupStructureSpy = jest.spyOn(projectGenerator, '_setupSparcStructure').mockResolvedValue();
      const generateConfigSpy = jest.spyOn(projectGenerator, '_generateConfigFiles').mockResolvedValue();
      const initGitSpy = jest.spyOn(projectGenerator, '_initializeGit').mockResolvedValue();
      
      // Mock the configManager.validateConfig method
      const validateConfigSpy = jest.spyOn(require('../../src/core/config-manager').configManager, 'validateConfig');
      validateConfigSpy.mockReturnValue({ valid: true });
      
      const config = {
        projectName: 'test-project',
        projectPath: testDir,
        template: 'default',
        installDependencies: false,
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
      };
      
      await projectGenerator.generateProject(config);
      
      expect(initGitSpy).toHaveBeenCalledWith(config);
      
      // Restore the mocks
      createDirSpy.mockRestore();
      setupStructureSpy.mockRestore();
      generateConfigSpy.mockRestore();
      initGitSpy.mockRestore();
      validateConfigSpy.mockRestore();
    });
  });

  describe('_createProjectDirectory', () => {
    test('should create a new project directory', async () => {
      const projectPath = path.join(testDir, 'new-project');
      const config = {
        projectName: 'new-project',
        projectPath
      };
      
      await projectGenerator._createProjectDirectory(config);
      
      const exists = await fs.pathExists(projectPath);
      expect(exists).toBe(true);
    });

    test('should throw an error if directory already exists and is not empty', async () => {
      const projectPath = path.join(testDir, 'existing-project');
      const filePath = path.join(projectPath, 'some-file.txt');
      
      // Create a directory with a file
      await fs.ensureDir(projectPath);
      await fs.writeFile(filePath, 'Some content');
      
      const config = {
        projectName: 'existing-project',
        projectPath
      };
      
      await expect(projectGenerator._createProjectDirectory(config))
        .rejects.toThrow('already exists and is not empty');
    });

    test('should allow using current directory if it only contains hidden files', async () => {
      // Mock fs.readdir to return only hidden files
      mockFs = mockFileSystem();
      fs.readdir.mockResolvedValueOnce(['.git', '.gitignore', '.npmrc']);
      
      const config = {
        projectPath: '.'
      };
      
      // This should not throw an error
      await projectGenerator._createProjectDirectory(config);
    });
  });

  describe('_setupSparcStructure', () => {
    test('should create src directory and copy SPARC files', async () => {
      // Mock the _copySparcFiles method
      const copySparcFilesSpy = jest.spyOn(projectGenerator, '_copySparcFiles').mockResolvedValue();
      
      const config = {
        projectName: 'test-project',
        projectPath: testDir
      };
      
      await projectGenerator._setupSparcStructure(config);
      
      // Check if src directory was created
      const srcExists = await fs.pathExists(path.join(testDir, 'src'));
      expect(srcExists).toBe(true);
      
      // Check if _copySparcFiles was called
      expect(copySparcFilesSpy).toHaveBeenCalledWith(config);
      
      // Restore the mock
      copySparcFilesSpy.mockRestore();
    });
  });

  describe('_copySparcFiles', () => {
    test('should copy .roo directory and .roomodes file to the project', async () => {
      mockFs = mockFileSystem();
      
      // Mock fs.exists to return true for source paths
      fs.access.mockImplementation(() => Promise.resolve());
      
      // Mock fsUtils.isDirectory to return true for .roo and false for .roomodes
      const isDirectorySpy = jest.spyOn(require('../../src/utils').fsUtils, 'isDirectory');
      isDirectorySpy.mockImplementation((path) => {
        return Promise.resolve(path.endsWith('.roo'));
      });
      
      const config = {
        projectName: 'test-project',
        projectPath: testDir,
        symlink: {
          paths: ['.roo', '.roomodes']
        }
      };
      
      await projectGenerator._copySparcFiles(config);
      
      // Check if fs.copy was called for both paths
      expect(fs.copy).toHaveBeenCalledTimes(2);
      
      // Restore the mock
      isDirectorySpy.mockRestore();
    });

    test('should throw an error if source path does not exist', async () => {
      // Mock fsUtils.exists to return false
      const existsSpy = jest.spyOn(require('../../src/utils').fsUtils, 'exists');
      existsSpy.mockResolvedValue(false);
      
      const config = {
        projectName: 'test-project',
        projectPath: testDir,
        symlink: {
          paths: ['.roo', '.roomodes']
        }
      };
      
      await expect(projectGenerator._copySparcFiles(config))
        .rejects.toThrow('Source path not found');
      
      // Restore the mock
      existsSpy.mockRestore();
    });
  });

  describe('_generateConfigFiles', () => {
    test('should generate package.json and README.md', async () => {
      const config = {
        projectName: 'test-project',
        projectPath: testDir,
        npmClient: 'npm',
        features: {}
      };
      
      await projectGenerator._generateConfigFiles(config);
      
      // Check if package.json was created
      const packageJsonExists = await fs.pathExists(path.join(testDir, 'package.json'));
      expect(packageJsonExists).toBe(true);
      
      // Check if README.md was created
      const readmeExists = await fs.pathExists(path.join(testDir, 'README.md'));
      expect(readmeExists).toBe(true);
      
      // Check if index.js was created
      const indexExists = await fs.pathExists(path.join(testDir, 'src', 'index.js'));
      expect(indexExists).toBe(true);
    });

    test('should generate TypeScript configuration when typescript feature is enabled', async () => {
      const config = {
        projectName: 'test-project',
        projectPath: testDir,
        npmClient: 'npm',
        features: {
          typescript: true
        }
      };
      
      await projectGenerator._generateConfigFiles(config);
      
      // Check if tsconfig.json was created
      const tsconfigExists = await fs.pathExists(path.join(testDir, 'tsconfig.json'));
      expect(tsconfigExists).toBe(true);
      
      // Check if index.ts was created
      const indexExists = await fs.pathExists(path.join(testDir, 'src', 'index.ts'));
      expect(indexExists).toBe(true);
    });
  });

  describe('_installDependencies', () => {
    test('should execute npm install command', async () => {
      mockExec = mockExecSync();
      
      const config = {
        projectName: 'test-project',
        projectPath: testDir,
        npmClient: 'npm',
        verbose: false
      };
      
      await projectGenerator._installDependencies(config);
      
      // Check if execSync was called with the correct command
      expect(require('child_process').execSync).toHaveBeenCalledWith('npm install', {
        cwd: testDir,
        stdio: 'pipe'
      });
    });

    test('should throw an error if installation fails', async () => {
      mockExec = mockExecSync();
      
      // Mock execSync to throw an error
      require('child_process').execSync.mockImplementationOnce(() => {
        throw new Error('Installation failed');
      });
      
      const config = {
        projectName: 'test-project',
        projectPath: testDir,
        npmClient: 'npm',
        verbose: false
      };
      
      await expect(projectGenerator._installDependencies(config))
        .rejects.toThrow('Failed to install dependencies');
    });
  });

  describe('_initializeGit', () => {
    test('should initialize git repository and create .gitignore', async () => {
      mockExec = mockExecSync();
      
      const config = {
        projectName: 'test-project',
        projectPath: testDir,
        git: {
          init: true,
          initialCommit: false
        },
        verbose: false
      };
      
      await projectGenerator._initializeGit(config);
      
      // Check if execSync was called with git init
      expect(require('child_process').execSync).toHaveBeenCalledWith('git init', {
        cwd: testDir,
        stdio: 'pipe'
      });
      
      // Check if .gitignore was created
      const gitignoreExists = await fs.pathExists(path.join(testDir, '.gitignore'));
      expect(gitignoreExists).toBe(true);
    });

    test('should create initial commit when initialCommit is true', async () => {
      mockExec = mockExecSync();
      
      const config = {
        projectName: 'test-project',
        projectPath: testDir,
        git: {
          init: true,
          initialCommit: true
        },
        verbose: false
      };
      
      await projectGenerator._initializeGit(config);
      
      // Check if execSync was called for git add and git commit
      expect(require('child_process').execSync).toHaveBeenCalledWith('git add .', {
        cwd: testDir,
        stdio: 'pipe'
      });
      
      expect(require('child_process').execSync).toHaveBeenCalledWith('git commit -m "Initial commit"', {
        cwd: testDir,
        stdio: 'pipe'
      });
    });

    test('should throw an error if git initialization fails', async () => {
      mockExec = mockExecSync();
      
      // Mock execSync to throw an error
      require('child_process').execSync.mockImplementationOnce(() => {
        throw new Error('Git initialization failed');
      });
      
      const config = {
        projectName: 'test-project',
        projectPath: testDir,
        git: {
          init: true,
          initialCommit: false
        },
        verbose: false
      };
      
      await expect(projectGenerator._initializeGit(config))
        .rejects.toThrow('Failed to initialize git repository');
    });
  });
});