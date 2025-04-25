/**
 * Unit tests for the enhanced file manager functionality
 */

describe('Enhanced File Manager', () => {
  let testDir;

  beforeEach(async () => {
    // Create a fresh test directory for each test
    testDir = await createTestDir('file-manager-enhanced-test');
    
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  // New tests for enhanced functionality
  describe('isWritable', () => {
    test('should return true when file is writable', async () => {
      const filePath = path.join(testDir, 'writable-file.txt');
      
      // Create the file
      await fs.writeFile(filePath, 'Test content');
      
      // Mock fs.access to simulate writable file
      mockFs = mockFileSystem();
      fs.access.mockImplementation(() => Promise.resolve());
      
      const isWritable = await fileManager.isWritable(filePath);
      expect(isWritable).toBe(true);
    });

    test('should return false when file is not writable', async () => {
      const filePath = path.join(testDir, 'non-writable-file.txt');
      
      // Mock fs.access to simulate non-writable file
      mockFs = mockFileSystem();
      fs.access.mockImplementation(() => Promise.reject(new Error('EACCES: permission denied')));
      
      const isWritable = await fileManager.isWritable(filePath);
      expect(isWritable).toBe(false);
    });
  });

  describe('isReadable', () => {
    test('should return true when file is readable', async () => {
      const filePath = path.join(testDir, 'readable-file.txt');
      
      // Create the file
      await fs.writeFile(filePath, 'Test content');
      
      // Mock fs.access to simulate readable file
      mockFs = mockFileSystem();
      fs.access.mockImplementation(() => Promise.resolve());
      
      const isReadable = await fileManager.isReadable(filePath);
      expect(isReadable).toBe(true);
    });

    test('should return false when file is not readable', async () => {
      const filePath = path.join(testDir, 'non-readable-file.txt');
      
      // Mock fs.access to simulate non-readable file
      mockFs = mockFileSystem();
      fs.access.mockImplementation(() => Promise.reject(new Error('EACCES: permission denied')));
      
      const isReadable = await fileManager.isReadable(filePath);
      expect(isReadable).toBe(false);
    });
  });

  describe('createBackup', () => {
    test('should create a backup of a file with timestamp', async () => {
      const filePath = path.join(testDir, 'config.json');
      const content = '{"key": "value"}';
      
      // Create the file
      await fs.writeFile(filePath, content);
      
      // Create backup
      const backupPath = await fileManager.createBackup(filePath, { timestamped: true });
      
      // Check if backup exists
      const backupExists = await fs.pathExists(backupPath);
      expect(backupExists).toBe(true);
      
      // Check backup content
      const backupContent = await fs.readFile(backupPath, 'utf8');
      expect(backupContent).toBe(content);
      
      // Check backup filename format
      expect(backupPath).toMatch(/config\.json\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.bak$/);
    });

    test('should create a backup of a file without timestamp', async () => {
      const filePath = path.join(testDir, 'config.json');
      const content = '{"key": "value"}';
      
      // Create the file
      await fs.writeFile(filePath, content);
      
      // Create backup
      const backupPath = await fileManager.createBackup(filePath, { timestamped: false });
      
      // Check if backup exists
      const backupExists = await fs.pathExists(backupPath);
      expect(backupExists).toBe(true);
      
      // Check backup content
      const backupContent = await fs.readFile(backupPath, 'utf8');
      expect(backupContent).toBe(content);
      
      // Check backup filename format
      expect(backupPath).toMatch(/config\.json\.bak$/);
    });

    test('should create a backup in a custom directory', async () => {
      const filePath = path.join(testDir, 'config.json');
      const backupDir = path.join(testDir, 'backups');
      const content = '{"key": "value"}';
      
      // Create the file and backup directory
      await fs.writeFile(filePath, content);
      await fs.ensureDir(backupDir);
      
      // Create backup
      const backupPath = await fileManager.createBackup(filePath, { 
        backupDir, 
        timestamped: false 
      });
      
      // Check if backup exists in the custom directory
      expect(backupPath.startsWith(backupDir)).toBe(true);
      
      const backupExists = await fs.pathExists(backupPath);
      expect(backupExists).toBe(true);
    });

    test('should throw an error when trying to backup a non-existent file', async () => {
      const filePath = path.join(testDir, 'non-existent.json');
      
      await expect(fileManager.createBackup(filePath))
        .rejects.toThrow(`Cannot backup non-existent file: ${filePath}`);
    });
  });

  describe('restoreFromBackup', () => {
    test('should restore a file from backup', async () => {
      const originalPath = path.join(testDir, 'config.json');
      const originalContent = '{"key": "value"}';
      const modifiedContent = '{"key": "modified"}';
      
      // Create the original file
      await fs.writeFile(originalPath, originalContent);
      
      // Create a backup
      const backupPath = await fileManager.createBackup(originalPath, { timestamped: false });
      
      // Modify the original file
      await fs.writeFile(originalPath, modifiedContent);
      
      // Restore from backup
      await fileManager.restoreFromBackup(backupPath, originalPath);
      
      // Check if the file was restored
      const restoredContent = await fs.readFile(originalPath, 'utf8');
      expect(restoredContent).toBe(originalContent);
    });

    test('should restore to a different target path', async () => {
      const originalPath = path.join(testDir, 'config.json');
      const targetPath = path.join(testDir, 'restored-config.json');
      const content = '{"key": "value"}';
      
      // Create the original file
      await fs.writeFile(originalPath, content);
      
      // Create a backup
      const backupPath = await fileManager.createBackup(originalPath, { timestamped: false });
      
      // Restore to a different path
      await fileManager.restoreFromBackup(backupPath, targetPath);
      
      // Check if the file was restored to the target path
      const targetExists = await fs.pathExists(targetPath);
      expect(targetExists).toBe(true);
      
      const restoredContent = await fs.readFile(targetPath, 'utf8');
      expect(restoredContent).toBe(content);
    });

    test('should throw an error when backup does not exist', async () => {
      const backupPath = path.join(testDir, 'non-existent-backup.json.bak');
      const targetPath = path.join(testDir, 'target.json');
      
      await expect(fileManager.restoreFromBackup(backupPath, targetPath))
        .rejects.toThrow(`Backup file does not exist: ${backupPath}`);
    });

    test('should throw an error when target exists and overwrite is false', async () => {
      const originalPath = path.join(testDir, 'config.json');
      const targetPath = path.join(testDir, 'target.json');
      const content = '{"key": "value"}';
      
      // Create the original file and target
      await fs.writeFile(originalPath, content);
      await fs.writeFile(targetPath, 'Target content');
      
      // Create a backup
      const backupPath = await fileManager.createBackup(originalPath, { timestamped: false });
      
      // Try to restore with overwrite: false
      await expect(fileManager.restoreFromBackup(backupPath, targetPath, { overwrite: false }))
        .rejects.toThrow(`Cannot restore: target file exists and overwrite is not allowed: ${targetPath}`);
    });
  });

  describe('findBackups', () => {
    test('should find all backups for a file', async () => {
      const filePath = path.join(testDir, 'config.json');
      const content = '{"key": "value"}';
      
      // Create the file
      await fs.writeFile(filePath, content);
      
      // Create multiple backups
      const backup1 = await fileManager.createBackup(filePath, { timestamped: true });
      
      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const backup2 = await fileManager.createBackup(filePath, { timestamped: true });
      const backup3 = await fileManager.createBackup(filePath, { timestamped: false });
      
      // Find backups
      const backups = await fileManager.findBackups(filePath);
      
      // Should find all 3 backups
      expect(backups.length).toBe(3);
      
      // Check if all backup paths are included
      const backupFilenames = backups.map(p => path.basename(p));
      expect(backupFilenames).toContain(path.basename(backup1));
      expect(backupFilenames).toContain(path.basename(backup2));
      expect(backupFilenames).toContain(path.basename(backup3));
    });

    test('should return empty array when no backups exist', async () => {
      const filePath = path.join(testDir, 'no-backups.json');
      
      // Create the file without backups
      await fs.writeFile(filePath, '{}');
      
      const backups = await fileManager.findBackups(filePath);
      expect(backups).toEqual([]);
    });

    test('should return empty array when backup directory does not exist', async () => {
      const filePath = path.join(testDir, 'config.json');
      const nonExistentDir = path.join(testDir, 'non-existent-dir');
      
      const backups = await fileManager.findBackups(filePath, { backupDir: nonExistentDir });
      expect(backups).toEqual([]);
    });
  });

  describe('safeWriteConfig', () => {
    test('should write configuration with backup', async () => {
      const configPath = path.join(testDir, 'config.json');
      const initialConfig = { version: '1.0', settings: { enabled: true } };
      const newConfig = { version: '1.1', settings: { enabled: false } };
      
      // Create initial config
      await fs.writeJson(configPath, initialConfig);
      
      // Write new config safely
      const result = await fileManager.safeWriteConfig(configPath, newConfig);
      
      // Check if backup was created
      expect(result.success).toBe(true);
      expect(result.backupPath).toBeTruthy();
      
      // Check if backup contains the initial config
      const backupContent = await fs.readJson(result.backupPath);
      expect(backupContent).toEqual(initialConfig);
      
      // Check if new config was written
      const writtenConfig = await fs.readJson(configPath);
      expect(writtenConfig).toEqual(newConfig);
    });

    test('should write string content directly', async () => {
      const configPath = path.join(testDir, 'config.txt');
      const content = 'This is a text configuration';
      
      // Write content safely
      await fileManager.safeWriteConfig(configPath, content);
      
      // Check if content was written
      const writtenContent = await fs.readFile(configPath, 'utf8');
      expect(writtenContent).toBe(content);
    });

    test('should not create backup if file does not exist', async () => {
      const configPath = path.join(testDir, 'new-config.json');
      const config = { version: '1.0' };
      
      // Write new config safely
      const result = await fileManager.safeWriteConfig(configPath, config);
      
      // Check that no backup was created
      expect(result.success).toBe(true);
      expect(result.backupPath).toBeNull();
      
      // Check if config was written
      const writtenConfig = await fs.readJson(configPath);
      expect(writtenConfig).toEqual(config);
    });

    test('should skip backup creation when createBackup is false', async () => {
      const configPath = path.join(testDir, 'config.json');
      const initialConfig = { version: '1.0' };
      const newConfig = { version: '1.1' };
      
      // Create initial config
      await fs.writeJson(configPath, initialConfig);
      
      // Write new config without backup
      const result = await fileManager.safeWriteConfig(configPath, newConfig, { createBackup: false });
      
      // Check that no backup was created
      expect(result.success).toBe(true);
      expect(result.backupPath).toBeNull();
      
      // Check if new config was written
      const writtenConfig = await fs.readJson(configPath);
      expect(writtenConfig).toEqual(newConfig);
    });
  });

  describe('safeReadConfig', () => {
    test('should read and parse JSON configuration', async () => {
      const configPath = path.join(testDir, 'config.json');
      const config = { version: '1.0', settings: { enabled: true } };
      
      // Create config file
      await fs.writeJson(configPath, config);
      
      // Read config safely
      const readConfig = await fileManager.safeReadConfig(configPath);
      
      // Check if config was read correctly
      expect(readConfig).toEqual(config);
    });

    test('should read configuration as string when parseJson is false', async () => {
      const configPath = path.join(testDir, 'config.json');
      const config = { version: '1.0', settings: { enabled: true } };
      
      // Create config file
      await fs.writeJson(configPath, config);
      
      // Read config as string
      const readConfig = await fileManager.safeReadConfig(configPath, { parseJson: false });
      
      // Check if config was read as string
      expect(typeof readConfig).toBe('string');
      expect(JSON.parse(readConfig)).toEqual(config);
    });

    test('should throw an error when file does not exist', async () => {
      const configPath = path.join(testDir, 'non-existent.json');
      
      await expect(fileManager.safeReadConfig(configPath))
        .rejects.toThrow(`Configuration file does not exist: ${configPath}`);
    });

    test('should throw an error when JSON is invalid', async () => {
      const configPath = path.join(testDir, 'invalid.json');
      
      // Create invalid JSON file
      await fs.writeFile(configPath, '{ "invalid": json }');
      
      await expect(fileManager.safeReadConfig(configPath))
        .rejects.toThrow('Failed to parse configuration as JSON');
    });
  });

  describe('mergeConfigurations', () => {
    test('should merge configurations with shallow strategy', () => {
      const baseConfig = {
        version: '1.0',
        settings: { theme: 'dark', notifications: true },
        features: ['a', 'b']
      };
      
      const newConfig = {
        version: '1.1',
        settings: { logging: true }
      };
      
      const merged = fileManager.mergeConfigurations(baseConfig, newConfig, { strategy: 'shallow' });
      
      // In shallow merge, settings should be completely replaced
      expect(merged).toEqual({
        version: '1.1',
        settings: { logging: true },
        features: ['a', 'b']
      });
    });

    test('should merge configurations with deep strategy', () => {
      const baseConfig = {
        version: '1.0',
        settings: { theme: 'dark', notifications: true },
        features: ['a', 'b']
      };
      
      const newConfig = {
        version: '1.1',
        settings: { logging: true }
      };
      
      const merged = fileManager.mergeConfigurations(baseConfig, newConfig, { strategy: 'deep' });
      
      // In deep merge, settings should be merged
      expect(merged).toEqual({
        version: '1.1',
        settings: { theme: 'dark', notifications: true, logging: true },
        features: ['a', 'b']
      });
    });

    test('should overwrite configuration with overwrite strategy', () => {
      const baseConfig = {
        version: '1.0',
        settings: { theme: 'dark', notifications: true },
        features: ['a', 'b']
      };
      
      const newConfig = {
        version: '1.1',
        settings: { logging: true }
      };
      
      const merged = fileManager.mergeConfigurations(baseConfig, newConfig, { strategy: 'overwrite' });
      
      // In overwrite strategy, only keys from newConfig should be present
      expect(merged).toEqual({
        version: '1.1',
        settings: { logging: true }
      });
    });

    test('should merge only selected keys with selective strategy', () => {
      const baseConfig = {
        version: '1.0',
        settings: { theme: 'dark', notifications: true },
        features: ['a', 'b'],
        advanced: { debug: false }
      };
      
      const newConfig = {
        version: '1.1',
        settings: { theme: 'light', logging: true },
        features: ['c'],
        advanced: { debug: true, verbose: true }
      };
      
      const merged = fileManager.mergeConfigurations(baseConfig, newConfig, { 
        strategy: 'selective',
        selectiveKeys: ['settings', 'advanced']
      });
      
      // Only settings and advanced should be merged
      expect(merged).toEqual({
        version: '1.0',
        settings: { theme: 'light', notifications: true, logging: true },
        features: ['a', 'b'],
        advanced: { debug: true, verbose: true }
      });
    });

    test('should throw an error for unknown merge strategy', () => {
      const baseConfig = { version: '1.0' };
      const newConfig = { version: '1.1' };
      
      expect(() => fileManager.mergeConfigurations(baseConfig, newConfig, { strategy: 'unknown' }))
        .toThrow('Unknown merge strategy: unknown');
    });

    test('should throw an error when selective strategy has no keys', () => {
      const baseConfig = { version: '1.0' };
      const newConfig = { version: '1.1' };
      
      expect(() => fileManager.mergeConfigurations(baseConfig, newConfig, { 
        strategy: 'selective',
        selectiveKeys: []
      })).toThrow('Selective merge requires a non-empty array of keys');
    });
  });

  describe('validatePermissions', () => {
    test('should validate file permissions', async () => {
      const filePath = path.join(testDir, 'test-file.txt');
      
      // Create the file
      await fs.writeFile(filePath, 'Test content');
      
      // Mock fs.access to simulate all permissions
      mockFs = mockFileSystem();
      fs.access.mockImplementation(() => Promise.resolve());
      
      const result = await fileManager.validatePermissions(filePath, {
        read: true,
        write: true,
        execute: true
      });
      
      expect(result.exists).toBe(true);
      expect(result.permissions.read).toBe(true);
      expect(result.permissions.write).toBe(true);
      expect(result.permissions.execute).toBe(true);
      expect(result.valid).toBe(true);
    });

    test('should return invalid when required permissions are missing', async () => {
      const filePath = path.join(testDir, 'test-file.txt');
      
      // Create the file
      await fs.writeFile(filePath, 'Test content');
      
      // Mock fs.access to simulate read-only permissions
      mockFs = mockFileSystem();
      fs.access.mockImplementation((path, mode) => {
        if (mode === fs.constants.R_OK) {
          return Promise.resolve();
        }
        return Promise.reject(new Error('EACCES: permission denied'));
      });
      
      const result = await fileManager.validatePermissions(filePath, {
        read: true,
        write: true,
        execute: false
      });
      
      expect(result.exists).toBe(true);
      expect(result.permissions.read).toBe(true);
      expect(result.permissions.write).toBe(false);
      expect(result.valid).toBe(false);
    });

    test('should return not valid when file does not exist', async () => {
      const filePath = path.join(testDir, 'non-existent.txt');
      
      const result = await fileManager.validatePermissions(filePath);
      
      expect(result.exists).toBe(false);
      expect(result.valid).toBe(false);
    });
  });

  describe('calculateFileHash', () => {
    test('should calculate file hash', async () => {
      const filePath = path.join(testDir, 'test-file.txt');
      const content = 'Test content';
      
      // Create the file
      await fs.writeFile(filePath, content);
      
      // Calculate hash
      const hash = await fileManager.calculateFileHash(filePath, { algorithm: 'sha256' });
      
      // Verify hash format
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA-256 produces 64 character hex string
    });

    test('should throw an error when file does not exist', async () => {
      const filePath = path.join(testDir, 'non-existent.txt');
      
      await expect(fileManager.calculateFileHash(filePath))
        .rejects.toThrow(`Cannot calculate hash for non-existent file: ${filePath}`);
    });
  });

  describe('verifyFileIntegrity', () => {
    test('should verify file integrity with correct hash', async () => {
      const filePath = path.join(testDir, 'test-file.txt');
      const content = 'Test content';
      
      // Create the file
      await fs.writeFile(filePath, content);
      
      // Calculate hash
      const hash = await fileManager.calculateFileHash(filePath, { algorithm: 'sha256' });
      
      // Verify integrity
      const isIntact = await fileManager.verifyFileIntegrity(filePath, hash, { algorithm: 'sha256' });
      expect(isIntact).toBe(true);
    });

    test('should return false when hash does not match', async () => {
      const filePath = path.join(testDir, 'test-file.txt');
      const content = 'Test content';
      
      // Create the file
      await fs.writeFile(filePath, content);
      
      // Incorrect hash
      const incorrectHash = '0'.repeat(64);
      
      // Verify integrity
      const isIntact = await fileManager.verifyFileIntegrity(filePath, incorrectHash, { algorithm: 'sha256' });
      expect(isIntact).toBe(false);
    });
  });

  describe('getMcpTempDir', () => {
    test('should return a valid temporary directory', async () => {
      const tempDir = await fileManager.getMcpTempDir();
      
      // Check if directory exists
      const exists = await fs.pathExists(tempDir);
      expect(exists).toBe(true);
      
      // Check if path includes expected name
      expect(tempDir).toContain('mcp-wizard-temp');
    });
  });

  describe('createTempWorkingCopy and commitWorkingCopy', () => {
    test('should create and commit a working copy', async () => {
      const configPath = path.join(testDir, 'config.json');
      const config = { version: '1.0', settings: { enabled: true } };
      
      // Create config file
      await fs.writeJson(configPath, config);
      
      // Create working copy
      const tempPath = await fileManager.createTempWorkingCopy(configPath);
      
      // Check if working copy exists
      const tempExists = await fs.pathExists(tempPath);
      expect(tempExists).toBe(true);
      
      // Modify working copy
      const modifiedConfig = { version: '1.1', settings: { enabled: false } };
      await fs.writeJson(tempPath, modifiedConfig);
      
      // Commit working copy
      const result = await fileManager.commitWorkingCopy(tempPath, configPath);
      
      // Check if commit was successful
      expect(result.success).toBe(true);
      expect(result.backupPath).toBeTruthy();
      
      // Check if original file was updated
      const updatedConfig = await fs.readJson(configPath);
      expect(updatedConfig).toEqual(modifiedConfig);
      
      // Check if temp file was deleted
      const tempStillExists = await fs.pathExists(tempPath);
      expect(tempStillExists).toBe(false);
    });

    test('should throw an error when source does not exist for working copy', async () => {
      const configPath = path.join(testDir, 'non-existent.json');
      
      await expect(fileManager.createTempWorkingCopy(configPath))
        .rejects.toThrow(`Cannot create working copy of non-existent file: ${configPath}`);
    });

    test('should throw an error when temp file does not exist for commit', async () => {
      const tempPath = path.join(testDir, 'non-existent-temp.json');
      const targetPath = path.join(testDir, 'target.json');
      
      await expect(fileManager.commitWorkingCopy(tempPath, targetPath))
        .rejects.toThrow(`Temporary file does not exist: ${tempPath}`);
    });
  });
});