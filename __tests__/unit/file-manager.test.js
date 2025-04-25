/**
 * Unit tests for the file manager
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { fileManager } = require('../../src/core/file-manager');
const { mockFileSystem } = require('../utils/test-utils');

// Helper function to create a test directory
async function createTestDir(name) {
  const testDir = path.join(os.tmpdir(), `${name}-${Date.now()}`);
  await fs.ensureDir(testDir);
  return testDir;
}

describe('File Manager', () => {
  let mockFs;
  let testDir;

  beforeEach(async () => {
    // Create a fresh test directory for each test
    testDir = await createTestDir('file-manager-test');
    
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore any mocked functions
    if (mockFs) {
      mockFs.restore();
      mockFs = null;
    }
  });

  describe('createDirectory', () => {
    test('should create a directory', async () => {
      const dirPath = path.join(testDir, 'test-dir');
      await fileManager.createDirectory(dirPath);
      
      const exists = await fs.pathExists(dirPath);
      expect(exists).toBe(true);
    });

    test('should create nested directories with recursive option', async () => {
      const dirPath = path.join(testDir, 'nested/test-dir');
      await fileManager.createDirectory(dirPath, { recursive: true });
      
      const exists = await fs.pathExists(dirPath);
      expect(exists).toBe(true);
    });

    test('should throw an error when creating a directory without recursive option', async () => {
      mockFs = mockFileSystem();
      const dirPath = path.join(testDir, 'nested/test-dir');
      
      // Mock fs.mkdir to throw an error
      fs.mkdir.mockRejectedValueOnce(new Error('ENOENT: no such file or directory'));
      
      await expect(fileManager.createDirectory(dirPath, { recursive: false }))
        .rejects.toThrow('ENOENT: no such file or directory');
    });
  });

  describe('writeFile', () => {
    test('should write content to a file', async () => {
      const filePath = path.join(testDir, 'test-file.txt');
      const content = 'Test content';
      
      await fileManager.writeFile(filePath, content);
      
      const fileContent = await fs.readFile(filePath, 'utf8');
      expect(fileContent).toBe(content);
    });

    test('should overwrite existing file when overwrite option is true', async () => {
      const filePath = path.join(testDir, 'test-file.txt');
      const initialContent = 'Initial content';
      const newContent = 'New content';
      
      // Create the file with initial content
      await fs.writeFile(filePath, initialContent);
      
      // Overwrite the file
      await fileManager.writeFile(filePath, newContent, { overwrite: true });
      
      const fileContent = await fs.readFile(filePath, 'utf8');
      expect(fileContent).toBe(newContent);
    });

    test('should throw an error when overwrite option is false and file exists', async () => {
      const filePath = path.join(testDir, 'test-file.txt');
      const content = 'Test content';
      
      // Create the file
      await fs.writeFile(filePath, content);
      
      // Try to write to the file with overwrite: false
      await expect(fileManager.writeFile(filePath, 'New content', { overwrite: false }))
        .rejects.toThrow(`File already exists: ${filePath}`);
    });
  });

  describe('copy', () => {
    test('should copy a file', async () => {
      const sourceFile = path.join(testDir, 'source.txt');
      const destFile = path.join(testDir, 'dest.txt');
      const content = 'Test content';
      
      // Create the source file
      await fs.writeFile(sourceFile, content);
      
      // Copy the file
      await fileManager.copy(sourceFile, destFile);
      
      // Check if the destination file exists and has the same content
      const exists = await fs.pathExists(destFile);
      expect(exists).toBe(true);
      
      const destContent = await fs.readFile(destFile, 'utf8');
      expect(destContent).toBe(content);
    });

    test('should copy a directory', async () => {
      const sourceDir = path.join(testDir, 'source-dir');
      const destDir = path.join(testDir, 'dest-dir');
      const testFile = path.join(sourceDir, 'test.txt');
      const content = 'Test content';
      
      // Create the source directory and a file inside it
      await fs.ensureDir(sourceDir);
      await fs.writeFile(testFile, content);
      
      // Copy the directory
      await fileManager.copy(sourceDir, destDir);
      
      // Check if the destination directory and file exist
      const dirExists = await fs.pathExists(destDir);
      expect(dirExists).toBe(true);
      
      const fileExists = await fs.pathExists(path.join(destDir, 'test.txt'));
      expect(fileExists).toBe(true);
      
      const destContent = await fs.readFile(path.join(destDir, 'test.txt'), 'utf8');
      expect(destContent).toBe(content);
    });

    test('should throw an error when source does not exist', async () => {
      const sourcePath = path.join(testDir, 'non-existent');
      const destPath = path.join(testDir, 'dest');
      
      await expect(fileManager.copy(sourcePath, destPath))
        .rejects.toThrow(`Source does not exist: ${sourcePath}`);
    });

    test('should not overwrite destination when overwrite option is false', async () => {
      mockFs = mockFileSystem();
      const sourcePath = path.join(testDir, 'source.txt');
      const destPath = path.join(testDir, 'dest.txt');
      
      // Mock fs.exists to return true for both source and destination
      fs.access.mockImplementation((path) => {
        return Promise.resolve();
      });
    });
      
      // Mock fs.copy to throw an error when overwrite is false
      fs.copy.mockRejectedValueOnce(new Error('EEXIST: file already exists'));
      
      await expect(fileManager.copy(sourcePath, destPath, { overwrite: false }))
        .rejects.toThrow('EEXIST: file already exists');
    });
  });

  describe('exists', () => {
    test('should return true when path exists', async () => {
      const filePath = path.join(testDir, 'test-file.txt');
      
      // Create the file
      await fs.writeFile(filePath, 'Test content');
      
      const exists = await fileManager.exists(filePath);
      expect(exists).toBe(true);
    });

    test('should return false when path does not exist', async () => {
      const filePath = path.join(testDir, 'non-existent.txt');
      
      const exists = await fileManager.exists(filePath);
      expect(exists).toBe(false);
    });
  });

  describe('isDirectory', () => {
    test('should return true when path is a directory', async () => {
      const dirPath = path.join(testDir, 'test-dir');
      
      // Create the directory
      await fs.ensureDir(dirPath);
      
      const isDir = await fileManager.isDirectory(dirPath);
      expect(isDir).toBe(true);
    });

    test('should return false when path is a file', async () => {
      const filePath = path.join(testDir, 'test-file.txt');
      
      // Create the file
      await fs.writeFile(filePath, 'Test content');
      
      const isDir = await fileManager.isDirectory(filePath);
      expect(isDir).toBe(false);
    });

    test('should return false when path does not exist', async () => {
      const dirPath = path.join(testDir, 'non-existent');
      
      const isDir = await fileManager.isDirectory(dirPath);
      expect(isDir).toBe(false);
    });
  });

  describe('isFile', () => {
    test('should return true when path is a file', async () => {
      const filePath = path.join(testDir, 'test-file.txt');
      
      // Create the file
      await fs.writeFile(filePath, 'Test content');
      
      const isFile = await fileManager.isFile(filePath);
      expect(isFile).toBe(true);
    });

    test('should return false when path is a directory', async () => {
      const dirPath = path.join(testDir, 'test-dir');
      
      // Create the directory
      await fs.ensureDir(dirPath);
      
      const isFile = await fileManager.isFile(dirPath);
      expect(isFile).toBe(false);
    });

    test('should return false when path does not exist', async () => {
      const filePath = path.join(testDir, 'non-existent.txt');
      
      const isFile = await fileManager.isFile(filePath);
      expect(isFile).toBe(false);
    });
  });

  describe('readFile', () => {
    test('should read file content', async () => {
      const filePath = path.join(testDir, 'test-file.txt');
      const content = 'Test content';
      
      // Create the file
      await fs.writeFile(filePath, content);
      
      const fileContent = await fileManager.readFile(filePath);
      expect(fileContent).toBe(content);
    });

    test('should throw an error when file does not exist', async () => {
      const filePath = path.join(testDir, 'non-existent.txt');
      
      await expect(fileManager.readFile(filePath))
        .rejects.toThrow();
    });
  });

  describe('readDirectory', () => {
    test('should read directory contents', async () => {
      const dirPath = path.join(testDir, 'test-dir');
      const file1 = path.join(dirPath, 'file1.txt');
      const file2 = path.join(dirPath, 'file2.txt');
      
      // Create the directory and files
      await fs.ensureDir(dirPath);
      await fs.writeFile(file1, 'Content 1');
      await fs.writeFile(file2, 'Content 2');
      
      const contents = await fileManager.readDirectory(dirPath);
      expect(contents).toContain('file1.txt');
      expect(contents).toContain('file2.txt');
      expect(contents.length).toBe(2);
    });

    test('should throw an error when directory does not exist', async () => {
      const dirPath = path.join(testDir, 'non-existent');
      
      await expect(fileManager.readDirectory(dirPath))
        .rejects.toThrow();
    });
  });

  describe('delete', () => {
    test('should delete a file', async () => {
      const filePath = path.join(testDir, 'test-file.txt');
      
      // Create the file
      await fs.writeFile(filePath, 'Test content');
      
      // Delete the file
      await fileManager.delete(filePath);
      
      const exists = await fs.pathExists(filePath);
      expect(exists).toBe(false);
    });

    test('should delete a directory', async () => {
      const dirPath = path.join(testDir, 'test-dir');
      const filePath = path.join(dirPath, 'test-file.txt');
      
      // Create the directory and a file inside it
      await fs.ensureDir(dirPath);
      await fs.writeFile(filePath, 'Test content');
      
      // Delete the directory
      await fileManager.delete(dirPath);
      
      const exists = await fs.pathExists(dirPath);
      expect(exists).toBe(false);
    });

    test('should not throw an error when path does not exist and force option is true', async () => {
      const filePath = path.join(testDir, 'non-existent.txt');
      
      // This should not throw an error
      await fileManager.delete(filePath, { force: true });
    });
  });