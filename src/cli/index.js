/**
 * CLI entry point for create-sparc
 */

const { program } = require('commander');
const chalk = require('chalk');
const pkg = require('../../package.json');
const { initCommand } = require('./commands/init');
const { addCommand } = require('./commands/add');
const { helpCommand } = require('./commands/help');
const { wizardCommand } = require('./commands/wizard');
const { configureMcpCommand } = require('./commands/configure-mcp');
const { aigiCommand } = require('./commands/aigi');
const { minimalCommand } = require('./commands/minimal');
const { logger } = require('../utils');

/**
 * Configure and run the CLI
 * @param {string[]} args - Command line arguments
 * @returns {Promise<string|void>}
 */
async function run(args) {
  try {
    // Configure the program
    program
      .name('create-sparc')
      .description('Scaffold new projects with SPARC methodology structure')
      .version(pkg.version, '-v, --version', 'Display version number')
      .option('-d, --debug', 'Enable debug mode')
      .option('--verbose', 'Enable verbose output')
      .addHelpText('beforeAll', `
  Usage Examples:
    $ npx create-sparc init [project-name]     Create a new SPARC project
    $ npx create-sparc aigi init [project-name] Create a new AIGI project
    $ npx create-sparc minimal init [project-name] Create a new minimal Roo mode framework
    
    When running directly with Node:
    $ node bin/index.js init [project-name]     Create a new SPARC project
    $ node bin/index.js aigi init [project-name] Create a new AIGI project
    $ node bin/index.js minimal init [project-name] Create a new minimal Roo mode framework
    
    Note: Do not use 'create-sparc' as a command when running with Node directly.
    Incorrect: node bin/index.js create-sparc init
    Correct:   node bin/index.js init
`);

    // Register commands
    initCommand(program);
    addCommand(program);
    helpCommand(program);
    wizardCommand(program);
    configureMcpCommand(program);
    aigiCommand(program);
    minimalCommand(program);

    // Handle unknown commands
    program.on('command:*', () => {
      const invalidCommand = program.args.join(' ');
      let errorMessage = chalk.red(`\nError: Invalid command: ${invalidCommand}`);
      
      // Provide specific guidance for common mistakes
      if (invalidCommand.includes('create-sparc')) {
        errorMessage += chalk.yellow(`\n\nIt looks like you're trying to use 'create-sparc' as part of the command.
When running with Node directly, you should use:
  ${chalk.green('node bin/index.js init [name]')} or ${chalk.green('node bin/index.js aigi init [name]')}

When using npx, use:
  ${chalk.green('npx create-sparc init [name]')} or ${chalk.green('npx create-sparc aigi init [name]')}`);
      }
      
      console.error(errorMessage);
      console.log(`\nSee ${chalk.cyan('--help')} for a list of available commands and examples.\n`);
      
      // Don't exit the process during tests
      if (process.env.NODE_ENV !== 'test') {
        process.exit(1);
      } else {
        throw new Error(`Invalid command: ${invalidCommand}`);
      }
    });

    // Set up global options handling
    program.hook('preAction', (thisCommand) => {
      if (thisCommand.opts().debug) {
        process.env.DEBUG = 'true';
        logger.setLevel('debug');
        logger.debug('Debug mode enabled');
      } else if (thisCommand.opts().verbose) {
        logger.setLevel('verbose');
        logger.verbose('Verbose mode enabled');
      }
    });

    // If no command is provided, show help
    if (!args || args.length <= 2) {
      program.outputHelp();
      // Return the help text for testing
      return program.name() + ' - ' + program.description();
    }

    // Parse arguments and execute command
    await program.parseAsync(args);
    
  } catch (error) {
    console.error(chalk.red(`\nError executing command: ${error.message}`));
    
    // Don't exit the process during tests
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    } else {
      throw error; // Re-throw for tests to catch
    }
  }
}

module.exports = { run };