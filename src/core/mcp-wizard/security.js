/**
 * MCP Security Module
 * 
 * Provides security features for the MCP Configuration Wizard:
 * - Secure credential management
 * - Environment variable reference handling
 * - Permission scope validation
 * - Security auditing of configurations
 * - Warning system for potentially insecure configurations
 */

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const { logger } = require('../../utils');

/**
 * MCP Security Module
 */
const mcpSecurity = {
  /**
   * Audit a configuration for security issues
   * @param {Object} config - MCP configuration object
   * @returns {Object} Audit results with issues and recommendations
   */
  auditConfiguration(config) {
    logger.debug('Auditing MCP configuration for security issues');
    
    const results = {
      secure: true,
      issues: [],
      recommendations: []
    };
    
    if (!config || !config.mcpServers) {
      results.secure = false;
      results.issues.push({
        severity: 'error',
        message: 'Invalid or empty configuration'
      });
      return results;
    }
    
    // Check each server configuration
    for (const [serverId, serverConfig] of Object.entries(config.mcpServers)) {
      // Check for hardcoded credentials
      const credentialIssues = this.detectHardcodedCredentials(serverConfig, serverId);
      if (credentialIssues.length > 0) {
        results.secure = false;
        results.issues.push(...credentialIssues);
      }
      
      // Check for excessive permissions
      const permissionIssues = this.validatePermissionScope(serverConfig, serverId);
      if (permissionIssues.length > 0) {
        results.secure = false;
        results.issues.push(...permissionIssues);
      }
      
      // Check for insecure command configuration
      const commandIssues = this.validateCommandSecurity(serverConfig, serverId);
      if (commandIssues.length > 0) {
        results.secure = false;
        results.issues.push(...commandIssues);
      }
    }
    
    // Generate recommendations based on issues
    results.recommendations = this.generateRecommendations(results.issues);
    
    return results;
  },
  
  /**
   * Detect hardcoded credentials in server configuration
   * @param {Object} serverConfig - Server configuration
   * @param {string} serverId - Server ID
   * @returns {Array} Array of credential issues
   */
  detectHardcodedCredentials(serverConfig, serverId) {
    const issues = [];
    
    if (!serverConfig.args || !Array.isArray(serverConfig.args)) {
      return issues;
    }
    
    // Patterns that might indicate sensitive information
    const sensitivePatterns = [
      { pattern: /^[A-Za-z0-9-_]{20,}$/, type: 'API key' },
      { pattern: /^sk-[A-Za-z0-9]{20,}$/, type: 'OpenAI API key' },
      { pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, type: 'UUID/token' },
      { pattern: /^Bearer\s+[A-Za-z0-9-_]+$/, type: 'Bearer token' },
      { pattern: /^[A-Za-z0-9+/]{40,}={0,2}$/, type: 'Base64 encoded data' }
    ];
    
    // Parameter names that typically contain sensitive information
    const sensitiveParamNames = [
      'key', 'apikey', 'api-key', 'token', 'secret', 'password', 'credential', 
      'auth', 'authorization', 'access-token', 'refresh-token'
    ];
    
    for (let i = 0; i < serverConfig.args.length; i++) {
      const arg = serverConfig.args[i];
      
      // Check if this is a parameter name (starts with --)
      if (typeof arg === 'string' && arg.startsWith('--')) {
        const paramName = arg.substring(2).toLowerCase();
        
        // Check if the next argument might be a hardcoded secret
        if (i + 1 < serverConfig.args.length) {
          const paramValue = serverConfig.args[i + 1];
          
          // Check if parameter name is sensitive and value is not an environment variable reference
          const isSensitiveParam = sensitiveParamNames.some(name => paramName.includes(name));
          const isHardcoded = isSensitiveParam && 
                             typeof paramValue === 'string' && 
                             !paramValue.includes('${env:');
          
          if (isHardcoded) {
            issues.push({
              severity: 'critical',
              message: `Hardcoded ${paramName} detected in server "${serverId}"`,
              location: `mcpServers.${serverId}.args`,
              recommendation: `Replace with environment variable reference: \${env:${serverId.toUpperCase()}_${paramName.toUpperCase().replace(/-/g, '_')}}`
            });
          }
        }
      } else if (typeof arg === 'string') {
        // Check for values that match sensitive patterns
        for (const { pattern, type } of sensitivePatterns) {
          if (pattern.test(arg) && !arg.includes('${env:')) {
            issues.push({
              severity: 'critical',
              message: `Potential ${type} detected in server "${serverId}" arguments`,
              location: `mcpServers.${serverId}.args`,
              recommendation: 'Replace with environment variable reference'
            });
            break;
          }
        }
      }
    }
    
    return issues;
  },
  
  /**
   * Validate permission scope of server configuration
   * @param {Object} serverConfig - Server configuration
   * @param {string} serverId - Server ID
   * @returns {Array} Array of permission issues
   */
  validatePermissionScope(serverConfig, serverId) {
    const issues = [];
    
    if (!serverConfig.alwaysAllow || !Array.isArray(serverConfig.alwaysAllow)) {
      return issues;
    }
    
    // High-risk permissions that should be carefully reviewed
    const highRiskPermissions = [
      'admin', 'delete', 'write', 'execute', 'deploy', 'manage', 'create',
      'update', 'remove', 'modify', 'execute_sql', 'execute_query'
    ];
    
    // Check for high-risk permissions
    const grantedHighRiskPermissions = serverConfig.alwaysAllow.filter(
      permission => highRiskPermissions.some(risk => permission.includes(risk))
    );
    
    if (grantedHighRiskPermissions.length > 0) {
      issues.push({
        severity: 'warning',
        message: `High-risk permissions granted to server "${serverId}": ${grantedHighRiskPermissions.join(', ')}`,
        location: `mcpServers.${serverId}.alwaysAllow`,
        recommendation: 'Review and limit permissions to only what is necessary'
      });
    }
    
    // Check for wildcard permissions
    if (serverConfig.alwaysAllow.includes('*')) {
      issues.push({
        severity: 'critical',
        message: `Wildcard permission granted to server "${serverId}"`,
        location: `mcpServers.${serverId}.alwaysAllow`,
        recommendation: 'Replace wildcard with specific required permissions'
      });
    }
    
    // Check for excessive number of permissions
    if (serverConfig.alwaysAllow.length > 10) {
      issues.push({
        severity: 'info',
        message: `Server "${serverId}" has a large number of permissions (${serverConfig.alwaysAllow.length})`,
        location: `mcpServers.${serverId}.alwaysAllow`,
        recommendation: 'Review and consolidate permissions where possible'
      });
    }
    
    return issues;
  },
  
  /**
   * Validate command security of server configuration
   * @param {Object} serverConfig - Server configuration
   * @param {string} serverId - Server ID
   * @returns {Array} Array of command security issues
   */
  validateCommandSecurity(serverConfig, serverId) {
    const issues = [];
    
    if (!serverConfig.command || typeof serverConfig.command !== 'string') {
      issues.push({
        severity: 'error',
        message: `Missing or invalid command for server "${serverId}"`,
        location: `mcpServers.${serverId}.command`,
        recommendation: 'Specify a valid command string'
      });
      return issues;
    }
    
    // Check for potentially dangerous commands
    const dangerousCommands = ['rm', 'sudo', 'chmod', 'chown', 'eval'];
    
    if (dangerousCommands.some(cmd => serverConfig.command.includes(cmd))) {
      issues.push({
        severity: 'critical',
        message: `Potentially dangerous command for server "${serverId}": ${serverConfig.command}`,
        location: `mcpServers.${serverId}.command`,
        recommendation: 'Avoid using system-level commands that could modify the system'
      });
    }
    
    // Check for command injection vulnerabilities
    if (serverConfig.command.includes('$') || 
        serverConfig.command.includes('`') || 
        serverConfig.command.includes(';')) {
      issues.push({
        severity: 'critical',
        message: `Potential command injection vulnerability in server "${serverId}"`,
        location: `mcpServers.${serverId}.command`,
        recommendation: 'Avoid using shell metacharacters in commands'
      });
    }
    
    return issues;
  },
  
  /**
   * Generate recommendations based on issues
   * @param {Array} issues - Array of security issues
   * @returns {Array} Array of recommendations
   */
  generateRecommendations(issues) {
    const recommendations = [];
    
    // Group issues by type
    const credentialIssues = issues.filter(issue => issue.message.includes('Hardcoded') || issue.message.includes('API key'));
    const permissionIssues = issues.filter(issue => issue.location && issue.location.includes('alwaysAllow'));
    const commandIssues = issues.filter(issue => issue.location && issue.location.includes('command'));
    
    // Generate recommendations for credential issues
    if (credentialIssues.length > 0) {
      recommendations.push({
        title: 'Secure Credential Management',
        steps: [
          'Use environment variable references (${env:VARIABLE_NAME}) for all sensitive information',
          'Never hardcode API keys, tokens, or passwords in configuration files',
          'Consider using a secrets management solution for production environments'
        ]
      });
    }
    
    // Generate recommendations for permission issues
    if (permissionIssues.length > 0) {
      recommendations.push({
        title: 'Permission Scope Management',
        steps: [
          'Follow the principle of least privilege - grant only permissions that are necessary',
          'Avoid using wildcard (*) permissions',
          'Regularly audit and review granted permissions'
        ]
      });
    }
    
    // Generate recommendations for command issues
    if (commandIssues.length > 0) {
      recommendations.push({
        title: 'Command Security',
        steps: [
          'Use specific package versions instead of "latest" to prevent supply chain attacks',
          'Avoid commands that could modify the system or execute arbitrary code',
          'Validate all inputs to prevent command injection'
        ]
      });
    }
    
    return recommendations;
  },
  
  /**
   * Secure an existing configuration by fixing common security issues
   * @param {Object} config - MCP configuration object
   * @returns {Object} Secured configuration and applied fixes
   */
  secureConfiguration(config) {
    logger.debug('Securing MCP configuration');
    
    const securedConfig = JSON.parse(JSON.stringify(config));
    const appliedFixes = [];
    
    if (!securedConfig || !securedConfig.mcpServers) {
      return { securedConfig, appliedFixes };
    }
    
    // Process each server configuration
    for (const [serverId, serverConfig] of Object.entries(securedConfig.mcpServers)) {
      // Fix hardcoded credentials
      if (serverConfig.args && Array.isArray(serverConfig.args)) {
        for (let i = 0; i < serverConfig.args.length; i++) {
          const arg = serverConfig.args[i];
          
          // Check if this is a parameter name (starts with --)
          if (typeof arg === 'string' && arg.startsWith('--')) {
            const paramName = arg.substring(2).toLowerCase();
            
            // Check if the next argument might be a hardcoded secret
            if (i + 1 < serverConfig.args.length) {
              const paramValue = serverConfig.args[i + 1];
              
              // Check if parameter name is sensitive and value is not an environment variable reference
              const isSensitiveParam = this._isSensitiveParamName(paramName);
              const isHardcoded = isSensitiveParam && 
                                 typeof paramValue === 'string' && 
                                 !paramValue.includes('${env:');
              
              if (isHardcoded) {
                // Generate environment variable name
                const envVarName = `${serverId.toUpperCase()}_${paramName.toUpperCase().replace(/-/g, '_')}`;
                
                // Replace hardcoded value with environment variable reference
                serverConfig.args[i + 1] = `\${env:${envVarName}}`;
                
                appliedFixes.push({
                  type: 'credential',
                  message: `Replaced hardcoded ${paramName} with environment variable reference \${env:${envVarName}}`,
                  location: `mcpServers.${serverId}.args`
                });
              }
            }
          }
        }
      }
      
      // Fix permission issues
      if (serverConfig.alwaysAllow && Array.isArray(serverConfig.alwaysAllow)) {
        // Remove wildcard permissions
        if (serverConfig.alwaysAllow.includes('*')) {
          const index = serverConfig.alwaysAllow.indexOf('*');
          serverConfig.alwaysAllow.splice(index, 1);
          
          appliedFixes.push({
            type: 'permission',
            message: `Removed wildcard permission from server "${serverId}"`,
            location: `mcpServers.${serverId}.alwaysAllow`
          });
        }
      }
    }
    
    return { securedConfig, appliedFixes };
  },
  
  /**
   * Validate environment variable references in a configuration
   * @param {Object} config - MCP configuration object
   * @returns {Object} Validation results
   */
  validateEnvVarReferences(config) {
    logger.debug('Validating environment variable references');
    
    const results = {
      valid: true,
      missingVariables: [],
      references: []
    };
    
    if (!config || !config.mcpServers) {
      results.valid = false;
      return results;
    }
    
    // Process each server configuration
    for (const [serverId, serverConfig] of Object.entries(config.mcpServers)) {
      if (serverConfig.args && Array.isArray(serverConfig.args)) {
        for (const arg of serverConfig.args) {
          if (typeof arg === 'string' && arg.includes('${env:')) {
            // Extract environment variable name
            const matches = arg.match(/\${env:([A-Za-z0-9_]+)}/g);
            
            if (matches) {
              for (const match of matches) {
                const envVarName = match.substring(6, match.length - 1);
                
                // Check if environment variable is set
                const isSet = process.env[envVarName] !== undefined;
                
                results.references.push({
                  name: envVarName,
                  isSet,
                  serverId,
                  value: arg
                });
                
                if (!isSet) {
                  results.missingVariables.push(envVarName);
                  results.valid = false;
                }
              }
            }
          }
        }
      }
    }
    
    return results;
  },
  
  /**
   * Generate a secure configuration template with best practices
   * @param {string} serverId - Server ID
   * @param {string} serverType - Type of server (database, ai, cloud, etc.)
   * @returns {Object} Secure configuration template
   */
  generateSecureTemplate(serverId, serverType = 'generic') {
    logger.debug(`Generating secure template for ${serverType} server: ${serverId}`);
    
    // Base secure configuration
    const secureConfig = {
      command: 'npx',
      args: [
        '-y',
        `@${serverId}/mcp-server@1.0.0` // Specific version instead of latest
      ],
      alwaysAllow: []
    };
    
    // Add type-specific configurations
    switch (serverType.toLowerCase()) {
      case 'database':
        secureConfig.args.push('--connection-string');
        secureConfig.args.push(`\${env:${serverId.toUpperCase()}_CONNECTION_STRING}`);
        secureConfig.alwaysAllow = ['list_tables', 'execute_query', 'describe_table'];
        break;
        
      case 'ai':
        secureConfig.args.push('--api-key');
        secureConfig.args.push(`\${env:${serverId.toUpperCase()}_API_KEY}`);
        secureConfig.alwaysAllow = ['generate_text', 'generate_image', 'embed_text'];
        break;
        
      case 'cloud':
        secureConfig.args.push('--access-key');
        secureConfig.args.push(`\${env:${serverId.toUpperCase()}_ACCESS_KEY}`);
        secureConfig.args.push('--secret-key');
        secureConfig.args.push(`\${env:${serverId.toUpperCase()}_SECRET_KEY}`);
        secureConfig.alwaysAllow = ['list_resources', 'describe_resource', 'get_resource'];
        break;
        
      default:
        secureConfig.args.push('--token');
        secureConfig.args.push(`\${env:${serverId.toUpperCase()}_TOKEN}`);
        secureConfig.alwaysAllow = ['read', 'list'];
        break;
    }
    
    return secureConfig;
  },
  
  /**
   * Calculate integrity hash for a configuration
   * @param {Object} config - Configuration object
   * @returns {string} Integrity hash
   */
  calculateIntegrityHash(config) {
    const configString = JSON.stringify(config);
    return crypto.createHash('sha256').update(configString).digest('hex');
  },
  
  /**
   * Verify configuration integrity
   * @param {Object} config - Configuration object
   * @param {string} expectedHash - Expected integrity hash
   * @returns {boolean} Whether the configuration is intact
   */
  verifyIntegrity(config, expectedHash) {
    const actualHash = this.calculateIntegrityHash(config);
    return actualHash === expectedHash;
  },
  
  /**
   * Check if a parameter name is sensitive
   * @param {string} paramName - Parameter name
   * @returns {boolean} Whether the parameter is sensitive
   * @private
   */
  _isSensitiveParamName(paramName) {
    const sensitivePatterns = [
      /token/i,
      /key/i,
      /secret/i,
      /password/i,
      /credential/i,
      /auth/i,
      /access/i
    ];
    
    return sensitivePatterns.some(pattern => pattern.test(paramName));
  }
};

module.exports = { mcpSecurity };