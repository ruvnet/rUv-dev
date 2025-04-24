/**
 * Test utilities for create-sparc tests
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Mock the file system operations
 * @returns {Object} Mock functions
 */
function mockFileSystem() {
  const originalFsExtra = { ...fs };
  
  // Mock fs-extra functions
  jest.spyOn(fs, 'copy').mockImplementation(jest.fn());
  jest.spyOn(fs, 'mkdir').mockImplementation(jest.fn());
  jest.spyOn(fs, 'writeFile').mockImplementation(jest.fn());
  jest.spyOn(fs, 'writeJson').mockImplementation(jest.fn());
  jest.spyOn(fs, 'readFile').mockImplementation(jest.fn());
  jest.spyOn(fs, 'readdir').mockImplementation(jest.fn());
  jest.spyOn(fs, 'access').mockImplementation(jest.fn());
  jest.spyOn(fs, 'stat').mockImplementation(jest.fn());
  jest.spyOn(fs, 'remove').mockImplementation(jest.fn());
  
  return {
    restore: () => {
      fs.copy.mockRestore();
      fs.mkdir.mockRestore();
      fs.writeFile.mockRestore();
      fs.writeJson.mockRestore();
      fs.readFile.mockRestore();
      fs.readdir.mockRestore();
      fs.access.mockRestore();
      fs.stat.mockRestore();
      fs.remove.mockRestore();
    }
  };
}

/**
 * Mock child_process execSync
 * @returns {Object} Mock function
 */
function mockExecSync() {
  const { execSync } = require('child_process');
  const originalExecSync = execSync;
  
  jest.spyOn(require('child_process'), 'execSync').mockImplementation(jest.fn());
  
  return {
    restore: () => {
      require('child_process').execSync.mockRestore();
    }
  };
}

/**
 * Create a mock project structure for testing
 * @param {string} projectDir - Project directory
 * @returns {Promise<void>}
 */
async function createMockProjectStructure(projectDir) {
  await fs.ensureDir(projectDir);
  await fs.ensureDir(path.join(projectDir, 'src'));
  
  // Create package.json
  await fs.writeJson(path.join(projectDir, 'package.json'), {
    name: 'test-project',
    version: '1.0.0',
    description: 'Test project',
    main: 'src/index.js',
    scripts: {
      start: 'node src/index.js'
    }
  }, { spaces: 2 });
  
  // Create index.js
  await fs.writeFile(
    path.join(projectDir, 'src', 'index.js'),
    `console.log('Hello from test project');`
  );
}

/**
 * Verify if a directory has the expected SPARC structure
 * @param {string} projectDir - Project directory
 * @returns {Promise<boolean>}
 */
async function verifySparcStructure(projectDir) {
  const hasRooDir = await fs.pathExists(path.join(projectDir, '.roo'));
  const hasRooModesFile = await fs.pathExists(path.join(projectDir, '.roomodes'));
  const hasSrcDir = await fs.pathExists(path.join(projectDir, 'src'));
  const hasPackageJson = await fs.pathExists(path.join(projectDir, 'package.json'));
  
  return hasRooDir && hasRooModesFile && hasSrcDir && hasPackageJson;
}

/**
 * Run the create-sparc CLI directly
 * @param {string[]} args - CLI arguments
 * @param {Object} options - Options
 * @returns {string|Object} Command output or error object
 */
function runCli(args, options = {}) {
  const cliPath = path.resolve(__dirname, '../../bin/index.js');
  const cwd = options.cwd || process.cwd();
  
  try {
    // Set NODE_ENV to test for proper error handling in CLI
    const env = { ...process.env, NODE_ENV: 'test' };
    
    const output = execSync(`node ${cliPath} ${args.join(' ')}`, {
      cwd,
      stdio: 'pipe',
      encoding: 'utf8',
      env
    });
    
    return output;
  } catch (error) {
    return {
      error: true,
      stderr: error.stderr?.toString() || '',
      stdout: error.stdout?.toString() || '',
      status: error.status,
      message: error.message
    };
  }
}

module.exports = {
  mockFileSystem,
  mockExecSync,
  createMockProjectStructure,
  verifySparcStructure,
  runCli
};