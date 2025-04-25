/**
 * File Manager for MCP Configuration Wizard
 * Handles safe file system operations for configuration files
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { logger, pathUtils, errorHandler } = require('../../utils');

/**
 * File Manager
 */
const fileManager = {
  /**
   * Create a directory
   * @param {string} dirPath - Path to the directory
   * @param {Object} options - Options
   * @param {boolean} options.recursive - Create parent directories if they don't exist
   * @returns {Promise<void>}
   */
  async createDirectory(dirPath, options = { recursive: true }) {
    logger.debug(`Creating directory: ${dirPath}`);
    await fs.mkdir(dirPath, { recursive: options.recursive });
  },
  
  /**
   * Write content to a file
   * @param {string} filePath - Path to the file
   * @param {string|Buffer} content - Content to write
   * @param {Object} options - Options
   * @param {boolean} options.overwrite - Overwrite if file exists
   * @param {string} options.encoding - File encoding
   * @returns {Promise<void>}
   */
  async writeFile(filePath, content, options = { overwrite: true, encoding: 'utf8' }) {
    logger.debug(`Writing file: ${filePath}`);
    
    // Check if file exists and overwrite is not allowed
    if (!options.overwrite) {
      const exists = await this.exists(filePath);
      if (exists) {
        throw new Error(`File already exists: ${filePath}`);
      }
    }
    
    // Ensure parent directory exists
    await this.createDirectory(path.dirname(filePath));
    
    // Write the file
    await fs.writeFile(filePath, content, { encoding: options.encoding });
  },
  
  /**
   * Copy a file or directory
   * @param {string} sourcePath - Source path
   * @param {string} destPath - Destination path
   * @param {Object} options - Options
   * @param {boolean} options.overwrite - Overwrite if destination exists
   * @returns {Promise<void>}
   */
  async copy(sourcePath, destPath, options = { overwrite: true }) {
    logger.debug(`Copying from ${sourcePath} to ${destPath}`);
    
    // Check if source exists
    const sourceExists = await this.exists(sourcePath);
    if (!sourceExists) {
      throw new Error(`Source does not exist: ${sourcePath}`);
    }
    
    // Ensure parent directory exists
    await this.createDirectory(path.dirname(destPath));
    
    // Copy file or directory
    await fs.copy(sourcePath, destPath, { overwrite: options.overwrite });
  },
  
  /**
   * Check if a path exists
   * @param {string} path - Path to check
   * @returns {Promise<boolean>}
   */
  async exists(path) {
    try {
      await fs.access(path);
      return true;
    } catch (error) {
      return false;
    }
  },
  
  /**
   * Check if a path is a directory
   * @param {string} path - Path to check
   * @returns {Promise<boolean>}
   */
  async isDirectory(path) {
    try {
      const stats = await fs.stat(path);
      return stats.isDirectory();
    } catch (error) {
      return false;
    }
  },
  
  /**
   * Check if a path is a file
   * @param {string} path - Path to check
   * @returns {Promise<boolean>}
   */
  async isFile(path) {
    try {
      const stats = await fs.stat(path);
      return stats.isFile();
    } catch (error) {
      return false;
    }
  },
  
  /**
   * Read a file
   * @param {string} filePath - Path to the file
   * @param {Object} options - Options
   * @param {string} options.encoding - File encoding
   * @returns {Promise<string|Buffer>}
   */
  async readFile(filePath, options = { encoding: 'utf8' }) {
    logger.debug(`Reading file: ${filePath}`);
    return fs.readFile(filePath, { encoding: options.encoding });
  },
  
  /**
   * Read a directory
   * @param {string} dirPath - Path to the directory
   * @returns {Promise<string[]>}
   */
  async readDirectory(dirPath) {
    logger.debug(`Reading directory: ${dirPath}`);
    return fs.readdir(dirPath);
  },
  
  /**
   * Delete a file or directory
   * @param {string} path - Path to delete
   * @param {Object} options - Options
   * @param {boolean} options.recursive - Delete directories recursively
   * @param {boolean} options.force - Ignore errors
   * @returns {Promise<void>}
   */
  async delete(path, options = { recursive: true, force: false }) {
    logger.debug(`Deleting: ${path}`);
    
    try {
      // Check if path exists before attempting to delete
      try {
        await fs.access(path);
      } catch (accessError) {
        if (accessError.code === 'ENOENT' && options.force) {
          // Path doesn't exist and force option is true, consider it already deleted
          return true;
        }
        throw accessError;
      }
      
      const isDir = await this.isDirectory(path);
      
      if (isDir) {
        // fs.remove doesn't take options in fs-extra
        await fs.remove(path);
      } else {
        await fs.unlink(path);
      }
      
      return true;
    } catch (error) {
      if (options.force) {
        return true;
      }
      throw new Error(`Failed to delete path: ${error.message}`);
    }
  },

  /**
   * Check if a file is writable
   * @param {string} filePath - Path to the file
   * @returns {Promise<boolean>}
   */
  async isWritable(filePath) {
    try {
      await fs.access(filePath, fs.constants.W_OK);
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Check if a file is readable
   * @param {string} filePath - Path to the file
   * @returns {Promise<boolean>}
   */
  async isReadable(filePath) {
    try {
      await fs.access(filePath, fs.constants.R_OK);
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Create a backup of a file
   * @param {string} filePath - Path to the file
   * @param {Object} options - Options
   * @param {string} options.backupDir - Directory to store backups (defaults to same directory)
   * @param {boolean} options.timestamped - Add timestamp to backup filename
   * @returns {Promise<string>} Path to the backup file
   */
  async createBackup(filePath, options = { backupDir: null, timestamped: true }) {
    logger.debug(`Creating backup of file: ${filePath}`);

    // Check if file exists
    const exists = await this.exists(filePath);
    if (!exists) {
      throw new Error(`Cannot backup non-existent file: ${filePath}`);
    }

    // Determine backup directory
    const backupDir = options.backupDir || path.dirname(filePath);
    await this.createDirectory(backupDir);

    // Generate backup filename
    const filename = path.basename(filePath);
    let backupFilename;
    
    if (options.timestamped) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      backupFilename = `${filename}.${timestamp}.bak`;
    } else {
      backupFilename = `${filename}.bak`;
    }
    
    const backupPath = path.join(backupDir, backupFilename);
    
    // Copy the file to create a backup
    await this.copy(filePath, backupPath);
    
    logger.debug(`Backup created at: ${backupPath}`);
    return backupPath;
  },

  /**
   * Restore a file from backup
   * @param {string} backupPath - Path to the backup file
   * @param {string} targetPath - Path to restore to (defaults to original path)
   * @param {Object} options - Options
   * @param {boolean} options.overwrite - Overwrite existing file
   * @returns {Promise<boolean>} Success status
   */
  async restoreFromBackup(backupPath, targetPath = null, options = { overwrite: true }) {
    logger.debug(`Restoring from backup: ${backupPath}`);

    // Check if backup exists
    const backupExists = await this.exists(backupPath);
    if (!backupExists) {
      throw new Error(`Backup file does not exist: ${backupPath}`);
    }

    // Determine target path if not provided
    if (!targetPath) {
      // Remove timestamp and .bak extension if present
      const backupDir = path.dirname(backupPath);
      const backupFilename = path.basename(backupPath);
      
      // Extract original filename by removing timestamp and .bak
      const originalFilename = backupFilename.replace(/\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.bak$/, '').replace(/\.bak$/, '');
      
      targetPath = path.join(backupDir, originalFilename);
    }

    // Check if target exists and overwrite is not allowed
    if (!options.overwrite) {
      const targetExists = await this.exists(targetPath);
      if (targetExists) {
        throw new Error(`Cannot restore: target file exists and overwrite is not allowed: ${targetPath}`);
      }
    }

    // Copy backup to target
    await this.copy(backupPath, targetPath, { overwrite: options.overwrite });
    
    logger.debug(`Restored to: ${targetPath}`);
    return true;
  },

  /**
   * Find all backups for a file
   * @param {string} filePath - Original file path
   * @param {Object} options - Options
   * @param {string} options.backupDir - Directory to look for backups
   * @returns {Promise<string[]>} Array of backup file paths
   */
  async findBackups(filePath, options = { backupDir: null }) {
    const filename = path.basename(filePath);
    const backupDir = options.backupDir || path.dirname(filePath);
    
    // Check if backup directory exists
    const dirExists = await this.exists(backupDir);
    if (!dirExists) {
      return [];
    }
    
    // Get all files in the backup directory
    const files = await this.readDirectory(backupDir);
    
    // Filter for backup files matching the pattern
    const backupFiles = files.filter(file => {
      // Match both timestamped and non-timestamped backups
      return (file === `${filename}.bak` || 
              file.match(new RegExp(`^${filename}\\.\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}-\\d{3}Z\\.bak$`)));
    });
    
    // Return full paths
    return backupFiles.map(file => path.join(backupDir, file));
  },

  /**
   * Safely write to a configuration file with backup
   * @param {string} filePath - Path to the configuration file
   * @param {string|Object} content - Content to write (object will be stringified as JSON)
   * @param {Object} options - Options
   * @param {boolean} options.createBackup - Create a backup before writing
   * @param {boolean} options.pretty - Pretty-print JSON
   * @param {string} options.encoding - File encoding
   * @returns {Promise<void>}
   */
  async safeWriteConfig(filePath, content, options = { createBackup: true, pretty: true, encoding: 'utf8' }) {
    logger.debug(`Safely writing configuration to: ${filePath}`);
    
    // Create backup if requested and file exists
    let backupPath = null;
    if (options.createBackup && await this.exists(filePath)) {
      backupPath = await this.createBackup(filePath);
      logger.debug(`Created backup at: ${backupPath}`);
    }
    
    try {
      // Convert object to JSON string if needed
      let contentToWrite = content;
      if (typeof content === 'object') {
        contentToWrite = options.pretty 
          ? JSON.stringify(content, null, 2) 
          : JSON.stringify(content);
      }
      
      // Write the file
      await this.writeFile(filePath, contentToWrite, { 
        overwrite: true, 
        encoding: options.encoding 
      });
      
      return { success: true, backupPath };
    } catch (error) {
      logger.error(`Failed to write configuration: ${error.message}`);
      
      // Attempt to restore from backup if available
      if (backupPath) {
        try {
          await this.restoreFromBackup(backupPath, filePath);
          logger.info(`Restored from backup after failed write: ${backupPath}`);
        } catch (restoreError) {
          logger.error(`Failed to restore from backup: ${restoreError.message}`);
        }
      }
      
      throw new Error(`Failed to write configuration: ${error.message}`);
    }
  },

  /**
   * Safely read a configuration file
   * @param {string} filePath - Path to the configuration file
   * @param {Object} options - Options
   * @param {boolean} options.parseJson - Parse content as JSON
   * @param {string} options.encoding - File encoding
   * @returns {Promise<Object|string>} Configuration content
   */
  async safeReadConfig(filePath, options = { parseJson: true, encoding: 'utf8' }) {
    logger.debug(`Safely reading configuration from: ${filePath}`);
    
    // Check if file exists
    const exists = await this.exists(filePath);
    if (!exists) {
      throw new Error(`Configuration file does not exist: ${filePath}`);
    }
    
    // Check if file is readable
    const isReadable = await this.isReadable(filePath);
    if (!isReadable) {
      throw new Error(`Configuration file is not readable: ${filePath}`);
    }
    
    try {
      // Read the file
      const content = await this.readFile(filePath, { encoding: options.encoding });
      
      // Parse as JSON if requested
      if (options.parseJson) {
        try {
          return JSON.parse(content);
        } catch (parseError) {
          throw new Error(`Failed to parse configuration as JSON: ${parseError.message}`);
        }
      }
      
      return content;
    } catch (error) {
      // Check if we have a backup to recover from
      const backups = await this.findBackups(filePath);
      if (backups.length > 0) {
        // Sort backups by creation time (most recent first)
        const sortedBackups = backups.sort().reverse();
        logger.warn(`Found ${backups.length} backups, attempting recovery from most recent: ${sortedBackups[0]}`);
        
        try {
          // Try to read from the most recent backup
          const backupContent = await this.readFile(sortedBackups[0], { encoding: options.encoding });
          
          if (options.parseJson) {
            try {
              return JSON.parse(backupContent);
            } catch (parseError) {
              throw new Error(`Failed to parse backup configuration as JSON: ${parseError.message}`);
            }
          }
          
          return backupContent;
        } catch (backupError) {
          throw new Error(`Failed to read configuration and recovery from backup failed: ${backupError.message}`);
        }
      }
      
      throw new Error(`Failed to read configuration: ${error.message}`);
    }
  },

  /**
   * Merge configuration objects with different strategies
   * @param {Object} baseConfig - Base configuration
   * @param {Object} newConfig - New configuration to merge
   * @param {Object} options - Options
   * @param {string} options.strategy - Merge strategy ('shallow', 'deep', 'overwrite', 'selective')
   * @param {string[]} options.selectiveKeys - Keys to merge when using 'selective' strategy
   * @returns {Object} Merged configuration
   */
  mergeConfigurations(baseConfig, newConfig, options = { strategy: 'deep', selectiveKeys: [] }) {
    logger.debug(`Merging configurations using strategy: ${options.strategy}`);
    
    if (!baseConfig || typeof baseConfig !== 'object') {
      throw new Error('Base configuration must be an object');
    }
    
    if (!newConfig || typeof newConfig !== 'object') {
      throw new Error('New configuration must be an object');
    }
    
    switch (options.strategy) {
      case 'shallow':
        // Simple shallow merge
        return { ...baseConfig, ...newConfig };
        
      case 'deep':
        // Deep recursive merge
        return this._deepMerge(baseConfig, newConfig);
        
      case 'overwrite':
        // Complete overwrite with new config
        return { ...newConfig };
        
      case 'selective':
        // Only merge specified keys
        if (!Array.isArray(options.selectiveKeys) || options.selectiveKeys.length === 0) {
          throw new Error('Selective merge requires a non-empty array of keys');
        }
        
        const result = { ...baseConfig };
        
        for (const key of options.selectiveKeys) {
          if (newConfig.hasOwnProperty(key)) {
            if (typeof newConfig[key] === 'object' && !Array.isArray(newConfig[key]) && 
                typeof baseConfig[key] === 'object' && !Array.isArray(baseConfig[key])) {
              // Deep merge for nested objects
              result[key] = this._deepMerge(baseConfig[key], newConfig[key]);
            } else {
              // Direct assignment for non-objects
              result[key] = newConfig[key];
            }
          }
        }
        
        return result;
        
      default:
        throw new Error(`Unknown merge strategy: ${options.strategy}`);
    }
  },

  /**
   * Deep merge helper function
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   * @private
   */
  _deepMerge(target, source) {
    const output = { ...target };
    
    if (typeof target === 'object' && typeof source === 'object') {
      Object.keys(source).forEach(key => {
        if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
          if (!(key in target)) {
            output[key] = source[key];
          } else {
            output[key] = this._deepMerge(target[key], source[key]);
          }
        } else {
          output[key] = source[key];
        }
      });
    }
    
    return output;
  },

  /**
   * Validate file permissions
   * @param {string} filePath - Path to the file
   * @param {Object} options - Options
   * @param {boolean} options.read - Check read permission
   * @param {boolean} options.write - Check write permission
   * @param {boolean} options.execute - Check execute permission
   * @returns {Promise<Object>} Validation result
   */
  async validatePermissions(filePath, options = { read: true, write: true, execute: false }) {
    logger.debug(`Validating permissions for: ${filePath}`);
    
    const result = {
      path: filePath,
      exists: false,
      permissions: {
        read: false,
        write: false,
        execute: false
      },
      valid: false
    };
    
    // Check if file exists
    result.exists = await this.exists(filePath);
    if (!result.exists) {
      return result;
    }
    
    // Check permissions
    try {
      if (options.read) {
        await fs.access(filePath, fs.constants.R_OK);
        result.permissions.read = true;
      }
      
      if (options.write) {
        await fs.access(filePath, fs.constants.W_OK);
        result.permissions.write = true;
      }
      
      if (options.execute) {
        await fs.access(filePath, fs.constants.X_OK);
        result.permissions.execute = true;
      }
      
      // Determine if permissions are valid based on requirements
      result.valid = 
        (!options.read || result.permissions.read) &&
        (!options.write || result.permissions.write) &&
        (!options.execute || result.permissions.execute);
      
      return result;
    } catch (error) {
      // Permissions check failed
      return result;
    }
  },

  /**
   * Calculate file hash for integrity checking
   * @param {string} filePath - Path to the file
   * @param {Object} options - Options
   * @param {string} options.algorithm - Hash algorithm (md5, sha1, sha256, etc.)
   * @returns {Promise<string>} File hash
   */
  async calculateFileHash(filePath, options = { algorithm: 'sha256' }) {
    logger.debug(`Calculating ${options.algorithm} hash for: ${filePath}`);
    
    // Check if file exists
    const exists = await this.exists(filePath);
    if (!exists) {
      throw new Error(`Cannot calculate hash for non-existent file: ${filePath}`);
    }
    
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash(options.algorithm);
      const stream = fs.createReadStream(filePath);
      
      stream.on('error', err => reject(new Error(`Hash calculation failed: ${err.message}`)));
      
      stream.on('data', chunk => hash.update(chunk));
      
      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });
    });
  },

  /**
   * Verify file integrity using hash
   * @param {string} filePath - Path to the file
   * @param {string} expectedHash - Expected hash value
   * @param {Object} options - Options
   * @param {string} options.algorithm - Hash algorithm (md5, sha1, sha256, etc.)
   * @returns {Promise<boolean>} Whether the file is intact
   */
  async verifyFileIntegrity(filePath, expectedHash, options = { algorithm: 'sha256' }) {
    logger.debug(`Verifying file integrity for: ${filePath}`);
    
    try {
      const actualHash = await this.calculateFileHash(filePath, options);
      return actualHash === expectedHash;
    } catch (error) {
      logger.error(`Integrity verification failed: ${error.message}`);
      return false;
    }
  },

  /**
   * Get temporary directory for MCP operations
   * @returns {Promise<string>} Path to temporary directory
   */
  async getMcpTempDir() {
    const tempBaseDir = os.tmpdir();
    const mcpTempDir = path.join(tempBaseDir, 'mcp-wizard-temp');
    
    // Ensure the directory exists
    await this.createDirectory(mcpTempDir);
    
    return mcpTempDir;
  },

  /**
   * Create a temporary working copy of a configuration file
   * @param {string} configPath - Path to the configuration file
   * @returns {Promise<string>} Path to the temporary copy
   */
  async createTempWorkingCopy(configPath) {
    logger.debug(`Creating temporary working copy of: ${configPath}`);
    
    // Check if source exists
    const exists = await this.exists(configPath);
    if (!exists) {
      throw new Error(`Cannot create working copy of non-existent file: ${configPath}`);
    }
    
    // Get temp directory
    const tempDir = await this.getMcpTempDir();
    
    // Generate unique filename
    const filename = path.basename(configPath);
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const tempPath = path.join(tempDir, `${filename}.${uniqueId}.tmp`);
    
    // Copy the file
    await this.copy(configPath, tempPath);
    
    return tempPath;
  },

  /**
   * Commit changes from temporary working copy to original file
   * @param {string} tempPath - Path to the temporary file
   * @param {string} targetPath - Path to the target file
   * @param {Object} options - Options
   * @param {boolean} options.createBackup - Create a backup of the target file
   * @returns {Promise<Object>} Result with success status and backup path
   */
  async commitWorkingCopy(tempPath, targetPath, options = { createBackup: true }) {
    logger.debug(`Committing working copy from ${tempPath} to ${targetPath}`);
    
    // Check if temp file exists
    const tempExists = await this.exists(tempPath);
    if (!tempExists) {
      throw new Error(`Temporary file does not exist: ${tempPath}`);
    }
    
    let backupPath = null;
    
    // Create backup if requested and target exists
    if (options.createBackup && await this.exists(targetPath)) {
      backupPath = await this.createBackup(targetPath);
    }
    
    try {
      // Copy temp file to target
      await this.copy(tempPath, targetPath, { overwrite: true });
      
      // Clean up temp file
      await this.delete(tempPath, { force: true });
      
      return { success: true, backupPath };
    } catch (error) {
      logger.error(`Failed to commit working copy: ${error.message}`);
      
      // Attempt to restore from backup if available
      if (backupPath) {
        try {
          await this.restoreFromBackup(backupPath, targetPath);
          logger.info(`Restored from backup after failed commit: ${backupPath}`);
        } catch (restoreError) {
          logger.error(`Failed to restore from backup: ${restoreError.message}`);
        }
      }
      
      throw new Error(`Failed to commit working copy: ${error.message}`);
    }
  }
};

module.exports = { fileManager };