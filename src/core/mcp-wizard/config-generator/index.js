/**
 * MCP Configuration Generator
 * Creates MCP.json configurations and roomode definitions
 */

const fs = require('fs-extra');
const path = require('path');
const { logger } = require('../../../utils');
const { mcpConfigSchema, mcpRoomodeSchema } = require('./schema');
const { serverTemplates, roomodeTemplates } = require('./templates');

/**
 * Configuration Generator for MCP
 */
const configGenerator = {
  /**
   * Generate MCP configuration for a server
   * @param {Object} serverMetadata - Server metadata from registry
   * @param {Object} userParams - User-provided parameters
   * @returns {Object} Generated configuration
   */
  generateServerConfig(serverMetadata, userParams = {}) {
    logger.debug(`Generating configuration for ${serverMetadata.id}`);
    
    // Select template based on server tags
    const template = this._selectServerTemplate(serverMetadata);
    
    // Create base configuration from template
    const config = JSON.parse(JSON.stringify(template));
    
    // Replace placeholders in args
    config.args = config.args.map(arg => {
      if (arg.includes('{organization}')) {
        const orgId = serverMetadata.organization || 'mcp';
        return arg.replace('{organization}', orgId);
      }
      if (arg.includes('{package}')) {
        const packageId = serverMetadata.package || `mcp-server-${serverMetadata.id}`;
        return arg.replace('{package}', packageId);
      }
      return arg;
    });
    
    // Add server-specific args
    if (serverMetadata.args && Array.isArray(serverMetadata.args)) {
      config.args = [...config.args, ...serverMetadata.args];
    }
    
    // Add user parameters as args
    for (const [key, value] of Object.entries(userParams)) {
      // Skip null or undefined values
      if (value === null || value === undefined) continue;
      
      // Handle secret parameters with environment variable references
      if (this._isSecretParam(key, serverMetadata)) {
        const envVar = this._getEnvVarName(key, serverMetadata);
        config.args.push(`--${key}`);
        config.args.push(`\${env:${envVar}}`);
      } else {
        config.args.push(`--${key}`);
        config.args.push(value.toString());
      }
    }
    
    // Add recommended permissions
    if (serverMetadata.recommendedPermissions && Array.isArray(serverMetadata.recommendedPermissions)) {
      config.alwaysAllow = [...new Set([...config.alwaysAllow, ...serverMetadata.recommendedPermissions])];
    }
    
    return config;
  },
  
  /**
   * Generate MCP.json configuration for multiple servers
   * @param {Array} servers - Array of server metadata and parameters
   * @returns {Object} Complete MCP.json configuration
   */
  generateMcpConfig(servers) {
    logger.debug('Generating MCP.json configuration');
    
    const mcpConfig = {
      mcpServers: {}
    };
    
    for (const server of servers) {
      const { metadata, params } = server;
      mcpConfig.mcpServers[metadata.id] = this.generateServerConfig(metadata, params);
    }
    
    return mcpConfig;
  },
  
  /**
   * Generate roomode definition for an MCP server
   * @param {Object} serverMetadata - Server metadata from registry
   * @returns {Object} Roomode definition
   */
  generateRoomodeDefinition(serverMetadata) {
    logger.debug(`Generating roomode definition for ${serverMetadata.id}`);
    
    // Select template based on server tags
    const template = this._selectRoomodeTemplate(serverMetadata);
    
    // Create roomode definition
    const roomode = {
      slug: `mcp-${serverMetadata.id}`,
      name: `${serverMetadata.name} Integration`,
      model: "claude-3-7-sonnet-20250219",
      roleDefinition: template.roleDefinition.replace(/{Server Name}/g, serverMetadata.name),
      customInstructions: template.customInstructions.replace(/{Server Name}/g, serverMetadata.name),
      groups: ["read", "edit", "mcp", ...template.additionalGroups],
      source: "project"
    };
    
    return roomode;
  },
  
  /**
   * Generate roomode definitions for multiple servers
   * @param {Array} servers - Array of server metadata
   * @returns {Array} Array of roomode definitions
   */
  generateRoomodeDefinitions(servers) {
    logger.debug('Generating roomode definitions');
    
    return servers.map(server => this.generateRoomodeDefinition(server.metadata));
  },
  
  /**
   * Merge new roomodes with existing roomodes
   * @param {Array} newRoomodes - New roomode definitions
   * @param {Object} existingRoomodes - Existing roomodes object
   * @returns {Object} Merged roomodes object
   */
  mergeRoomodes(newRoomodes, existingRoomodes) {
    logger.debug('Merging roomode definitions');
    
    // Create a deep copy of existing roomodes
    const mergedRoomodes = JSON.parse(JSON.stringify(existingRoomodes));
    
    // Initialize customModes array if it doesn't exist
    if (!mergedRoomodes.customModes) {
      mergedRoomodes.customModes = [];
    }
    
    // Process each new roomode
    for (const newRoomode of newRoomodes) {
      // Check if roomode already exists
      const existingIndex = mergedRoomodes.customModes.findIndex(mode => mode.slug === newRoomode.slug);
      
      if (existingIndex >= 0) {
        // Update existing roomode while preserving user customizations
        const existingRoomode = mergedRoomodes.customModes[existingIndex];
        
        // Preserve user customizations if source is 'project'
        if (existingRoomode.source === 'project') {
          // Update with new template content but preserve user customizations
          mergedRoomodes.customModes[existingIndex] = {
            ...newRoomode,
            // Preserve user customizations if they exist
            name: existingRoomode.name || newRoomode.name,
            customInstructions: existingRoomode.customInstructions || newRoomode.customInstructions,
            // Ensure required groups are present
            groups: this._mergeGroups(newRoomode.groups, existingRoomode.groups)
          };
        } else {
          // For non-project roomodes, don't modify them
          logger.debug(`Skipping update of non-project roomode: ${newRoomode.slug}`);
        }
      } else {
        // Add new roomode
        mergedRoomodes.customModes.push(newRoomode);
      }
    }
    
    return mergedRoomodes;
  },
  
  /**
   * Validate MCP configuration against schema
   * @param {Object} config - MCP configuration object
   * @returns {Object} Validation result
   */
  validateMcpConfig(config) {
    logger.debug('Validating MCP configuration');
    
    const result = {
      valid: true,
      errors: []
    };
    
    // Check required fields
    for (const field of mcpConfigSchema.required) {
      if (config[field] === undefined) {
        result.valid = false;
        result.errors.push({
          property: field,
          message: 'Required field is missing',
          value: undefined
        });
      }
    }
    
    // Validate mcpServers object
    if (config.mcpServers) {
      for (const [serverId, serverConfig] of Object.entries(config.mcpServers)) {
        // Validate server ID format
        if (!/^[a-zA-Z0-9-_]+$/.test(serverId)) {
          result.valid = false;
          result.errors.push({
            property: `mcpServers.${serverId}`,
            message: 'Server ID must contain only alphanumeric characters, hyphens, and underscores',
            value: serverId
          });
        }
        
        // Validate required server properties
        for (const field of mcpConfigSchema.properties.mcpServers.patternProperties['^[a-zA-Z0-9-_]+$'].required) {
          if (serverConfig[field] === undefined) {
            result.valid = false;
            result.errors.push({
              property: `mcpServers.${serverId}.${field}`,
              message: 'Required field is missing',
              value: undefined
            });
          }
        }
        
        // Validate args is an array
        if (serverConfig.args && !Array.isArray(serverConfig.args)) {
          result.valid = false;
          result.errors.push({
            property: `mcpServers.${serverId}.args`,
            message: 'args must be an array',
            value: serverConfig.args
          });
        }
        
        // Validate alwaysAllow is an array
        if (serverConfig.alwaysAllow && !Array.isArray(serverConfig.alwaysAllow)) {
          result.valid = false;
          result.errors.push({
            property: `mcpServers.${serverId}.alwaysAllow`,
            message: 'alwaysAllow must be an array',
            value: serverConfig.alwaysAllow
          });
        }
        
        // Validate env is an object
        if (serverConfig.env && (typeof serverConfig.env !== 'object' || Array.isArray(serverConfig.env))) {
          result.valid = false;
          result.errors.push({
            property: `mcpServers.${serverId}.env`,
            message: 'env must be an object',
            value: serverConfig.env
          });
        }
      }
    }
    
    return result;
  },
  
  /**
   * Validate roomode definition against schema
   * @param {Object} roomode - Roomode definition
   * @returns {Object} Validation result
   */
  validateRoomodeDefinition(roomode) {
    logger.debug(`Validating roomode definition: ${roomode.slug}`);
    
    const result = {
      valid: true,
      errors: []
    };
    
    // Check required fields
    for (const field of mcpRoomodeSchema.required) {
      if (roomode[field] === undefined) {
        result.valid = false;
        result.errors.push({
          property: field,
          message: 'Required field is missing',
          value: undefined
        });
      }
    }
    
    // Validate slug format
    if (roomode.slug && !roomode.slug.match(/^mcp-[a-zA-Z0-9-_]+$/)) {
      result.valid = false;
      result.errors.push({
        property: 'slug',
        message: 'Slug must start with "mcp-" followed by alphanumeric characters, hyphens, or underscores',
        value: roomode.slug
      });
    }
    
    // Validate groups
    if (roomode.groups) {
      if (!Array.isArray(roomode.groups)) {
        result.valid = false;
        result.errors.push({
          property: 'groups',
          message: 'groups must be an array',
          value: roomode.groups
        });
      } else {
        // Check that 'mcp' group is included
        if (!this._hasGroup(roomode.groups, 'mcp')) {
          result.valid = false;
          result.errors.push({
            property: 'groups',
            message: 'MCP roomode must include "mcp" group',
            value: roomode.groups
          });
        }
      }
    }
    
    // Validate source
    if (roomode.source && !['project', 'user', 'system', 'global'].includes(roomode.source)) {
      result.valid = false;
      result.errors.push({
        property: 'source',
        message: 'source must be one of: project, user, system, global',
        value: roomode.source
      });
    }
    
    return result;
  },
  
  /**
   * Write MCP configuration to file
   * @param {Object} config - MCP configuration object
   * @param {string} filePath - Path to write the configuration
   * @returns {Promise<void>}
   */
  async writeMcpConfig(config, filePath) {
    logger.debug(`Writing MCP configuration to ${filePath}`);
    
    try {
      // Ensure directory exists
      await fs.ensureDir(path.dirname(filePath));
      
      // Write configuration file
      await fs.writeJson(filePath, config, { spaces: 2 });
      
      logger.info(`MCP configuration written to ${filePath}`);
    } catch (error) {
      throw new Error(`Failed to write MCP configuration: ${error.message}`);
    }
  },
  
  /**
   * Write roomodes to file
   * @param {Object} roomodes - Roomodes object
   * @param {string} filePath - Path to write the roomodes
   * @returns {Promise<void>}
   */
  async writeRoomodes(roomodes, filePath) {
    logger.debug(`Writing roomodes to ${filePath}`);
    
    try {
      // Write roomodes file
      await fs.writeJson(filePath, roomodes, { spaces: 2 });
      
      logger.info(`Roomodes written to ${filePath}`);
    } catch (error) {
      throw new Error(`Failed to write roomodes: ${error.message}`);
    }
  },
  
  /**
   * Read existing MCP configuration
   * @param {string} filePath - Path to the MCP configuration file
   * @returns {Promise<Object>} MCP configuration object
   */
  async readMcpConfig(filePath) {
    logger.debug(`Reading MCP configuration from ${filePath}`);
    
    try {
      // Check if file exists
      if (await fs.pathExists(filePath)) {
        // Read and parse configuration file
        const config = await fs.readJson(filePath);
        return config;
      } else {
        // Return empty configuration if file doesn't exist
        return { mcpServers: {} };
      }
    } catch (error) {
      throw new Error(`Failed to read MCP configuration: ${error.message}`);
    }
  },
  
  /**
   * Read existing roomodes
   * @param {string} filePath - Path to the roomodes file
   * @returns {Promise<Object>} Roomodes object
   */
  async readRoomodes(filePath) {
    logger.debug(`Reading roomodes from ${filePath}`);
    
    try {
      // Check if file exists
      if (await fs.pathExists(filePath)) {
        // Read and parse roomodes file
        const roomodes = await fs.readJson(filePath);
        return roomodes;
      } else {
        // Return empty roomodes if file doesn't exist
        return { customModes: [] };
      }
    } catch (error) {
      throw new Error(`Failed to read roomodes: ${error.message}`);
    }
  },
  
  /**
   * Merge new MCP configuration with existing configuration
   * @param {Object} newConfig - New MCP configuration
   * @param {Object} existingConfig - Existing MCP configuration
   * @returns {Object} Merged configuration
   */
  mergeMcpConfig(newConfig, existingConfig) {
    logger.debug('Merging MCP configurations');
    
    // Create a deep copy of existing configuration
    const mergedConfig = JSON.parse(JSON.stringify(existingConfig));
    
    // Initialize mcpServers if it doesn't exist
    if (!mergedConfig.mcpServers) {
      mergedConfig.mcpServers = {};
    }
    
    // Merge server configurations
    for (const [serverId, serverConfig] of Object.entries(newConfig.mcpServers)) {
      mergedConfig.mcpServers[serverId] = serverConfig;
    }
    
    return mergedConfig;
  },
  
  /**
   * Select server template based on server metadata
   * @param {Object} serverMetadata - Server metadata
   * @returns {Object} Selected template
   * @private
   */
  _selectServerTemplate(serverMetadata) {
    const serverTags = serverMetadata.tags || [];
    
    if (serverTags.includes('database')) {
      return JSON.parse(JSON.stringify(serverTemplates.database));
    } else if (serverTags.includes('ai')) {
      return JSON.parse(JSON.stringify(serverTemplates.ai));
    } else if (serverTags.includes('cloud')) {
      return JSON.parse(JSON.stringify(serverTemplates.cloud));
    } else {
      return JSON.parse(JSON.stringify(serverTemplates.generic));
    }
  },
  
  /**
   * Select roomode template based on server metadata
   * @param {Object} serverMetadata - Server metadata
   * @returns {Object} Selected template
   * @private
   */
  _selectRoomodeTemplate(serverMetadata) {
    const serverTags = serverMetadata.tags || [];
    
    if (serverTags.includes('database')) {
      return roomodeTemplates.database;
    } else if (serverTags.includes('ai')) {
      return roomodeTemplates.ai;
    } else if (serverTags.includes('cloud')) {
      return roomodeTemplates.cloud;
    } else {
      return roomodeTemplates.generic;
    }
  },
  
  /**
   * Check if a parameter is a secret
   * @param {string} paramName - Parameter name
   * @param {Object} serverMetadata - Server metadata
   * @returns {boolean} Whether the parameter is a secret
   * @private
   */
  _isSecretParam(paramName, serverMetadata) {
    // Check required args
    if (serverMetadata.requiredArgs) {
      const requiredArg = serverMetadata.requiredArgs.find(arg => arg.name === paramName);
      if (requiredArg && requiredArg.secret) {
        return true;
      }
    }
    
    // Check optional args
    if (serverMetadata.optionalArgs) {
      const optionalArg = serverMetadata.optionalArgs.find(arg => arg.name === paramName);
      if (optionalArg && optionalArg.secret) {
        return true;
      }
    }
    
    // Common secret parameter names
    const secretParamPatterns = [
      /token/i,
      /key/i,
      /secret/i,
      /password/i,
      /credential/i,
      /auth/i
    ];
    
    // Check if parameter name matches any secret patterns
    return secretParamPatterns.some(pattern => pattern.test(paramName));
  },
  
  /**
   * Get environment variable name for a parameter
   * @param {string} paramName - Parameter name
   * @param {Object} serverMetadata - Server metadata
   * @returns {string} Environment variable name
   * @private
   */
  _getEnvVarName(paramName, serverMetadata) {
    // Check if there's a specified env var in metadata
    if (serverMetadata.requiredArgs) {
      const requiredArg = serverMetadata.requiredArgs.find(arg => arg.name === paramName);
      if (requiredArg && requiredArg.envVar) {
        return requiredArg.envVar;
      }
    }
    
    if (serverMetadata.optionalArgs) {
      const optionalArg = serverMetadata.optionalArgs.find(arg => arg.name === paramName);
      if (optionalArg && optionalArg.envVar) {
        return optionalArg.envVar;
      }
    }
    
    // Generate a standard env var name
    const serverId = serverMetadata.id.toUpperCase();
    const paramId = paramName.replace(/-/g, '_').toUpperCase();
    
    return `${serverId}_${paramId}`;
  },
  
  /**
   * Merge groups from new and existing roomodes
   * @param {Array} newGroups - New groups
   * @param {Array} existingGroups - Existing groups
   * @returns {Array} Merged groups
   * @private
   */
  _mergeGroups(newGroups, existingGroups) {
    // Start with new groups
    const mergedGroups = [...newGroups];
    
    // Add any existing groups that aren't in new groups
    for (const group of existingGroups) {
      if (typeof group === 'string') {
        if (!this._hasGroup(mergedGroups, group)) {
          mergedGroups.push(group);
        }
      } else if (Array.isArray(group)) {
        // Handle complex group format [groupName, {options}]
        const groupName = group[0];
        if (!this._hasGroup(mergedGroups, groupName)) {
          mergedGroups.push(group);
        }
      }
    }
    
    return mergedGroups;
  },
  
  /**
   * Check if groups array has a specific group
   * @param {Array} groups - Groups array
   * @param {string} groupName - Group name to check
   * @returns {boolean} Whether the group exists
   * @private
   */
  _hasGroup(groups, groupName) {
    return groups.some(group => {
      if (typeof group === 'string') {
        return group === groupName;
      } else if (Array.isArray(group)) {
        return group[0] === groupName;
      }
      return false;
    });
  }
};

module.exports = { configGenerator };