/**
 * MCP Wizard Core
 * 
 * Orchestrates the entire MCP Configuration Wizard process by integrating
 * all components: Registry Client, Configuration Generator, CLI Interface, and File Manager.
 */

const path = require('path');
const { RegistryClient } = require('../registry-client');
// Import directly from config-generator to avoid circular dependency
const { configGenerator } = require('./config-generator');
const { fileManager } = require('../file-manager');
const { logger } = require('../../utils');
const { mcpSecurity } = require('./security');

/**
 * MCP Wizard Core
 * Orchestrates the entire configuration process
 */
const wizardCore = {
  /**
   * Initialize the wizard core
   * @param {Object} options - Initialization options
   * @returns {Promise<Object>} Initialization result
   */
  async initialize(options = {}) {
    logger.debug('Initializing MCP Wizard Core');
    
    try {
      // Set default options
      const defaultOptions = {
        projectPath: process.cwd(),
        mcpConfigPath: '.roo/mcp.json',
        roomodesPath: '.roomodes',
        registryUrl: 'https://registry.example.com/api/v1/mcp',
        cacheEnabled: true
      };
      
      this.options = { ...defaultOptions, ...options };
      
      // Initialize Registry Client
      this.registryClient = new RegistryClient({
        baseUrl: this.options.registryUrl,
        cacheEnabled: this.options.cacheEnabled
      });
      
      // Ensure required directories exist
      const mcpConfigDir = path.dirname(path.resolve(this.options.projectPath, this.options.mcpConfigPath));
      await fileManager.createDirectory(mcpConfigDir);
      
      return { success: true };
    } catch (error) {
      logger.error(`Failed to initialize MCP Wizard Core: ${error.message}`);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Discover available MCP servers from registry
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} List of available servers
   */
  async discoverServers(params = {}) {
    logger.debug('Discovering available MCP servers');
    
    try {
      // Get servers from registry
      const servers = await this.registryClient.getServers(params);
      
      return {
        success: true,
        servers: servers.items || [],
        pagination: servers.pagination || {}
      };
    } catch (error) {
      logger.error(`Failed to discover servers: ${error.message}`);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Get detailed information about a specific server
   * @param {string} serverId - Server ID
   * @returns {Promise<Object>} Server details
   */
  async getServerDetails(serverId) {
    logger.debug(`Getting details for server: ${serverId}`);
    
    try {
      // Get server details from registry
      const serverDetails = await this.registryClient.getServerDetails(serverId);
      
      return {
        success: true,
        server: serverDetails
      };
    } catch (error) {
      logger.error(`Failed to get server details: ${error.message}`);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Configure a server with user parameters
   * @param {string} serverId - Server ID
   * @param {Object} userParams - User-provided parameters
   * @returns {Promise<Object>} Configuration result
   */
  async configureServer(serverId, userParams = {}) {
    logger.debug(`Configuring server: ${serverId}`);
    
    try {
      // Get server details from registry
      const serverDetailsResult = await this.getServerDetails(serverId);
      
      if (!serverDetailsResult.success) {
        return serverDetailsResult;
      }
      
      const serverMetadata = serverDetailsResult.server;
      
      // Configure the server using MCP Wizard
      // Access mcpWizard through the module exports to avoid circular dependency
      const { mcpWizard } = require('./index');
      const result = await mcpWizard.addServer(serverMetadata, userParams, {
        projectPath: this.options.projectPath,
        mcpConfigPath: this.options.mcpConfigPath,
        roomodesPath: this.options.roomodesPath
      });
      
      return result;
    } catch (error) {
      logger.error(`Failed to configure server: ${error.message}`);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Update server configuration
   * @param {string} serverId - Server ID
   * @param {Object} userParams - Updated parameters
   * @returns {Promise<Object>} Update result
   */
  async updateServerConfig(serverId, userParams = {}) {
    logger.debug(`Updating server configuration: ${serverId}`);
    
    try {
      // Update server using MCP Wizard
      // Access mcpWizard through the module exports to avoid circular dependency
      const { mcpWizard } = require('./index');
      const result = await mcpWizard.updateServer(serverId, userParams, {
        projectPath: this.options.projectPath,
        mcpConfigPath: this.options.mcpConfigPath,
        roomodesPath: this.options.roomodesPath
      });
      
      return result;
    } catch (error) {
      logger.error(`Failed to update server configuration: ${error.message}`);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Remove a configured server
   * @param {string} serverId - Server ID
   * @returns {Promise<Object>} Removal result
   */
  async removeServer(serverId) {
    logger.debug(`Removing server: ${serverId}`);
    
    try {
      // Remove server using MCP Wizard
      // Access mcpWizard through the module exports to avoid circular dependency
      const { mcpWizard } = require('./index');
      const result = await mcpWizard.removeServer(serverId, {
        projectPath: this.options.projectPath,
        mcpConfigPath: this.options.mcpConfigPath,
        roomodesPath: this.options.roomodesPath
      });
      
      return result;
    } catch (error) {
      logger.error(`Failed to remove server: ${error.message}`);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * List all configured servers
   * @returns {Promise<Object>} List of configured servers
   */
  async listConfiguredServers() {
    logger.debug('Listing configured servers');
    
    try {
      // List servers using MCP Wizard
      // Access mcpWizard through the module exports to avoid circular dependency
      const { mcpWizard } = require('./index');
      const result = await mcpWizard.listServers({
        projectPath: this.options.projectPath,
        mcpConfigPath: this.options.mcpConfigPath
      });
      
      return result;
    } catch (error) {
      logger.error(`Failed to list configured servers: ${error.message}`);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Validate MCP configuration
   * @returns {Promise<Object>} Validation result
   */
  async validateConfiguration() {
    logger.debug('Validating MCP configuration');
    
    try {
      // Read current configuration
      const mcpConfigPath = path.resolve(this.options.projectPath, this.options.mcpConfigPath);
      const mcpConfig = await fileManager.safeReadConfig(mcpConfigPath, { parseJson: true });
      
      // Validate configuration using configGenerator imported at the top
      const validationResult = configGenerator.validateMcpConfig(mcpConfig);
      
      return {
        success: validationResult.valid,
        errors: validationResult.errors,
        config: mcpConfig
      };
    } catch (error) {
      logger.error(`Failed to validate configuration: ${error.message}`);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Create a backup of the current configuration
   * @returns {Promise<Object>} Backup result
   */
  async backupConfiguration() {
    logger.debug('Creating backup of MCP configuration');
    
    try {
      const mcpConfigPath = path.resolve(this.options.projectPath, this.options.mcpConfigPath);
      const roomodesPath = path.resolve(this.options.projectPath, this.options.roomodesPath);
      
      // Check if files exist before backing up
      const mcpConfigExists = await fileManager.exists(mcpConfigPath);
      const roomodesExists = await fileManager.exists(roomodesPath);
      
      const backupPaths = {};
      
      if (mcpConfigExists) {
        backupPaths.mcpConfig = await fileManager.createBackup(mcpConfigPath);
      }
      
      if (roomodesExists) {
        backupPaths.roomodes = await fileManager.createBackup(roomodesPath);
      }
      
      return {
        success: true,
        backupPaths
      };
    } catch (error) {
      logger.error(`Failed to backup configuration: ${error.message}`);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Restore configuration from backup
   * @param {Object} backupPaths - Paths to backup files
   * @returns {Promise<Object>} Restore result
   */
  async restoreConfiguration(backupPaths) {
    logger.debug('Restoring MCP configuration from backup');
    
    try {
      const results = {};
      
      if (backupPaths.mcpConfig) {
        const mcpConfigPath = path.resolve(this.options.projectPath, this.options.mcpConfigPath);
        results.mcpConfig = await fileManager.restoreFromBackup(backupPaths.mcpConfig, mcpConfigPath);
      }
      
      if (backupPaths.roomodes) {
        const roomodesPath = path.resolve(this.options.projectPath, this.options.roomodesPath);
        results.roomodes = await fileManager.restoreFromBackup(backupPaths.roomodes, roomodesPath);
      }
      
      return {
        success: true,
        results
      };
    } catch (error) {
      logger.error(`Failed to restore configuration: ${error.message}`);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Perform a complete configuration workflow
   * @param {string} serverId - Server ID to configure
   * @param {Object} userParams - User parameters
   * @returns {Promise<Object>} Configuration result
   */
  async configureServerWorkflow(serverId, userParams = {}) {
    logger.debug(`Starting configuration workflow for server: ${serverId}`);
    
    try {
      // Step 1: Create backup of current configuration
      const backupResult = await this.backupConfiguration();
      
      if (!backupResult.success) {
        return backupResult;
      }
      
      // Step 2: Configure the server
      const configResult = await this.configureServer(serverId, userParams);
      
      if (!configResult.success) {
        // Restore from backup if configuration fails
        logger.warn(`Configuration failed, restoring from backup`);
        await this.restoreConfiguration(backupResult.backupPaths);
        return configResult;
      }
      
      // Step 3: Validate the new configuration
      const validationResult = await this.validateConfiguration();
      
      if (!validationResult.success) {
        // Restore from backup if validation fails
        logger.warn(`Validation failed, restoring from backup`);
        await this.restoreConfiguration(backupResult.backupPaths);
        // Make sure we return a failed result
        return {
          success: false,
          error: validationResult.errors ?
            `Validation failed: ${JSON.stringify(validationResult.errors)}` :
            validationResult.error || 'Unknown validation error',
          validationErrors: validationResult.errors
        };
      }
      
      return {
        success: true,
        serverId,
        backupPaths: backupResult.backupPaths,
        mcpConfig: configResult.mcpConfig,
        roomodes: configResult.roomodes
      };
    } catch (error) {
      logger.error(`Configuration workflow failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Perform security audit on MCP configuration
   * @param {Object} options - Configuration options
   * @returns {Promise<Object>} Audit results
   */
  async auditSecurity(options = {}) {
    logger.debug('Performing security audit on MCP configuration');
    
    try {
      // Set default options
      const defaultOptions = {
        projectPath: process.cwd(),
        mcpConfigPath: '.roo/mcp.json',
        autoFix: false
      };
      
      const config = { ...defaultOptions, ...options };
      
      // Resolve path
      const mcpConfigPath = path.resolve(this.options?.projectPath || config.projectPath,
                                        this.options?.mcpConfigPath || config.mcpConfigPath);
      
      // Read existing MCP configuration
      const mcpConfig = await fileManager.safeReadConfig(mcpConfigPath, { parseJson: true });
      
      // Perform security audit
      const auditResults = mcpSecurity.auditConfiguration(mcpConfig);
      
      // Auto-fix security issues if enabled
      let fixResults = null;
      if (config.autoFix && !auditResults.secure) {
        logger.info('Auto-fixing security issues');
        
        // Secure the configuration
        const securityResult = mcpSecurity.secureConfiguration(mcpConfig);
        
        // Write the secured configuration
        await configGenerator.writeMcpConfig(securityResult.securedConfig, mcpConfigPath);
        
        fixResults = {
          appliedFixes: securityResult.appliedFixes,
          fixedConfig: securityResult.securedConfig
        };
        
        logger.info(`Applied ${securityResult.appliedFixes.length} security fixes`);
      }
      
      return {
        success: true,
        secure: auditResults.secure,
        issues: auditResults.issues,
        recommendations: auditResults.recommendations,
        fixes: fixResults
      };
    } catch (error) {
      logger.error(`Failed to perform security audit: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Validate environment variable references in MCP configuration
   * @param {Object} options - Configuration options
   * @returns {Promise<Object>} Validation results
   */
  async validateEnvVarReferences(options = {}) {
    logger.debug('Validating environment variable references in MCP configuration');
    
    try {
      // Set default options
      const defaultOptions = {
        projectPath: process.cwd(),
        mcpConfigPath: '.roo/mcp.json'
      };
      
      const config = { ...defaultOptions, ...options };
      
      // Resolve path
      const mcpConfigPath = path.resolve(this.options?.projectPath || config.projectPath,
                                        this.options?.mcpConfigPath || config.mcpConfigPath);
      
      // Read existing MCP configuration
      const mcpConfig = await fileManager.safeReadConfig(mcpConfigPath, { parseJson: true });
      
      // Validate environment variable references
      const validationResults = mcpSecurity.validateEnvVarReferences(mcpConfig);
      
      return {
        success: true,
        valid: validationResults.valid,
        missingVariables: validationResults.missingVariables,
        references: validationResults.references
      };
    } catch (error) {
      logger.error(`Failed to validate environment variable references: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

module.exports = { wizardCore };