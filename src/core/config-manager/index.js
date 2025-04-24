/**
 * Configuration Manager for create-sparc
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { logger, pathUtils } = require('../../utils');
const { configSchema } = require('./schema');

/**
 * Configuration Manager
 */
const configManager = {
  /**
   * Load configuration from a file
   * @param {string} configPath - Path to the configuration file
   * @returns {Promise<Object>} Configuration object
   */
  async loadConfig(configPath) {
    logger.debug(`Loading configuration from ${configPath}`);
    
    try {
      const config = await fs.readJson(configPath);
      return config;
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error.message}`);
    }
  },
  
  /**
   * Validate a configuration object against the schema
   * @param {Object} config - Configuration object to validate
   * @returns {Object} Validation result
   */
  validateConfig(config) {
    logger.debug('Validating configuration');
    
    const result = {
      valid: true,
      errors: []
    };
    
    // Check required fields
    for (const field of configSchema.required) {
      if (config[field] === undefined) {
        result.valid = false;
        result.errors.push({
          property: field,
          message: 'Required field is missing',
          value: undefined
        });
      }
    }
    
    // Validate properties
    for (const [key, value] of Object.entries(config)) {
      const propertySchema = configSchema.properties[key];
      
      // Skip if property is not in schema
      if (!propertySchema) continue;
      
      // Validate property type
      if (propertySchema.type && !this._validateType(value, propertySchema.type)) {
        result.valid = false;
        result.errors.push({
          property: key,
          message: `Expected type ${propertySchema.type}, got ${typeof value}`,
          value
        });
      }
      
      // Validate enum values
      if (propertySchema.enum && !propertySchema.enum.includes(value)) {
        result.valid = false;
        result.errors.push({
          property: key,
          message: `Value must be one of: ${propertySchema.enum.join(', ')}`,
          value
        });
      }
      
      // Validate pattern
      if (propertySchema.pattern && typeof value === 'string') {
        const regex = new RegExp(propertySchema.pattern);
        if (!regex.test(value)) {
          result.valid = false;
          result.errors.push({
            property: key,
            message: `Value does not match pattern: ${propertySchema.pattern}`,
            value
          });
        }
      }
    }
    
    return result;
  },
  
  /**
   * Merge configuration objects
   * @param {Object} base - Base configuration
   * @param {Object} override - Override configuration
   * @returns {Object} Merged configuration
   */
  mergeConfig(base, override) {
    logger.debug('Merging configurations');
    
    // Create a deep copy of the base configuration
    const result = JSON.parse(JSON.stringify(base));
    
    // Merge override properties
    for (const [key, value] of Object.entries(override)) {
      // If both values are objects, merge recursively
      if (
        typeof value === 'object' && 
        value !== null && 
        !Array.isArray(value) && 
        typeof result[key] === 'object' && 
        result[key] !== null && 
        !Array.isArray(result[key])
      ) {
        result[key] = this.mergeConfig(result[key], value);
      } 
      // Otherwise, override the value
      else {
        result[key] = value;
      }
    }
    
    return result;
  },
  
  /**
   * Write configuration to a file
   * @param {Object} config - Configuration object
   * @param {string} configPath - Path to write the configuration
   * @returns {Promise<void>}
   */
  async writeConfig(config, configPath) {
    logger.debug(`Writing configuration to ${configPath}`);
    
    try {
      await fs.writeJson(configPath, config, { spaces: 2 });
    } catch (error) {
      throw new Error(`Failed to write configuration: ${error.message}`);
    }
  },
  
  /**
   * Get default configuration
   * @returns {Object} Default configuration
   */
  getDefaultConfig() {
    return {
      projectName: '',
      projectPath: '',
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
        init: true,
        initialCommit: true
      },
      verbose: false
    };
  },
  
  /**
   * Find project configuration in current directory or parent directories
   * @returns {Promise<Object|null>} Project configuration or null if not found
   */
  async findProjectConfig() {
    logger.debug('Finding project configuration');
    
    // Start from current directory
    let currentDir = process.cwd();
    const homeDir = os.homedir();
    
    // Look for package.json with SPARC configuration
    while (currentDir !== homeDir && currentDir !== path.parse(currentDir).root) {
      const packageJsonPath = path.join(currentDir, 'package.json');
      
      if (await fs.pathExists(packageJsonPath)) {
        try {
          const packageJson = await fs.readJson(packageJsonPath);
          
          // Check if this is a SPARC project
          if (packageJson.sparc) {
            return packageJson.sparc;
          }
          
          // Check for .roo directory and .roomodes file
          const rooDir = path.join(currentDir, '.roo');
          const roomodesFile = path.join(currentDir, '.roomodes');
          
          if (await fs.pathExists(rooDir) && await fs.pathExists(roomodesFile)) {
            // This looks like a SPARC project, create a default config
            return {
              projectName: packageJson.name,
              projectPath: currentDir,
              symlink: {
                enabled: false,
                paths: ['.roo', '.roomodes']
              }
            };
          }
        } catch (error) {
          // Ignore errors reading package.json
        }
      }
      
      // Move up to parent directory
      currentDir = path.dirname(currentDir);
    }
    
    // No project configuration found
    return null;
  },
  
  /**
   * Validate a value against a type
   * @param {any} value - Value to validate
   * @param {string} type - Expected type
   * @returns {boolean} Whether the value matches the type
   * @private
   */
  _validateType(value, type) {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      default:
        return true;
    }
  }
};

module.exports = { configManager };