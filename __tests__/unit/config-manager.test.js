/**
 * Unit tests for the Config Manager module
 */

const fs = require('fs-extra');
const { configManager } = require('../../src/core/config-manager');
const { configSchema } = require('../../src/core/config-manager/schema');

// Mock fs-extra and other dependencies
jest.mock('fs-extra');
jest.mock('path');
jest.mock('os');
jest.mock('../../src/utils', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  },
  pathUtils: {
    isAbsolute: jest.fn(p => p.startsWith('/')),
    resolve: jest.fn((...args) => args.join('/'))
  }
}));

describe('Config Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadConfig', () => {
    test('should load configuration from a file', async () => {
      const mockConfig = { projectName: 'test-project' };
      fs.readJson.mockResolvedValue(mockConfig);

      const result = await configManager.loadConfig('/path/to/config.json');
      
      expect(fs.readJson).toHaveBeenCalledWith('/path/to/config.json');
      expect(result).toEqual(mockConfig);
    });

    test('should throw an error if loading fails', async () => {
      fs.readJson.mockRejectedValue(new Error('File not found'));

      await expect(configManager.loadConfig('/path/to/config.json'))
        .rejects.toThrow('Failed to load configuration: File not found');
    });
  });

  describe('validateConfig', () => {
    test('should validate a valid configuration', () => {
      const config = {
        projectName: 'test-project',
        projectPath: '/path/to/project',
        template: 'default',
        installDependencies: true
      };

      const result = configManager.validateConfig(config);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect missing required fields', () => {
      const config = {
        // Missing required fields
        template: 'default'
      };

      const result = configManager.validateConfig(config);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('Required field is missing');
    });

    test('should validate property types', () => {
      const config = {
        projectName: 'test-project',
        projectPath: '/path/to/project',
        template: 'default',
        installDependencies: 'not-a-boolean' // Should be boolean
      };

      const result = configManager.validateConfig(config);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('Expected type boolean');
    });

    test('should validate enum values', () => {
      const config = {
        projectName: 'test-project',
        projectPath: '/path/to/project',
        template: 'invalid-template', // Not in enum
        installDependencies: true
      };

      // Mock the schema to include an enum for template
      const originalEnum = configSchema.properties.template.enum;
      configSchema.properties.template.enum = ['default', 'typescript'];
      
      const result = configManager.validateConfig(config);
      
      // Restore the original schema
      configSchema.properties.template.enum = originalEnum;
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('Value must be one of');
    });

    test('should validate pattern values', () => {
      const config = {
        projectName: 'invalid@name', // Invalid pattern
        projectPath: '/path/to/project',
        template: 'default',
        installDependencies: true
      };

      // Mock the schema to include a pattern for projectName
      const originalPattern = configSchema.properties.projectName.pattern;
      configSchema.properties.projectName.pattern = '^[a-z0-9-]+$';
      
      const result = configManager.validateConfig(config);
      
      // Restore the original schema
      configSchema.properties.projectName.pattern = originalPattern;
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('Value does not match pattern');
    });
  });

  describe('mergeConfig', () => {
    test('should merge two configuration objects', () => {
      const base = {
        projectName: 'base-project',
        features: {
          typescript: false,
          testing: true
        }
      };
      
      const override = {
        projectName: 'override-project',
        features: {
          typescript: true
        }
      };

      const result = configManager.mergeConfig(base, override);
      
      expect(result.projectName).toBe('override-project');
      expect(result.features.typescript).toBe(true);
      expect(result.features.testing).toBe(true);
    });

    test('should handle arrays and non-object values', () => {
      const base = {
        projectName: 'base-project',
        array: [1, 2, 3],
        nested: {
          value: 'base'
        }
      };
      
      const override = {
        array: [4, 5, 6],
        nested: 'not-an-object'
      };

      const result = configManager.mergeConfig(base, override);
      
      expect(result.projectName).toBe('base-project');
      expect(result.array).toEqual([4, 5, 6]);
      expect(result.nested).toBe('not-an-object');
    });
  });

  describe('writeConfig', () => {
    test('should write configuration to a file', async () => {
      const config = { projectName: 'test-project' };
      fs.writeJson.mockResolvedValue();

      await configManager.writeConfig(config, '/path/to/config.json');
      
      expect(fs.writeJson).toHaveBeenCalledWith('/path/to/config.json', config, { spaces: 2 });
    });

    test('should throw an error if writing fails', async () => {
      const config = { projectName: 'test-project' };
      fs.writeJson.mockRejectedValue(new Error('Permission denied'));

      await expect(configManager.writeConfig(config, '/path/to/config.json'))
        .rejects.toThrow('Failed to write configuration: Permission denied');
    });
  });

  describe('getDefaultConfig', () => {
    test('should return the default configuration', () => {
      const defaultConfig = configManager.getDefaultConfig();
      
      expect(defaultConfig).toHaveProperty('projectName');
      expect(defaultConfig).toHaveProperty('projectPath');
      expect(defaultConfig).toHaveProperty('template');
      expect(defaultConfig).toHaveProperty('installDependencies');
      expect(defaultConfig).toHaveProperty('symlink');
      expect(defaultConfig).toHaveProperty('features');
      expect(defaultConfig).toHaveProperty('npmClient');
      expect(defaultConfig).toHaveProperty('git');
    });
  });

  describe('findProjectConfig', () => {
    test('should find project configuration in package.json', async () => {
      const mockCwd = '/path/to/project';
      const mockHomeDir = '/home/user';
      const mockPackageJsonPath = '/path/to/project/package.json';
      const mockSparcConfig = { projectName: 'test-project' };
      
      // Mock process.cwd
      const originalCwd = process.cwd;
      process.cwd = jest.fn().mockReturnValue(mockCwd);
      
      // Mock path.join, path.dirname, and path.parse
      const path = require('path');
      path.join.mockImplementation((dir, file) => `${dir}/${file}`);
      path.dirname.mockReturnValue(mockCwd);
      path.parse.mockReturnValue({ root: '/' });
      
      // Mock os.homedir
      const os = require('os');
      os.homedir.mockReturnValue(mockHomeDir);
      
      // Mock fs.pathExists and fs.readJson
      fs.pathExists.mockImplementation(async (p) => p === mockPackageJsonPath);
      fs.readJson.mockResolvedValue({ sparc: mockSparcConfig });

      try {
        const result = await configManager.findProjectConfig();
        
        expect(fs.pathExists).toHaveBeenCalledWith(mockPackageJsonPath);
        expect(fs.readJson).toHaveBeenCalledWith(mockPackageJsonPath);
        expect(result).toEqual(mockSparcConfig);
      } finally {
        // Restore original functions
        process.cwd = originalCwd;
      }
    });

    test('should detect SPARC project by .roo directory and .roomodes file', async () => {
      const mockCwd = '/path/to/project';
      const mockHomeDir = '/home/user';
      const mockPackageJsonPath = '/path/to/project/package.json';
      const mockRooDir = '/path/to/project/.roo';
      const mockRoomodesFile = '/path/to/project/.roomodes';
      
      // Mock process.cwd
      const originalCwd = process.cwd;
      process.cwd = jest.fn().mockReturnValue(mockCwd);
      
      // Mock path.join, path.dirname, and path.parse
      const path = require('path');
      path.join.mockImplementation((dir, file) => `${dir}/${file}`);
      path.dirname.mockReturnValue(mockCwd);
      path.parse.mockReturnValue({ root: '/' });
      
      // Mock os.homedir
      const os = require('os');
      os.homedir.mockReturnValue(mockHomeDir);
      
      // Mock fs.pathExists and fs.readJson
      fs.pathExists.mockImplementation(async (p) => {
        if (p === mockPackageJsonPath) return true;
        if (p === mockRooDir) return true;
        if (p === mockRoomodesFile) return true;
        return false;
      });
      fs.readJson.mockResolvedValue({ name: 'test-project' }); // No sparc property

      try {
        const result = await configManager.findProjectConfig();
        
        expect(fs.pathExists).toHaveBeenCalledWith(mockPackageJsonPath);
        expect(fs.pathExists).toHaveBeenCalledWith(mockRooDir);
        expect(fs.pathExists).toHaveBeenCalledWith(mockRoomodesFile);
        expect(result).toHaveProperty('projectName', 'test-project');
        expect(result).toHaveProperty('projectPath', mockCwd);
        expect(result).toHaveProperty('symlink.enabled', false);
      } finally {
        // Restore original functions
        process.cwd = originalCwd;
      }
    });

    test('should return null if no project configuration is found', async () => {
      const mockCwd = '/path/to/project';
      const mockHomeDir = '/home/user';
      
      // Mock process.cwd
      const originalCwd = process.cwd;
      process.cwd = jest.fn().mockReturnValue(mockCwd);
      
      // Mock path.join, path.dirname, and path.parse
      const path = require('path');
      path.join.mockImplementation((dir, file) => `${dir}/${file}`);
      path.dirname.mockReturnValue(mockCwd);
      path.parse.mockReturnValue({ root: '/' });
      
      // Mock os.homedir
      const os = require('os');
      os.homedir.mockReturnValue(mockHomeDir);
      
      // Mock fs.pathExists to always return false
      fs.pathExists.mockResolvedValue(false);

      try {
        const result = await configManager.findProjectConfig();
        
        expect(result).toBeNull();
      } finally {
        // Restore original functions
        process.cwd = originalCwd;
      }
    });

    test('should handle errors reading package.json', async () => {
      const mockCwd = '/path/to/project';
      const mockHomeDir = '/home/user';
      const mockPackageJsonPath = '/path/to/project/package.json';
      
      // Mock process.cwd
      const originalCwd = process.cwd;
      process.cwd = jest.fn().mockReturnValue(mockCwd);
      
      // Mock path.join, path.dirname, and path.parse
      const path = require('path');
      path.join.mockImplementation((dir, file) => `${dir}/${file}`);
      path.dirname.mockReturnValue(mockCwd);
      path.parse.mockReturnValue({ root: '/' });
      
      // Mock os.homedir
      const os = require('os');
      os.homedir.mockReturnValue(mockHomeDir);
      
      // Mock fs.pathExists and fs.readJson
      fs.pathExists.mockResolvedValue(true);
      fs.readJson.mockRejectedValue(new Error('Invalid JSON'));

      try {
        const result = await configManager.findProjectConfig();
        
        expect(fs.pathExists).toHaveBeenCalledWith(mockPackageJsonPath);
        expect(fs.readJson).toHaveBeenCalledWith(mockPackageJsonPath);
        expect(result).toBeNull();
      } finally {
        // Restore original functions
        process.cwd = originalCwd;
      }
    });
  });

  describe('_validateType', () => {
    test('should validate string type', () => {
      expect(configManager._validateType('test', 'string')).toBe(true);
      expect(configManager._validateType(123, 'string')).toBe(false);
    });

    test('should validate number type', () => {
      expect(configManager._validateType(123, 'number')).toBe(true);
      expect(configManager._validateType('123', 'number')).toBe(false);
    });

    test('should validate boolean type', () => {
      expect(configManager._validateType(true, 'boolean')).toBe(true);
      expect(configManager._validateType('true', 'boolean')).toBe(false);
    });

    test('should validate object type', () => {
      expect(configManager._validateType({}, 'object')).toBe(true);
      expect(configManager._validateType([], 'object')).toBe(false);
      expect(configManager._validateType(null, 'object')).toBe(false);
      expect(configManager._validateType('object', 'object')).toBe(false);
    });

    test('should validate array type', () => {
      expect(configManager._validateType([], 'array')).toBe(true);
      expect(configManager._validateType({}, 'array')).toBe(false);
      expect(configManager._validateType('array', 'array')).toBe(false);
    });

    test('should return true for unknown types', () => {
      expect(configManager._validateType('test', 'unknown')).toBe(true);
    });
  });
});