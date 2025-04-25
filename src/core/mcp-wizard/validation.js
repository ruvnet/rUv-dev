/**
 * Validation utilities for MCP Configuration Wizard
 */

/**
 * Validate server ID
 * @param {string} serverId - Server ID to validate
 * @returns {Object} Validation result
 */
function validateServerId(serverId) {
  if (!serverId) {
    return {
      valid: false,
      error: 'Server ID is required'
    };
  }

  if (!/^[a-zA-Z0-9-_]+$/.test(serverId)) {
    return {
      valid: false,
      error: 'Server ID must contain only letters, numbers, hyphens, and underscores'
    };
  }

  return {
    valid: true
  };
}

/**
 * Validate API key
 * @param {string} apiKey - API key to validate
 * @returns {Object} Validation result
 */
function validateApiKey(apiKey) {
  if (!apiKey) {
    return {
      valid: false,
      error: 'API key is required'
    };
  }

  // Check if it's an environment variable reference
  if (apiKey.startsWith('${env:') && apiKey.endsWith('}')) {
    return {
      valid: true,
      isEnvVar: true
    };
  }

  // For actual API keys, we can add additional validation based on known patterns
  // This is a simplified example
  if (apiKey.length < 8) {
    return {
      valid: false,
      error: 'API key is too short'
    };
  }

  return {
    valid: true,
    isEnvVar: false,
    warning: 'Consider using an environment variable reference for security'
  };
}

/**
 * Validate permissions
 * @param {Array<string>} permissions - Permissions to validate
 * @param {Array<string>} recommendedPermissions - Recommended permissions for the server
 * @returns {Object} Validation result
 */
function validatePermissions(permissions, recommendedPermissions = []) {
  if (!Array.isArray(permissions)) {
    return {
      valid: false,
      error: 'Permissions must be an array'
    };
  }

  // Check for empty permissions
  if (permissions.length === 0) {
    return {
      valid: true,
      warning: 'No permissions specified. The server may have limited functionality.'
    };
  }

  // Check for permissions beyond recommended ones
  if (recommendedPermissions.length > 0) {
    const extraPermissions = permissions.filter(p => !recommendedPermissions.includes(p));
    
    if (extraPermissions.length > 0) {
      return {
        valid: true,
        warning: `The following permissions are beyond recommended: ${extraPermissions.join(', ')}`
      };
    }
  }

  return {
    valid: true
  };
}

/**
 * Validate server configuration
 * @param {Object} serverConfig - Server configuration to validate
 * @returns {Object} Validation result
 */
function validateServerConfig(serverConfig) {
  const errors = [];

  // Check required fields
  if (!serverConfig.command) {
    errors.push('Server command is required');
  }

  if (!Array.isArray(serverConfig.args)) {
    errors.push('Server arguments must be an array');
  }

  // Check for sensitive information in args
  const sensitivePatterns = [
    /^[A-Za-z0-9-_]{20,}$/, // Potential API keys
    /^sk-[A-Za-z0-9]{20,}$/, // OpenAI API key pattern
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ // UUID pattern
  ];

  if (Array.isArray(serverConfig.args)) {
    for (const arg of serverConfig.args) {
      if (typeof arg === 'string') {
        for (const pattern of sensitivePatterns) {
          if (pattern.test(arg) && !arg.startsWith('${env:')) {
            errors.push('Potential sensitive information detected in arguments. Use environment variable references instead.');
            break;
          }
        }
      }
    }
  }

  // Validate alwaysAllow if present
  if (serverConfig.alwaysAllow && !Array.isArray(serverConfig.alwaysAllow)) {
    errors.push('alwaysAllow must be an array of permission strings');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate environment variable reference
 * @param {string} reference - Environment variable reference
 * @returns {Object} Validation result with extracted variable name
 */
function validateEnvVarReference(reference) {
  const envVarPattern = /^\${env:([A-Za-z0-9_]+)}$/;
  const match = reference.match(envVarPattern);
  
  if (!match) {
    return {
      valid: false,
      error: 'Invalid environment variable reference format. Use ${env:VARIABLE_NAME}'
    };
  }
  
  const variableName = match[1];
  
  // Check if the environment variable is set
  const isSet = process.env[variableName] !== undefined;
  
  return {
    valid: true,
    variableName,
    isSet,
    warning: isSet ? null : `Environment variable ${variableName} is not set`
  };
}

module.exports = {
  validateServerId,
  validateApiKey,
  validatePermissions,
  validateServerConfig,
  validateEnvVarReference
};