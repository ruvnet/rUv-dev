/**
 * Shared utilities for create-sparc
 */

const chalk = require('chalk');

/**
 * Logger utility for consistent logging
 */
const logger = {
  _level: 'info', // Default level
  
  /**
   * Set the logging level
   * @param {string} level - Logging level (debug, verbose, info, warn, error)
   */
  setLevel(level) {
    this._level = level;
  },
  
  /**
   * Get the current logging level
   * @returns {string} Current logging level
   */
  getLevel() {
    return this._level;
  },
  
  /**
   * Log a debug message (only in debug mode)
   * @param {string} message - Message to log
   */
  debug(message) {
    if (this._level === 'debug') {
      console.log(chalk.gray(`[debug] ${message}`));
    }
  },
  
  /**
   * Log a verbose message (only in verbose or debug mode)
   * @param {string} message - Message to log
   */
  verbose(message) {
    if (this._level === 'debug' || this._level === 'verbose') {
      console.log(chalk.blue(`[verbose] ${message}`));
    }
  },
  
  /**
   * Log an info message
   * @param {string} message - Message to log
   */
  info(message) {
    console.log(chalk.white(message));
  },
  
  /**
   * Log a success message
   * @param {string} message - Message to log
   */
  success(message) {
    console.log(chalk.green(`✓ ${message}`));
  },
  
  /**
   * Log a warning message
   * @param {string} message - Message to log
   */
  warn(message) {
    console.log(chalk.yellow(`⚠ ${message}`));
  },
  
  /**
   * Log an error message
   * @param {string} message - Message to log
   */
  error(message) {
    console.error(chalk.red(`✖ ${message}`));
  }
};

/**
 * Error handling utilities
 */
const errorHandler = {
  /**
   * Categorize an error
   * @param {Error} error - Error to categorize
   * @returns {Object} Error category information
   */
  categorize(error) {
    // File system errors
    if (error.code === 'ENOENT') {
      return {
        type: 'FILE_NOT_FOUND',
        recoverable: false,
        message: 'File or directory not found'
      };
    }
    
    if (error.code === 'EACCES') {
      return {
        type: 'PERMISSION_DENIED',
        recoverable: false,
        message: 'Permission denied'
      };
    }
    
    if (error.code === 'EEXIST') {
      return {
        type: 'FILE_EXISTS',
        recoverable: true,
        message: 'File or directory already exists'
      };
    }
    
    // Network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      return {
        type: 'NETWORK_ERROR',
        recoverable: true,
        message: 'Network error'
      };
    }
    
    // Default
    return {
      type: 'UNKNOWN_ERROR',
      recoverable: false,
      message: error.message
    };
  },
  
  /**
   * Format an error for display
   * @param {Error} error - Error to format
   * @param {boolean} verbose - Whether to include verbose details
   * @returns {string} Formatted error message
   */
  format(error, verbose = false) {
    const category = this.categorize(error);
    let message = `${category.message}: ${error.message}`;
    
    if (verbose && error.stack) {
      message += `\n${error.stack}`;
    }
    
    return message;
  }
};

/**
 * File system utilities
 */
const fsUtils = {
  /**
   * Check if a path exists
   * @param {string} path - Path to check
   * @returns {Promise<boolean>} Whether the path exists
   */
  async exists(path) {
    const fs = require('fs-extra');
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
   * @returns {Promise<boolean>} Whether the path is a directory
   */
  async isDirectory(path) {
    const fs = require('fs-extra');
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
   * @returns {Promise<boolean>} Whether the path is a file
   */
  async isFile(path) {
    const fs = require('fs-extra');
    try {
      const stats = await fs.stat(path);
      return stats.isFile();
    } catch (error) {
      return false;
    }
  }
};

/**
 * Path utilities
 */
const pathUtils = {
  /**
   * Resolve a path relative to the current working directory
   * @param {...string} paths - Path segments to resolve
   * @returns {string} Resolved path
   */
  resolve(...paths) {
    const path = require('path');
    return path.resolve(process.cwd(), ...paths);
  },
  
  /**
   * Join path segments
   * @param {...string} paths - Path segments to join
   * @returns {string} Joined path
   */
  join(...paths) {
    const path = require('path');
    return path.join(...paths);
  }
};

module.exports = {
  logger,
  errorHandler,
  fsUtils,
  pathUtils
};