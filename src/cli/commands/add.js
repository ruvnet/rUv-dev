/**
 * Add command for adding components to existing SPARC projects
 */

const chalk = require('chalk');
const { projectGenerator } = require('../../core/project-generator');
const { configManager } = require('../../core/config-manager');
const { logger } = require('../../utils');

/**
 * Register the add command with the CLI program
 * @param {import('commander').Command} program - Commander program instance
 */
function addCommand(program) {
  program
    .command('add [component]')
    .description('Add a component to an existing SPARC project')
    .option('-n, --name <name>', 'Component name')
    .option('-t, --type <type>', 'Component type', 'component')
    .option('-p, --path <path>', 'Custom path for component')
    .action(async (component, options) => {
      try {
        // Validate component type
        if (!component) {
          logger.error('Component type is required');
          console.log(`See ${chalk.cyan('--help')} for usage information.`);
          process.exit(1);
        }

        // Find project configuration
        const projectConfig = await configManager.findProjectConfig();
        if (!projectConfig) {
          logger.error('Not in a SPARC project directory');
          logger.info('Run this command from within a SPARC project or use the init command to create a new project.');
          process.exit(1);
        }

        logger.info(`Adding ${chalk.cyan(component)} to project`);
        
        // Create component configuration
        const componentConfig = {
          name: options.name || component,
          type: options.type,
          path: options.path,
          projectConfig
        };

        // Add component to project
        await projectGenerator.addComponent(componentConfig);
        
        logger.success(`Component ${chalk.cyan(componentConfig.name)} added successfully!`);
      } catch (error) {
        logger.error(`Failed to add component: ${error.message}`);
        if (process.env.DEBUG) {
          console.error(error);
        }
        process.exit(1);
      }
    });
}

module.exports = { addCommand };