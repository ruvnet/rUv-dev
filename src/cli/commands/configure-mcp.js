/**
 * MCP Configuration Command
 * Provides an integrated CLI interface for the MCP Configuration Wizard
 */

const chalk = require('chalk');
const inquirer = require('inquirer');
const { wizardCore, mcpSecurity } = require('../../core/mcp-wizard');
const { validateServerId, validateApiKey, validatePermissions } = require('../../core/mcp-wizard/validation');
const { logger } = require('../../utils');

/**
 * Register the configure-mcp command with the CLI program
 * @param {import('commander').Command} program - Commander program instance
 */
function configureMcpCommand(program) {
  program
    .command('configure-mcp')
    .description('Integrated MCP configuration wizard with server discovery')
    .option('-l, --list', 'List configured MCP servers')
    .option('-d, --discover', 'Discover available MCP servers')
    .option('-a, --add <server-id>', 'Add a specific MCP server')
    .option('-r, --remove <server-id>', 'Remove a configured MCP server')
    .option('-u, --update <server-id>', 'Update a configured MCP server')
    .option('-v, --validate', 'Validate current MCP configuration')
    .option('-b, --backup', 'Create a backup of current configuration')
    .option('-s, --security-audit', 'Perform security audit on MCP configuration')
    .option('--auto-fix', 'Automatically fix security issues (with --security-audit)')
    .option('-e, --validate-env', 'Validate environment variable references')
    .option('--registry <url>', 'Custom registry URL')
    .option('--no-interactive', 'Run in non-interactive mode (requires all parameters)')
    .option('--config-path <path>', 'Custom path to MCP configuration file', '.roo/mcp.json')
    .option('--roomodes-path <path>', 'Custom path to roomodes file', '.roomodes')
    .action(async (options) => {
      try {
        // Initialize the wizard core
        await wizardCore.initialize({
          projectPath: process.cwd(),
          mcpConfigPath: options.configPath,
          roomodesPath: options.roomodesPath,
          registryUrl: options.registry
        });

        // Handle list command
        if (options.list) {
          await listConfiguredServers();
          return;
        }

        // Handle discover command
        if (options.discover) {
          await discoverServers(options);
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

        // Handle validate command
        if (options.validate) {
          await validateConfiguration();
          return;
        }

        // Handle backup command
        if (options.backup) {
          await backupConfiguration();
          return;
        }
        
        // Handle security audit command
        if (options.securityAudit) {
          await auditSecurity(options.autoFix);
          return;
        }
        
        // Handle environment variable validation command
        if (options.validateEnv) {
          await validateEnvironmentVariables();
          return;
        }

        // Default: run the interactive wizard
        await runInteractiveWizard(options);
      } catch (error) {
        logger.error(`Configuration error: ${error.message}`);
        if (process.env.DEBUG) {
          console.error(error);
        }
        process.exit(1);
      }
    });
}

/**
 * List all configured MCP servers
 */
async function listConfiguredServers() {
  logger.info('Listing configured MCP servers...');
  
  const result = await wizardCore.listConfiguredServers();
  
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
 * Discover available MCP servers
 * @param {Object} options - Command options
 */
async function discoverServers(options) {
  logger.info('Discovering available MCP servers...');
  
  // Get search parameters
  let searchParams = {};
  
  if (options.interactive) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'search',
        message: 'Enter search term (optional):',
      },
      {
        type: 'input',
        name: 'tags',
        message: 'Filter by tags (comma-separated, optional):',
      }
    ]);
    
    if (answers.search) {
      searchParams.search = answers.search;
    }
    
    if (answers.tags) {
      searchParams.tags = answers.tags;
    }
  }
  
  const result = await wizardCore.discoverServers(searchParams);
  
  if (!result.success) {
    logger.error(`Failed to discover servers: ${result.error}`);
    return;
  }
  
  const servers = result.servers;
  
  if (servers.length === 0) {
    logger.info('No MCP servers found matching your criteria.');
    return;
  }
  
  console.log('\n' + chalk.bold('Available MCP Servers:'));
  
  for (const server of servers) {
    console.log(`\n${chalk.cyan(server.id)} - ${server.name}`);
    console.log(`  Description: ${server.description || 'No description available'}`);
    console.log(`  Tags: ${server.tags?.join(', ') || 'None'}`);
  }
  
  console.log(''); // Empty line for better readability
  
  // Ask if user wants to configure a server
  if (options.interactive) {
    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'configure',
        message: 'Would you like to configure one of these servers?',
        default: false
      }
    ]);
    
    if (answer.configure) {
      const serverAnswer = await inquirer.prompt([
        {
          type: 'list',
          name: 'serverId',
          message: 'Select a server to configure:',
          choices: servers.map(server => ({
            name: `${server.id} - ${server.name}`,
            value: server.id
          }))
        }
      ]);
      
      await configureServer(serverAnswer.serverId, false, options);
    }
  }
}

/**
 * Remove a configured MCP server
 * @param {string} serverId - Server ID to remove
 * @param {Object} options - Command options
 */
async function removeServer(serverId, options) {
  if (!options.interactive) {
    await confirmAndRemoveServer(serverId);
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
    await confirmAndRemoveServer(serverId);
  } else {
    logger.info('Server removal cancelled.');
  }
}

/**
 * Confirm and remove a server after validation
 * @param {string} serverId - Server ID to remove
 */
async function confirmAndRemoveServer(serverId) {
  logger.info(`Removing MCP server: ${chalk.cyan(serverId)}...`);
  
  const result = await wizardCore.removeServer(serverId);
  
  if (result.success) {
    logger.success(`MCP server ${chalk.cyan(serverId)} removed successfully.`);
  } else {
    logger.error(`Failed to remove server: ${result.error}`);
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
  
  // If non-interactive mode, we need all required parameters
  if (!options.interactive) {
    logger.error('Non-interactive mode requires all parameters (not implemented yet)');
    return;
  }
  
  // Get server details if adding a new server
  let serverDetails = null;
  if (!isUpdate) {
    try {
      const detailsResult = await wizardCore.getServerDetails(serverId);
      if (detailsResult.success) {
        serverDetails = detailsResult.server;
      } else {
        logger.warn(`Could not fetch server details: ${detailsResult.error}`);
        logger.info('Continuing with manual configuration...');
      }
    } catch (error) {
      logger.warn(`Could not fetch server details: ${error.message}`);
      logger.info('Continuing with manual configuration...');
    }
  }
  
  // Collect server parameters
  const serverParams = await collectServerParameters(serverId, isUpdate, serverDetails);
  
  // Call the appropriate wizard method
  let result;
  if (isUpdate) {
    result = await wizardCore.updateServerConfig(serverId, serverParams);
  } else {
    result = await wizardCore.configureServerWorkflow(serverId, serverParams);
  }
  
  if (result.success) {
    logger.success(`MCP server ${chalk.cyan(serverId)} ${isUpdate ? 'updated' : 'added'} successfully.`);
    
    // Show environment variable setup instructions if needed
    if (serverParams.apiKey && serverParams.apiKey.startsWith('${env:')) {
      const envVarName = serverParams.apiKey.match(/\${env:([^}]+)}/)[1];
      logger.info(chalk.yellow(`\nIMPORTANT: Set up the following environment variable:`));
      logger.info(`export ${envVarName}="your-api-key-here"`);
    }
  } else {
    logger.error(`Failed to ${isUpdate ? 'update' : 'add'} server: ${result.error}`);
  }
}

/**
 * Collect server parameters through interactive prompts
 * @param {string} serverId - Server ID
 * @param {boolean} isUpdate - Whether this is an update operation
 * @param {Object} serverDetails - Server details from registry (optional)
 * @returns {Promise<Object>} Collected parameters
 */
async function collectServerParameters(serverId, isUpdate, serverDetails = null) {
  // Validate server ID
  const serverIdValidation = validateServerId(serverId);
  if (!serverIdValidation.valid) {
    throw new Error(`Invalid server ID: ${serverIdValidation.error}`);
  }
  
  // Define recommended permissions based on server details or defaults
  const recommendedPermissions = serverDetails?.recommendedPermissions || ['read', 'write'];
  
  // Define required parameters based on server details or defaults
  const requiredParams = serverDetails?.requiredParams || ['apiKey'];
  
  // Build questions dynamically
  const questions = [];
  
  // Always ask for API key
  questions.push({
    type: 'input',
    name: 'apiKey',
    message: `Enter API key for ${serverId}:`,
    validate: input => {
      const validation = validateApiKey(input);
      return validation.valid ? true : validation.error;
    }
  });
  
  // Add region question if needed
  if (serverDetails?.supportsRegions || !serverDetails) {
    questions.push({
      type: 'input',
      name: 'region',
      message: `Enter region for ${serverId} (optional):`,
      default: serverDetails?.defaultRegion || 'us-east-1'
    });
  }
  
  // Add custom parameters from server details
  if (serverDetails?.optionalParams) {
    for (const param of serverDetails.optionalParams) {
      questions.push({
        type: param.type || 'input',
        name: param.name,
        message: `${param.description || param.name} (optional):`,
        default: param.default,
        choices: param.choices
      });
    }
  }
  
  // Add permissions question
  questions.push({
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
  });
  
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
  const params = {
    ...answers,
    apiKey: `\${env:${envVarName}}` // Use environment variable reference
  };
  
  return params;
}

/**
 * Validate current MCP configuration
 */
async function validateConfiguration() {
  logger.info('Validating MCP configuration...');
  
  const result = await wizardCore.validateConfiguration();
  
  if (result.success) {
    logger.success('MCP configuration is valid.');
    
    // Show configuration summary
    const serverCount = Object.keys(result.config.mcpServers || {}).length;
    console.log(`\nConfiguration contains ${serverCount} server(s).`);
    
    if (serverCount > 0) {
      console.log('\nConfigured servers:');
      for (const serverId of Object.keys(result.config.mcpServers)) {
        console.log(`- ${chalk.cyan(serverId)}`);
      }
    }
  } else {
    logger.error('MCP configuration is invalid:');
    for (const error of result.errors) {
      console.log(`- ${error.property}: ${error.message}`);
    }
  }
}

/**
 * Create a backup of current configuration
 */
async function backupConfiguration() {
  logger.info('Creating backup of MCP configuration...');
  
  const result = await wizardCore.backupConfiguration();
  
  if (result.success) {
    logger.success('Backup created successfully.');
    
    if (result.backupPaths.mcpConfig) {
      console.log(`MCP config backup: ${result.backupPaths.mcpConfig}`);
    }
    
    if (result.backupPaths.roomodes) {
      console.log(`Roomodes backup: ${result.backupPaths.roomodes}`);
    }
  } else {
    logger.error(`Failed to create backup: ${result.error}`);
  }
}

/**
 * Perform security audit on MCP configuration
 * @param {boolean} autoFix - Whether to automatically fix security issues
 */
async function auditSecurity(autoFix = false) {
  logger.info('Performing security audit on MCP configuration...');
  
  const result = await wizardCore.auditSecurity({ autoFix });
  
  if (result.success) {
    if (result.secure) {
      logger.success('MCP configuration passed security audit.');
    } else {
      logger.warn(`Security issues detected: ${result.issues.length} issues found`);
      
      // Group issues by severity
      const criticalIssues = result.issues.filter(issue => issue.severity === 'critical');
      const warningIssues = result.issues.filter(issue => issue.severity === 'warning');
      const infoIssues = result.issues.filter(issue => issue.severity === 'info');
      
      // Display critical issues
      if (criticalIssues.length > 0) {
        console.log(`\n${chalk.red.bold('Critical Issues:')} ${criticalIssues.length}`);
        criticalIssues.forEach(issue => {
          console.log(`- ${chalk.red(issue.message)}`);
          if (issue.recommendation) {
            console.log(`  ${chalk.dim(issue.recommendation)}`);
          }
        });
      }
      
      // Display warning issues
      if (warningIssues.length > 0) {
        console.log(`\n${chalk.yellow.bold('Warnings:')} ${warningIssues.length}`);
        warningIssues.forEach(issue => {
          console.log(`- ${chalk.yellow(issue.message)}`);
          if (issue.recommendation) {
            console.log(`  ${chalk.dim(issue.recommendation)}`);
          }
        });
      }
      
      // Display info issues
      if (infoIssues.length > 0) {
        console.log(`\n${chalk.blue.bold('Information:')} ${infoIssues.length}`);
        infoIssues.forEach(issue => {
          console.log(`- ${chalk.blue(issue.message)}`);
          if (issue.recommendation) {
            console.log(`  ${chalk.dim(issue.recommendation)}`);
          }
        });
      }
      
      // Display recommendations
      if (result.recommendations && result.recommendations.length > 0) {
        console.log(`\n${chalk.cyan.bold('Recommendations:')}`);
        result.recommendations.forEach(recommendation => {
          console.log(`\n${chalk.cyan(recommendation.title)}`);
          recommendation.steps.forEach(step => {
            console.log(`- ${step}`);
          });
        });
      }
      
      // Display auto-fix results if applied
      if (autoFix && result.fixes) {
        console.log(`\n${chalk.green.bold('Applied Fixes:')} ${result.fixes.appliedFixes.length}`);
        result.fixes.appliedFixes.forEach(fix => {
          console.log(`- ${fix.message}`);
        });
      } else if (!autoFix) {
        console.log(`\n${chalk.yellow('To automatically fix these issues, run with --auto-fix option')}`);
      }
    }
  } else {
    logger.error(`Failed to perform security audit: ${result.error}`);
  }
}

/**
 * Validate environment variable references in MCP configuration
 */
async function validateEnvironmentVariables() {
  logger.info('Validating environment variable references...');
  
  const result = await wizardCore.validateEnvVarReferences();
  
  if (result.success) {
    if (result.valid) {
      logger.success('All environment variable references are valid.');
      
      // Display environment variables in use
      if (result.references.length > 0) {
        console.log(`\n${chalk.cyan.bold('Environment Variables in Use:')}`);
        result.references.forEach(ref => {
          const status = ref.isSet ? chalk.green('✓ Set') : chalk.red('✗ Not Set');
          console.log(`- ${ref.name}: ${status} (used by ${ref.serverId})`);
        });
      }
    } else {
      logger.warn('Missing environment variables detected.');
      
      // Display missing variables
      console.log(`\n${chalk.yellow.bold('Missing Environment Variables:')}`);
      result.missingVariables.forEach(varName => {
        console.log(`- ${chalk.yellow(varName)}`);
      });
      
      // Display setup instructions
      console.log(`\n${chalk.cyan.bold('Setup Instructions:')}`);
      console.log('Add these variables to your environment:');
      result.missingVariables.forEach(varName => {
        console.log(`export ${varName}="your-value-here"`);
      });
    }
  } else {
    logger.error(`Failed to validate environment variables: ${result.error}`);
  }
}

/**
 * Run the interactive wizard for MCP server configuration
 * @param {Object} options - Command options
 */
async function runInteractiveWizard(options) {
  logger.info(chalk.cyan('Starting Integrated MCP Configuration Wizard...'));
  console.log(chalk.dim('This wizard will help you configure MCP servers for your project.\n'));
  
  try {
    // Step 1: Choose operation
    const operationAnswers = await inquirer.prompt([
      {
        type: 'list',
        name: 'operation',
        message: 'What would you like to do?',
        choices: [
          { name: 'Discover available MCP servers', value: 'discover' },
          { name: 'Add a new MCP server', value: 'add' },
          { name: 'Update an existing MCP server', value: 'update' },
          { name: 'Remove an MCP server', value: 'remove' },
          { name: 'List configured MCP servers', value: 'list' },
          { name: 'Validate configuration', value: 'validate' },
          { name: 'Perform security audit', value: 'security-audit' },
          { name: 'Validate environment variables', value: 'validate-env' },
          { name: 'Create configuration backup', value: 'backup' }
        ]
      }
    ]);
    
    // Handle the selected operation
    switch (operationAnswers.operation) {
      case 'discover':
        await discoverServers(options);
        break;
        
      case 'list':
        await listConfiguredServers();
        break;
        
      case 'add':
        // Step 2: Enter server ID or discover
        const addMethodAnswers = await inquirer.prompt([
          {
            type: 'list',
            name: 'method',
            message: 'How would you like to add a server?',
            choices: [
              { name: 'Enter server ID manually', value: 'manual' },
              { name: 'Discover available servers', value: 'discover' }
            ]
          }
        ]);
        
        if (addMethodAnswers.method === 'discover') {
          await discoverServers(options);
        } else {
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
        break;
        
      case 'update':
        // Get list of configured servers
        const serverList = await wizardCore.listConfiguredServers();
        
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
          break;
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
        
        await configureServer(updateAnswers.serverId, true, options);
        break;
        
      case 'remove':
        // Get list of configured servers
        const removeServerList = await wizardCore.listConfiguredServers();
        
        if (!removeServerList.success || Object.keys(removeServerList.servers).length === 0) {
          logger.info(chalk.yellow('No MCP servers configured to remove.'));
          break;
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
        
        await removeServer(removeAnswers.serverId, options);
        break;
        
      case 'validate':
        await validateConfiguration();
        break;
        
      case 'security-audit':
        // Ask if user wants to auto-fix issues
        const securityAnswers = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'autoFix',
            message: 'Would you like to automatically fix security issues?',
            default: false
          }
        ]);
        
        await auditSecurity(securityAnswers.autoFix);
        break;
        
      case 'validate-env':
        await validateEnvironmentVariables();
        break;
        
      case 'backup':
        await backupConfiguration();
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

module.exports = { configureMcpCommand };