/**
 * MCP Configuration Wizard
 * Manages the creation and configuration of MCP servers
 */

const path = require('path');
const { logger } = require('../../utils');
const { configGenerator } = require('./config-generator');
const { mcpSecurity } = require('./security');

/**
 * MCP Wizard
 * Orchestrates the configuration process for MCP servers
 */
const mcpWizard = {
  /**
   * Configure MCP servers
   * @param {Array} servers - Array of server metadata and parameters
   * @param {Object} options - Configuration options
   * @returns {Promise<Object>} Configuration result
   */
  async configureServers(servers, options = {}) {
    logger.debug('Configuring MCP servers');
    
    try {
      // Set default options
      const defaultOptions = {
        projectPath: process.cwd(),
        mcpConfigPath: '.roo/mcp.json',
        roomodesPath: '.roomodes',
        mergeExisting: true,
        performSecurityAudit: true,
        autoSecureConfig: false
      };
      
      const config = { ...defaultOptions, ...options };
      
      // Resolve paths
      const mcpConfigFullPath = path.resolve(config.projectPath, config.mcpConfigPath);
      const roomodesFullPath = path.resolve(config.projectPath, config.roomodesPath);
      
      // Generate MCP configuration
      const mcpConfig = configGenerator.generateMcpConfig(servers);
      
      // Validate MCP configuration
      const mcpValidation = configGenerator.validateMcpConfig(mcpConfig);
      if (!mcpValidation.valid) {
        throw new Error(`Invalid MCP configuration: ${JSON.stringify(mcpValidation.errors)}`);
      }
      
      // Perform security audit if enabled
      let securityAuditResults = null;
      let securedConfig = mcpConfig;
      
      if (config.performSecurityAudit) {
        securityAuditResults = mcpSecurity.auditConfiguration(mcpConfig);
        
        // Log security issues
        if (!securityAuditResults.secure) {
          logger.warn(`Security issues detected in MCP configuration: ${securityAuditResults.issues.length} issues found`);
          
          // Log critical issues
          const criticalIssues = securityAuditResults.issues.filter(issue => issue.severity === 'critical');
          if (criticalIssues.length > 0) {
            logger.error(`Critical security issues: ${criticalIssues.length}`);
            criticalIssues.forEach(issue => {
              logger.error(`- ${issue.message} (${issue.location})`);
            });
          }
          
          // Auto-secure configuration if enabled
          if (config.autoSecureConfig) {
            logger.info('Auto-securing MCP configuration');
            const securityResult = mcpSecurity.secureConfiguration(mcpConfig);
            securedConfig = securityResult.securedConfig;
            
            logger.info(`Applied ${securityResult.appliedFixes.length} security fixes`);
            securityResult.appliedFixes.forEach(fix => {
              logger.info(`- ${fix.message}`);
            });
          }
        } else {
          logger.info('MCP configuration passed security audit');
        }
      }
      
      // Generate roomode definitions
      const roomodeDefinitions = configGenerator.generateRoomodeDefinitions(servers);
      
      // Validate roomode definitions
      for (const roomode of roomodeDefinitions) {
        const roomodeValidation = configGenerator.validateRoomodeDefinition(roomode);
        if (!roomodeValidation.valid) {
          throw new Error(`Invalid roomode definition for ${roomode.slug}: ${JSON.stringify(roomodeValidation.errors)}`);
        }
      }
      
      // Handle existing configurations if merging is enabled
      if (config.mergeExisting) {
        // Read existing MCP configuration
        const existingMcpConfig = await configGenerator.readMcpConfig(mcpConfigFullPath);
        
        // Merge with existing configuration
        const mergedMcpConfig = configGenerator.mergeMcpConfig(securedConfig, existingMcpConfig);
        
        // Read existing roomodes
        const existingRoomodes = await configGenerator.readRoomodes(roomodesFullPath);
        
        // Merge with existing roomodes
        const mergedRoomodes = configGenerator.mergeRoomodes(roomodeDefinitions, existingRoomodes);
        
        // Write merged configurations
        await configGenerator.writeMcpConfig(mergedMcpConfig, mcpConfigFullPath);
        await configGenerator.writeRoomodes(mergedRoomodes, roomodesFullPath);
        
        // Calculate integrity hash for the configuration
        const integrityHash = mcpSecurity.calculateIntegrityHash(mergedMcpConfig);
        
        return {
          success: true,
          mcpConfig: mergedMcpConfig,
          roomodes: mergedRoomodes,
          mcpConfigPath: mcpConfigFullPath,
          roomodesPath: roomodesFullPath,
          securityAudit: securityAuditResults,
          integrityHash
        };
      } else {
        // Write new configurations without merging
        await configGenerator.writeMcpConfig(securedConfig, mcpConfigFullPath);
        
        // Create empty roomodes object if needed
        const newRoomodes = { customModes: roomodeDefinitions };
        await configGenerator.writeRoomodes(newRoomodes, roomodesFullPath);
        
        // Calculate integrity hash for the configuration
        const integrityHash = mcpSecurity.calculateIntegrityHash(securedConfig);
        
        return {
          success: true,
          mcpConfig: securedConfig,
          roomodes: newRoomodes,
          mcpConfigPath: mcpConfigFullPath,
          roomodesPath: roomodesFullPath,
          securityAudit: securityAuditResults,
          integrityHash
        };
      }
    } catch (error) {
      logger.error(`Failed to configure MCP servers: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Add a server to existing configuration
   * @param {Object} serverMetadata - Server metadata
   * @param {Object} serverParams - Server parameters
   * @param {Object} options - Configuration options
   * @returns {Promise<Object>} Configuration result
   */
  async addServer(serverMetadata, serverParams = {}, options = {}) {
    logger.debug(`Adding server ${serverMetadata.id} to configuration`);
    
    return this.configureServers([{ metadata: serverMetadata, params: serverParams }], options);
  },
  
  /**
   * Remove a server from configuration
   * @param {string} serverId - Server ID to remove
   * @param {Object} options - Configuration options
   * @returns {Promise<Object>} Configuration result
   */
  async removeServer(serverId, options = {}) {
    logger.debug(`Removing server ${serverId} from configuration`);
    
    try {
      // Set default options
      const defaultOptions = {
        projectPath: process.cwd(),
        mcpConfigPath: '.roo/mcp.json',
        roomodesPath: '.roomodes',
      };
      
      const config = { ...defaultOptions, ...options };
      
      // Resolve paths
      const mcpConfigFullPath = path.resolve(config.projectPath, config.mcpConfigPath);
      const roomodesFullPath = path.resolve(config.projectPath, config.roomodesPath);
      
      // Read existing MCP configuration
      const existingMcpConfig = await configGenerator.readMcpConfig(mcpConfigFullPath);
      
      // Check if server exists
      if (!existingMcpConfig.mcpServers || !existingMcpConfig.mcpServers[serverId]) {
        return {
          success: false,
          error: `Server ${serverId} not found in configuration`
        };
      }
      
      // Remove server from configuration
      const newMcpConfig = JSON.parse(JSON.stringify(existingMcpConfig));
      delete newMcpConfig.mcpServers[serverId];
      
      // Read existing roomodes
      const existingRoomodes = await configGenerator.readRoomodes(roomodesFullPath);
      
      // Remove server roomode if it exists
      const newRoomodes = JSON.parse(JSON.stringify(existingRoomodes));
      if (newRoomodes.customModes) {
        const roomodeIndex = newRoomodes.customModes.findIndex(mode => mode.slug === `mcp-${serverId}`);
        if (roomodeIndex >= 0) {
          newRoomodes.customModes.splice(roomodeIndex, 1);
        }
      }
      
      // Write updated configurations
      await configGenerator.writeMcpConfig(newMcpConfig, mcpConfigFullPath);
      await configGenerator.writeRoomodes(newRoomodes, roomodesFullPath);
      
      return {
        success: true,
        mcpConfig: newMcpConfig,
        roomodes: newRoomodes,
        mcpConfigPath: mcpConfigFullPath,
        roomodesPath: roomodesFullPath
      };
    } catch (error) {
      logger.error(`Failed to remove server ${serverId}: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Update server configuration
   * @param {string} serverId - Server ID to update
   * @param {Object} serverParams - New server parameters
   * @param {Object} options - Configuration options
   * @returns {Promise<Object>} Configuration result
   */
  async updateServer(serverId, serverParams = {}, options = {}) {
    logger.debug(`Updating server ${serverId} configuration`);
    
    try {
      // Set default options
      const defaultOptions = {
        projectPath: process.cwd(),
        mcpConfigPath: '.roo/mcp.json',
        roomodesPath: '.roomodes',
      };
      
      const config = { ...defaultOptions, ...options };
      
      // Resolve paths
      const mcpConfigFullPath = path.resolve(config.projectPath, config.mcpConfigPath);
      
      // Read existing MCP configuration
      const existingMcpConfig = await configGenerator.readMcpConfig(mcpConfigFullPath);
      
      // Check if server exists
      if (!existingMcpConfig.mcpServers || !existingMcpConfig.mcpServers[serverId]) {
        return {
          success: false,
          error: `Server ${serverId} not found in configuration`
        };
      }
      
      // Get existing server configuration
      const existingServerConfig = existingMcpConfig.mcpServers[serverId];
      
      // Create server metadata from existing configuration
      const serverMetadata = {
        id: serverId,
        name: serverId,
        command: existingServerConfig.command,
        args: existingServerConfig.args.slice(0, 2), // Base command args
        // Use permissions from serverParams if provided, otherwise use existing permissions
        recommendedPermissions: serverParams.permissions || existingServerConfig.alwaysAllow
      };
      
      // Add server with updated parameters
      return this.addServer(serverMetadata, serverParams, options);
    } catch (error) {
      logger.error(`Failed to update server ${serverId}: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * List configured servers
   * @param {Object} options - Configuration options
   * @returns {Promise<Object>} List of configured servers
   */
  async listServers(options = {}) {
    logger.debug('Listing configured servers');
    
    try {
      // Set default options
      const defaultOptions = {
        projectPath: process.cwd(),
        mcpConfigPath: '.roo/mcp.json',
      };
      
      const config = { ...defaultOptions, ...options };
      
      // Resolve path
      const mcpConfigFullPath = path.resolve(config.projectPath, config.mcpConfigPath);
      
      // Read existing MCP configuration
      const existingMcpConfig = await configGenerator.readMcpConfig(mcpConfigFullPath);
      
      // Extract server information
      const servers = {};
      if (existingMcpConfig.mcpServers) {
        for (const [serverId, serverConfig] of Object.entries(existingMcpConfig.mcpServers)) {
          servers[serverId] = {
            command: serverConfig.command,
            args: serverConfig.args,
            permissions: serverConfig.alwaysAllow || []
          };
        }
      }
      
      return {
        success: true,
        servers
      };
    } catch (error) {
      logger.error(`Failed to list servers: ${error.message}`);
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
      const mcpConfigFullPath = path.resolve(config.projectPath, config.mcpConfigPath);
      
      // Read existing MCP configuration
      const mcpConfig = await configGenerator.readMcpConfig(mcpConfigFullPath);
      
      // Validate environment variable references
      const validationResults = mcpSecurity.validateEnvVarReferences(mcpConfig);
      
      // Log validation results
      if (!validationResults.valid) {
        logger.warn(`Missing environment variables: ${validationResults.missingVariables.join(', ')}`);
      } else {
        logger.info('All environment variable references are valid');
      }
      
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
      const mcpConfigFullPath = path.resolve(config.projectPath, config.mcpConfigPath);
      
      // Read existing MCP configuration
      const mcpConfig = await configGenerator.readMcpConfig(mcpConfigFullPath);
      
      // Perform security audit
      const auditResults = mcpSecurity.auditConfiguration(mcpConfig);
      
      // Auto-fix security issues if enabled
      let fixResults = null;
      if (config.autoFix && !auditResults.secure) {
        logger.info('Auto-fixing security issues');
        
        // Secure the configuration
        const securityResult = mcpSecurity.secureConfiguration(mcpConfig);
        
        // Write the secured configuration
        await configGenerator.writeMcpConfig(securityResult.securedConfig, mcpConfigFullPath);
        
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
  }
};

// Create exports object first
const moduleExports = { mcpWizard, configGenerator, mcpSecurity };

// Import wizardCore after defining exports to avoid circular dependency
const { wizardCore } = require('./wizard-core');

// Add wizardCore to exports
moduleExports.wizardCore = wizardCore;

// Export all modules
module.exports = moduleExports;