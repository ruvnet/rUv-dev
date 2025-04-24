/**
 * File Manager for create-sparc
 */

const fs = require('fs-extra');
const path = require('path');
const { logger, pathUtils } = require('../../utils');

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
  }
};

module.exports = { fileManager };