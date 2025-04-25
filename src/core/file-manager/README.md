# MCP Configuration Wizard File Manager

The File Manager component for the MCP Configuration Wizard provides safe and reliable file system operations, with special focus on configuration file handling. It includes features for backup creation, permission validation, configuration merging, and recovery options.

## Features

- **Safe Configuration Operations**: Read and write configuration files with automatic backup
- **Backup Management**: Create, find, and restore from backups
- **Permission Validation**: Check file permissions before operations
- **Configuration Merging**: Multiple strategies for merging configuration objects
- **File Integrity**: Hash-based file integrity verification
- **Working Copy Management**: Create temporary working copies for safe editing
- **Recovery Options**: Automatic recovery from failed operations

## API Reference

### Basic File Operations

```javascript
// Create a directory
await fileManager.createDirectory('/path/to/dir', { recursive: true });

// Write to a file
await fileManager.writeFile('/path/to/file.txt', 'content', { overwrite: true });

// Read a file
const content = await fileManager.readFile('/path/to/file.txt');

// Copy files or directories
await fileManager.copy('/source/path', '/dest/path', { overwrite: true });

// Delete files or directories
await fileManager.delete('/path/to/delete', { recursive: true, force: false });

// Check if a path exists
const exists = await fileManager.exists('/path/to/check');

// Check if a path is a directory
const isDir = await fileManager.isDirectory('/path/to/check');

// Check if a path is a file
const isFile = await fileManager.isFile('/path/to/check');

// Read directory contents
const files = await fileManager.readDirectory('/path/to/dir');
```

### Configuration File Operations

```javascript
// Safely read a configuration file (with JSON parsing)
const config = await fileManager.safeReadConfig('/path/to/config.json');

// Safely write a configuration file (with automatic backup)
await fileManager.safeWriteConfig('/path/to/config.json', configObject, {
  createBackup: true,
  pretty: true
});

// Merge configuration objects
const mergedConfig = fileManager.mergeConfigurations(baseConfig, newConfig, {
  strategy: 'deep' // 'shallow', 'deep', 'overwrite', or 'selective'
});
```

### Backup Management

```javascript
// Create a backup of a file
const backupPath = await fileManager.createBackup('/path/to/file.json', {
  timestamped: true,
  backupDir: '/custom/backup/dir' // optional
});

// Find all backups for a file
const backups = await fileManager.findBackups('/path/to/file.json');

// Restore from a backup
await fileManager.restoreFromBackup('/path/to/backup.json.bak', '/path/to/restore.json');
```

### Permission and Integrity Validation

```javascript
// Check file permissions
const permissionResult = await fileManager.validatePermissions('/path/to/file', {
  read: true,
  write: true,
  execute: false
});

// Calculate file hash
const hash = await fileManager.calculateFileHash('/path/to/file', {
  algorithm: 'sha256'
});

// Verify file integrity
const isIntact = await fileManager.verifyFileIntegrity('/path/to/file', expectedHash);
```

### Working Copy Management

```javascript
// Create a temporary working copy
const tempPath = await fileManager.createTempWorkingCopy('/path/to/config.json');

// Modify the working copy...

// Commit changes back to the original file
await fileManager.commitWorkingCopy(tempPath, '/path/to/config.json', {
  createBackup: true
});
```

## Usage Examples

### Safe Configuration Update

```javascript
// Example: Safely update a configuration file
async function updateConfiguration(configPath, updates) {
  try {
    // Read the current configuration
    const currentConfig = await fileManager.safeReadConfig(configPath);
    
    // Merge with updates
    const newConfig = fileManager.mergeConfigurations(currentConfig, updates, {
      strategy: 'deep'
    });
    
    // Write the updated configuration with backup
    await fileManager.safeWriteConfig(configPath, newConfig);
    
    return { success: true, config: newConfig };
  } catch (error) {
    console.error(`Failed to update configuration: ${error.message}`);
    return { success: false, error };
  }
}
```

### Working with Temporary Copies

```javascript
// Example: Make multiple changes to a config file safely
async function batchUpdateConfig(configPath, operations) {
  // Create a temporary working copy
  const tempPath = await fileManager.createTempWorkingCopy(configPath);
  
  try {
    // Read the config from the working copy
    let config = await fileManager.safeReadConfig(tempPath, { parseJson: true });
    
    // Apply all operations
    for (const operation of operations) {
      config = operation(config);
    }
    
    // Write changes to the working copy
    await fileManager.writeFile(tempPath, JSON.stringify(config, null, 2));
    
    // Commit changes back to the original file
    await fileManager.commitWorkingCopy(tempPath, configPath);
    
    return { success: true, config };
  } catch (error) {
    // Clean up the temporary file
    await fileManager.delete(tempPath, { force: true });
    throw error;
  }
}
```

## Error Handling

The File Manager includes comprehensive error handling with detailed error messages. Most methods will throw errors with descriptive messages when operations fail. For critical operations, automatic recovery from backups is attempted when possible.

## Best Practices

1. **Always use safeWriteConfig** for configuration files to ensure backups are created
2. **Validate permissions** before performing write operations
3. **Use working copies** for complex multi-step operations
4. **Implement proper error handling** to catch and handle file operation failures
5. **Verify file integrity** for critical configuration files after network transfers