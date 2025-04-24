/**
 * Unit tests for the symlink manager
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { symlinkManager } = require('../../src/core/file-manager/symlink');

describe('Symlink Manager', () => {
  let testDir;
  let sourceDir;
  let targetDir;

  beforeEach(async () => {
    // Create a fresh test directory for each test
    testDir = await createTestDir('symlink-manager-test');
    sourceDir = path.join(testDir, 'source');
    targetDir = path.join(testDir, 'target');
    
    // Create source directory with test files
    await fs.ensureDir(sourceDir);
    await fs.writeFile(path.join(sourceDir, 'test-file.txt'), 'Test content');
    await fs.ensureDir(path.join(sourceDir, 'test-dir'));
    await fs.writeFile(path.join(sourceDir, 'test-dir', 'nested-file.txt'), 'Nested content');
    
    // Create target directory
    await fs.ensureDir(targetDir);
    
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('createSymlink', () => {
    test('should create a file symlink', async () => {
      // Skip on Windows in CI environment due to permission issues
      if (process.platform === 'win32' && process.env.CI) {
        return;
      }
      
      const sourcePath = path.join(sourceDir, 'test-file.txt');
      const targetPath = path.join(targetDir, 'test-file.txt');
      
      await symlinkManager.createSymlink(sourcePath, targetPath);
      
      // Check if symlink was created
      const isSymlink = await fs.pathExists(targetPath);
      expect(isSymlink).toBe(true);
      
      // Check if it's actually a symlink
      const stats = await fs.lstat(targetPath);
      expect(stats.isSymbolicLink()).toBe(true);
      
      // Check if the symlink points to the correct file
      const linkTarget = await fs.readlink(targetPath);
      expect(path.resolve(targetDir, linkTarget)).toBe(path.resolve(sourcePath));
      
      // Check if the content is accessible through the symlink
      const content = await fs.readFile(targetPath, 'utf8');
      expect(content).toBe('Test content');
    });

    test('should create a directory symlink', async () => {
      // Skip on Windows in CI environment due to permission issues
      if (process.platform === 'win32' && process.env.CI) {
        return;
      }
      
      const sourcePath = path.join(sourceDir, 'test-dir');
      const targetPath = path.join(targetDir, 'test-dir');
      
      await symlinkManager.createSymlink(sourcePath, targetPath);
      
      // Check if symlink was created
      const isSymlink = await fs.pathExists(targetPath);
      expect(isSymlink).toBe(true);
      
      // Check if it's actually a symlink
      const stats = await fs.lstat(targetPath);
      expect(stats.isSymbolicLink()).toBe(true);
      
      // Check if the symlink points to the correct directory
      const linkTarget = await fs.readlink(targetPath);
      expect(path.resolve(targetDir, linkTarget)).toBe(path.resolve(sourcePath));
      
      // Check if the nested content is accessible through the symlink
      const nestedPath = path.join(targetPath, 'nested-file.txt');
      const content = await fs.readFile(nestedPath, 'utf8');
      expect(content).toBe('Nested content');
    });

    test('should handle existing symlink', async () => {
      // Skip on Windows in CI environment due to permission issues
      if (process.platform === 'win32' && process.env.CI) {
        return;
      }
      
      const sourcePath = path.join(sourceDir, 'test-file.txt');
      const targetPath = path.join(targetDir, 'test-file.txt');
      
      // Create a symlink first
      await symlinkManager.createSymlink(sourcePath, targetPath);
      
      // Try to create it again
      await symlinkManager.createSymlink(sourcePath, targetPath);
      
      // Check if symlink still exists and points to the correct file
      const stats = await fs.lstat(targetPath);
      expect(stats.isSymbolicLink()).toBe(true);
      
      const linkTarget = await fs.readlink(targetPath);
      expect(path.resolve(targetDir, linkTarget)).toBe(path.resolve(sourcePath));
    });

    test('should throw an error when source does not exist', async () => {
      const sourcePath = path.join(sourceDir, 'non-existent.txt');
      const targetPath = path.join(targetDir, 'test-file.txt');
      
      await expect(symlinkManager.createSymlink(sourcePath, targetPath))
        .rejects.toThrow();
    });

    test('should handle platform-specific symlink types', async () => {
      // Skip on Windows in CI environment due to permission issues
      if (process.platform === 'win32' && process.env.CI) {
        return;
      }
      
      // Mock fs.symlink to verify the correct type is used
      const symlinkSpy = jest.spyOn(fs, 'symlink');
      
      const sourcePath = path.join(sourceDir, 'test-dir');
      const targetPath = path.join(targetDir, 'test-dir');
      
      await symlinkManager.createSymlink(sourcePath, targetPath);
      
      // Check if the correct type was used based on platform
      if (process.platform === 'win32') {
        expect(symlinkSpy).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(String),
          'junction'
        );
      } else {
        expect(symlinkSpy).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(String),
          'dir'
        );
      }
      
      symlinkSpy.mockRestore();
    });
  });

  describe('createRelativeSymlink', () => {
    test('should create a symlink with a relative path', async () => {
      // Skip on Windows in CI environment due to permission issues
      if (process.platform === 'win32' && process.env.CI) {
        return;
      }
      
      const sourcePath = path.join(sourceDir, 'test-file.txt');
      const targetPath = path.join(targetDir, 'test-file.txt');
      
      await symlinkManager.createRelativeSymlink(sourcePath, targetPath);
      
      // Check if symlink was created
      const isSymlink = await fs.pathExists(targetPath);
      expect(isSymlink).toBe(true);
      
      // Check if it's actually a symlink
      const stats = await fs.lstat(targetPath);
      expect(stats.isSymbolicLink()).toBe(true);
      
      // Check if the symlink target is a relative path
      const linkTarget = await fs.readlink(targetPath);
      expect(path.isAbsolute(linkTarget)).toBe(false);
      
      // Check if the content is accessible through the symlink
      const content = await fs.readFile(targetPath, 'utf8');
      expect(content).toBe('Test content');
    });
  });

  describe('isSymlinkSupported', () => {
    test('should return a boolean indicating if symlinks are supported', async () => {
      const result = await symlinkManager.isSymlinkSupported();
      
      // This should be a boolean
      expect(typeof result).toBe('boolean');
    });
  });

  describe('fallbackCopy', () => {
    test('should copy a file when symlinks are not supported', async () => {
      const sourcePath = path.join(sourceDir, 'test-file.txt');
      const targetPath = path.join(targetDir, 'test-file.txt');
      
      await symlinkManager.fallbackCopy(sourcePath, targetPath);
      
      // Check if file was copied
      const exists = await fs.pathExists(targetPath);
      expect(exists).toBe(true);
      
      // Check if it's a regular file, not a symlink
      const stats = await fs.lstat(targetPath);
      expect(stats.isSymbolicLink()).toBe(false);
      
      // Check if the content is correct
      const content = await fs.readFile(targetPath, 'utf8');
      expect(content).toBe('Test content');
    });

    test('should copy a directory when symlinks are not supported', async () => {
      const sourcePath = path.join(sourceDir, 'test-dir');
      const targetPath = path.join(targetDir, 'test-dir');
      
      await symlinkManager.fallbackCopy(sourcePath, targetPath);
      
      // Check if directory was copied
      const exists = await fs.pathExists(targetPath);
      expect(exists).toBe(true);
      
      // Check if it's a regular directory, not a symlink
      const stats = await fs.lstat(targetPath);
      expect(stats.isSymbolicLink()).toBe(false);
      
      // Check if the nested content was copied
      const nestedPath = path.join(targetPath, 'nested-file.txt');
      const content = await fs.readFile(nestedPath, 'utf8');
      expect(content).toBe('Nested content');
    });
  });
});