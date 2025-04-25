/**
 * MCP Configuration Wizard command
 * Provides CLI interface for configuring MCP servers
 */

const chalk = require('chalk');
const inquirer = require('inquirer');
const { mcpWizard } = require('../../core/mcp-wizard');
const { wizardCore } = require('../../core/mcp-wizard/wizard-core');
const { validateServerId, validateApiKey, validatePermissions } = require('../../core/mcp-wizard/validation');
const { logger } = require('../../utils');

/**
 * Register the wizard command with the CLI program
 * @param {import('commander').Command} program - Commander program instance
 */
function wizardCommand(program) {
  program
    .command('wizard')
    .description('Interactive MCP server configuration wizard')
    .option('-l, --list', 'List configured MCP servers')
    .option('-a, --add <server-id>', 'Add a specific MCP server')
    .option('-r, --remove <server-id>', 'Remove a configured MCP server')
    .option('-u, --update <server-id>', 'Update a configured MCP server')
    .option('--registry <url>', 'Custom registry URL')
    .option('--no-interactive', 'Run in non-interactive mode (requires all parameters)')
    .option('--config-path <path>', 'Custom path to MCP configuration file', '.roo/mcp.json')
    .option('--roomodes-path <path>', 'Custom path to roomodes file', '.roomodes')
    .option('--api-key <key>', 'API key for the server (use ${env:VAR_NAME} for environment variables)')
    .option('--region <region>', 'Region for the server', 'us-east-1')
    .option('--permissions <list>', 'Comma-separated list of permissions to grant', 'read,write')
    .option('--model <model>', 'Model to use (for AI services)')
    .option('--timeout <seconds>', 'Timeout in seconds', '10')
    .option('--debug', 'Enable debug output')
    .option('--validate', 'Validate the MCP configuration')
    .action(async (options) => {
      try {
        // Set debug mode if requested
        if (options.debug) {
          process.env.DEBUG = 'true';
          logger.setLevel('debug');
        }
        
        // Handle validate command
        if (options.validate) {
          await validateConfiguration(options);
          return;
        }
        
        // Handle list command
        if (options.list) {
          await listServers(options);
          return;
        }

        // Handle remove command
        if (options.remove) {
          await removeServer(options.remove, options);
          return;
        }

        // Handle add or update command
        if (options.add || options.update) {
          const serverId = options.add || options.update;
          const isUpdate = Boolean(options.update);
          await configureServer(serverId, isUpdate, options);
          return;
        }

        // Default: run the interactive wizard
        await runInteractiveWizard(options);
      } catch (error) {
        logger.error(`Wizard error: ${error.message}`);
        if (process.env.DEBUG) {
          console.error(error);
        }
        process.exit(1);
      }
    });
}

/**
 * List all configured MCP servers
 * @param {Object} options - Command options
 */
async function listServers(options) {
  logger.info('Listing configured MCP servers...');
  
  const result = await mcpWizard.listServers({
    projectPath: process.cwd(),
    mcpConfigPath: options.configPath
  });
  
  if (!result.success) {
    logger.error(`Failed to list servers: ${result.error}`);
    return;
  }
  
  const servers = result.servers;
  
  if (Object.keys(servers).length === 0) {
    logger.info('No MCP servers configured.');
    return;
  }
  
  console.log('\n' + chalk.bold('Configured MCP Servers:'));
  
  for (const [serverId, serverConfig] of Object.entries(servers)) {
    console.log(`\n${chalk.cyan(serverId)}`);
    console.log(`  Command: ${serverConfig.command} ${serverConfig.args.join(' ')}`);
    console.log(`  Permissions: ${serverConfig.permissions.join(', ') || 'None'}`);
  }
  
  console.log(''); // Empty line for better readability
}

/**
 * Remove a configured MCP server
 * @param {string} serverId - Server ID to remove
 * @param {Object} options - Command options
 */
async function removeServer(serverId, options) {
  // Validate server ID
  const serverIdValidation = validateServerId(serverId);
  if (!serverIdValidation.valid) {
    throw new Error(`Invalid server ID: ${serverIdValidation.error}`);
  }
  
  // Check if server exists before attempting removal
  const listResult = await mcpWizard.listServers({
    projectPath: process.cwd(),
    mcpConfigPath: options.configPath
  });
  
  if (!listResult.success) {
    throw new Error(`Failed to check if server exists: ${listResult.error}`);
  }
  
  if (!listResult.servers[serverId]) {
    throw new Error(`Server not found: ${serverId}`);
  }
  
  if (!options.interactive) {
    await confirmAndRemoveServer(serverId, options);
    return;
  }
  
  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Are you sure you want to remove the MCP server "${serverId}"?`,
      default: false
    }
  ]);
  
  if (answers.confirm) {
    await confirmAndRemoveServer(serverId, options);
  } else {
    logger.info('Server removal cancelled.');
  }
}

/**
 * Confirm and remove a server after validation
 * @param {string} serverId - Server ID to remove
 * @param {Object} options - Command options
 */
async function confirmAndRemoveServer(serverId, options) {
  logger.info(`Removing MCP server: ${chalk.cyan(serverId)}...`);
  
  try {
    // Initialize wizard core
    await wizardCore.initialize({
      projectPath: process.cwd(),
      mcpConfigPath: options.configPath,
      roomodesPath: options.roomodesPath
    });
    
    // Create a backup before removing
    const backupResult = await wizardCore.backupConfiguration();
    if (!backupResult.success) {
      logger.warn(`Failed to create backup: ${backupResult.error}`);
      logger.warn('Proceeding without backup...');
    } else {
      logger.debug(`Backup created successfully: ${JSON.stringify(backupResult.backupPaths)}`);
    }
    
    try {
      // Remove the server
      const result = await mcpWizard.removeServer(serverId, {
        projectPath: process.cwd(),
        mcpConfigPath: options.configPath,
        roomodesPath: options.roomodesPath
      });
      
      if (result.success) {
        logger.success(`MCP server ${chalk.cyan(serverId)} removed successfully.`);
      } else {
        logger.error(`Failed to remove server: ${result.error}`);
        
        // Restore from backup if available
        if (backupResult.success) {
          logger.info('Restoring from backup...');
          await wizardCore.restoreConfiguration(backupResult.backupPaths);
        }
      }
    } catch (error) {
      logger.error(`Error removing server: ${error.message}`);
      
      // Restore from backup if available
      if (backupResult.success) {
        logger.info('Restoring from backup after error...');
        await wizardCore.restoreConfiguration(backupResult.backupPaths);
      }
      
      if (process.env.DEBUG) {
        console.error(error);
      }
    }
  } catch (error) {
    logger.error(`Error in backup/restore process: ${error.message}`);
    if (process.env.DEBUG) {
      console.error(error);
    }
  }
}

/**
 * Configure a specific MCP server
 * @param {string} serverId - Server ID to configure
 * @param {boolean} isUpdate - Whether this is an update operation
 * @param {Object} options - Command options
 */
async function configureServer(serverId, isUpdate, options) {
  const action = isUpdate ? 'Updating' : 'Adding';
  logger.info(`${action} MCP server: ${chalk.cyan(serverId)}...`);
  
  // Validate server ID
  const serverIdValidation = validateServerId(serverId);
  if (!serverIdValidation.valid) {
    throw new Error(`Invalid server ID: ${serverIdValidation.error}`);
  }
  
  let serverParams;
  let serverMetadata;
  
  // If non-interactive mode, use provided parameters
  if (!options.interactive) {
    if (!options.apiKey) {
      throw new Error('API key is required in non-interactive mode. Use --api-key option.');
    }
    
    // Parse permissions from comma-separated list
    const permissions = options.permissions ? options.permissions.split(',') : ['read', 'write'];
    
    // Build server parameters from options
    serverParams = {
      apiKey: options.apiKey.replace(/\${env:([^}]+)}/g, (match, envVar) => {
        return process.env[envVar] || match;
      }),
      region: options.region || 'us-east-1',
      permissions: permissions
    };
    
    // Add optional parameters if provided
    if (options.model) {
      serverParams.model = options.model;
    }
    
    if (options.timeout) {
      serverParams.timeout = options.timeout;
    }
    
    // Create a server metadata object
    serverMetadata = {
      id: serverId,
      name: serverId,
      command: 'npx',
      args: ['-y', `@${serverId}/mcp-server@latest`],
      recommendedPermissions: permissions
    };
    
    // If registry URL is provided, attempt to fetch server metadata
    if (options.registry) {
      try {
        logger.debug(`Fetching server metadata from registry: ${options.registry}`);
        // This would be implemented to fetch from the registry
        // For now, we'll use the default metadata
      } catch (error) {
        logger.warn(`Could not fetch server metadata: ${error.message}`);
        logger.warn('Using default server metadata');
      }
    }
  } else {
    // Interactive mode - collect parameters through prompts
    serverParams = await collectServerParameters(serverId, isUpdate);
    
    // Create a simple server metadata object
    serverMetadata = {
      id: serverId,
      name: serverId,
      command: 'npx',
      args: ['-y', `@${serverId}/mcp-server@latest`],
      recommendedPermissions: ['read', 'write']
    };
  }
  
  // Call the appropriate wizard method
  let result;
  if (isUpdate) {
    result = await mcpWizard.updateServer(serverId, serverParams, {
      projectPath: process.cwd(),
      mcpConfigPath: options.configPath,
      roomodesPath: options.roomodesPath
    });
  } else {
    result = await mcpWizard.addServer(serverMetadata, serverParams, {
      projectPath: process.cwd(),
      mcpConfigPath: options.configPath,
      roomodesPath: options.roomodesPath
    });
  }
  
  if (result.success) {
    logger.success(`MCP server ${chalk.cyan(serverId)} ${isUpdate ? 'updated' : 'added'} successfully.`);
    return result;
  } else {
    const errorMsg = `Failed to ${isUpdate ? 'update' : 'add'} server: ${result.error}`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
}

/**
 * Collect server parameters through interactive prompts
 * @param {string} serverId - Server ID
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Promise<Object>} Collected parameters
 */
async function collectServerParameters(serverId, isUpdate) {
  // In a real implementation, we would fetch required parameters from registry
  // For now, we'll use a simplified approach with common parameters
  
  // Validate server ID
  const serverIdValidation = validateServerId(serverId);
  if (!serverIdValidation.valid) {
    throw new Error(`Invalid server ID: ${serverIdValidation.error}`);
  }
  
  // Define recommended permissions for this server type
  // In a real implementation, this would come from the registry
  const recommendedPermissions = ['read', 'write'];
  
  const questions = [
    {
      type: 'input',
      name: 'apiKey',
      message: `Enter API key for ${serverId}:`,
      validate: input => {
        const validation = validateApiKey(input);
        return validation.valid ? true : validation.error;
      }
    },
    {
      type: 'input',
      name: 'region',
      message: `Enter region for ${serverId} (optional):`,
      default: 'us-east-1'
    },
    {
      type: 'checkbox',
      name: 'permissions',
      message: 'Select permissions to grant:',
      choices: [
        { name: 'Read data', value: 'read' },
        { name: 'Write data', value: 'write' },
        { name: 'Delete data', value: 'delete' },
        { name: 'Admin access', value: 'admin' }
      ],
      default: recommendedPermissions
    }
  ];
  
  const answers = await inquirer.prompt(questions);
  
  // Validate permissions
  const permissionsValidation = validatePermissions(answers.permissions, recommendedPermissions);
  if (permissionsValidation.warning) {
    logger.warn(permissionsValidation.warning);
    
    // Ask for confirmation if permissions exceed recommended ones
    const confirmAnswer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Do you want to continue with these permissions?',
        default: false
      }
    ]);
    
    if (!confirmAnswer.confirm) {
      // Ask again for permissions
      const permissionsAnswer = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'permissions',
          message: 'Select permissions to grant (recommended permissions highlighted):',
          choices: [
            { name: 'Read data (recommended)', value: 'read', checked: recommendedPermissions.includes('read') },
            { name: 'Write data (recommended)', value: 'write', checked: recommendedPermissions.includes('write') },
            { name: 'Delete data', value: 'delete', checked: recommendedPermissions.includes('delete') },
            { name: 'Admin access', value: 'admin', checked: recommendedPermissions.includes('admin') }
          ]
        }
      ]);
      
      answers.permissions = permissionsAnswer.permissions;
    }
  }
  
  // Transform answers into server parameters
  const envVarName = `${serverId.toUpperCase()}_API_KEY`;
  
  // Show environment variable setup instructions
  logger.info(chalk.yellow(`\nIMPORTANT: Set up the following environment variable:`));
  logger.info(`export ${envVarName}="your-api-key-here"`);
  
  return {
    apiKey: `\${env:${envVarName}}`, // Use environment variable reference
    region: answers.region,
    permissions: answers.permissions
  };
}

/**
 * Run the interactive wizard for MCP server configuration
 * @param {Object} options - Command options
 */
async function runInteractiveWizard(options) {
  logger.info(chalk.cyan('Starting MCP Configuration Wizard...'));
  console.log(chalk.dim('This wizard will help you configure MCP servers for your project.\n'));
  
  try {
    // Step 1: Choose operation
    const operationAnswers = await inquirer.prompt([
      {
        type: 'list',
        name: 'operation',
        message: 'What would you like to do?',
        choices: [
          { name: 'Add a new MCP server', value: 'add' },
          { name: 'Update an existing MCP server', value: 'update' },
          { name: 'Remove an MCP server', value: 'remove' },
          { name: 'List configured MCP servers', value: 'list' }
        ]
      }
    ]);
    
    // Handle the selected operation
    switch (operationAnswers.operation) {
      case 'list':
        await listServers(options);
        break;
        
      case 'add':
        // Check if registry option is provided
        if (options.registry) {
          logger.info(`Using custom registry: ${options.registry}`);
        }
        
        // Step 2: Select server to add
        const addAnswers = await inquirer.prompt([
          {
            type: 'input',
            name: 'serverId',
            message: 'Enter the MCP server ID to add:',
            validate: input => {
              const validation = validateServerId(input);
              return validation.valid ? true : validation.error;
            }
          }
        ]);
        
        try {
          await configureServer(addAnswers.serverId, false, options);
          
          // Show success message with next steps
          console.log(chalk.green('\nServer added successfully!'));
          console.log(chalk.dim('\nNext steps:'));
          console.log(chalk.dim('1. Set up the required environment variables'));
          console.log(chalk.dim('2. Test the server connection'));
          console.log(chalk.dim('3. Use the server in your project with the MCP roomode\n'));
        } catch (error) {
          logger.error(`Failed to add server: ${error.message}`);
        }
        break;
        
      case 'update':
        // Get list of configured servers
        const serverList = await mcpWizard.listServers({
          projectPath: process.cwd(),
          mcpConfigPath: options.configPath
        });
        
        if (!serverList.success || Object.keys(serverList.servers).length === 0) {
          logger.info(chalk.yellow('No MCP servers configured to update.'));
          
          // Ask if user wants to add a server instead
          const addServerAnswer = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'addServer',
              message: 'Would you like to add a new server instead?',
              default: true
            }
          ]);
          
          if (addServerAnswer.addServer) {
            // Recursively call the wizard with 'add' operation
            const addAnswers = await inquirer.prompt([
              {
                type: 'input',
                name: 'serverId',
                message: 'Enter the MCP server ID to add:',
                validate: input => {
                  const validation = validateServerId(input);
                  return validation.valid ? true : validation.error;
                }
              }
            ]);
            
            await configureServer(addAnswers.serverId, false, options);
          }
          return;
        }
        
        // Step 2: Select server to update
        const updateAnswers = await inquirer.prompt([
          {
            type: 'list',
            name: 'serverId',
            message: 'Select the MCP server to update:',
            choices: Object.keys(serverList.servers)
          }
        ]);
        
        try {
          await configureServer(updateAnswers.serverId, true, options);
          
          // Show success message
          console.log(chalk.green('\nServer updated successfully!'));
        } catch (error) {
          logger.error(`Failed to update server: ${error.message}`);
        }
        break;
        
      case 'remove':
        // Get list of configured servers
        const removeServerList = await mcpWizard.listServers({
          projectPath: process.cwd(),
          mcpConfigPath: options.configPath
        });
        
        if (!removeServerList.success || Object.keys(removeServerList.servers).length === 0) {
          logger.info(chalk.yellow('No MCP servers configured to remove.'));
          return;
        }
        
        // Step 2: Select server to remove
        const removeAnswers = await inquirer.prompt([
          {
            type: 'list',
            name: 'serverId',
            message: 'Select the MCP server to remove:',
            choices: Object.keys(removeServerList.servers)
          }
        ]);
        
        try {
          await removeServer(removeAnswers.serverId, options);
        } catch (error) {
          logger.error(`Failed to remove server: ${error.message}`);
        }
        break;
    }
    
    // Ask if user wants to perform another operation
    const continueAnswer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continue',
        message: 'Would you like to perform another operation?',
        default: false
      }
    ]);
    
    if (continueAnswer.continue) {
      // Recursively call the wizard
      await runInteractiveWizard(options);
    } else {
      logger.success('MCP Configuration Wizard completed successfully.');
    }
  } catch (error) {
    logger.error(`Wizard error: ${error.message}`);
    if (process.env.DEBUG) {
      console.error(error);
    }
  }
}

/**
 * Validate MCP configuration
 * @param {Object} options - Command options
 */
async function validateConfiguration(options) {
  logger.info('Validating MCP configuration...');
  
  try {
    // Initialize wizard core with options
    await wizardCore.initialize({
      projectPath: process.cwd(),
      mcpConfigPath: options.configPath,
      roomodesPath: options.roomodesPath
    });
    
    // Validate configuration
    const result = await wizardCore.validateConfiguration();
    
    if (result.success) {
      logger.success('MCP configuration is valid.');
      
      // Display configuration summary
      const serverCount = Object.keys(result.config.mcpServers || {}).length;
      logger.info(`Configuration contains ${serverCount} server(s).`);
      
      if (serverCount > 0) {
        console.log('\n' + chalk.bold('Configured MCP Servers:'));
        for (const [serverId, serverConfig] of Object.entries(result.config.mcpServers)) {
          console.log(`\n${chalk.cyan(serverId)}`);
          console.log(`  Command: ${serverConfig.command} ${serverConfig.args.join(' ')}`);
          console.log(`  Permissions: ${serverConfig.alwaysAllow?.join(', ') || 'None'}`);
        }
        console.log(''); // Empty line for better readability
      }
    } else {
      logger.error('MCP configuration is invalid:');
      result.errors.forEach(error => {
        logger.error(`- ${error.message}`);
      });
      process.exit(1);
    }
  } catch (error) {
    logger.error(`Validation error: ${error.message}`);
    if (process.env.DEBUG) {
      console.error(error);
    }
    process.exit(1);
  }
}

module.exports = { wizardCommand };