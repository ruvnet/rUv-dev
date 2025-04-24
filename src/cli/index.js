/**
 * CLI entry point for create-sparc
 */

const { program } = require('commander');
const chalk = require('chalk');
const pkg = require('../../package.json');
const { initCommand } = require('./commands/init');
const { addCommand } = require('./commands/add');
const { helpCommand } = require('./commands/help');
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
      .option('--verbose', 'Enable verbose output');

    // Register commands
    initCommand(program);
    addCommand(program);
    helpCommand(program);

    // Handle unknown commands
    program.on('command:*', () => {
      const errorMessage = chalk.red(`\nError: Invalid command: ${program.args.join(' ')}`);
      console.error(errorMessage);
      console.log(`See ${chalk.cyan('--help')} for a list of available commands.\n`);
      
      // Don't exit the process during tests
      if (process.env.NODE_ENV !== 'test') {
        process.exit(1);
      } else {
        throw new Error(`Invalid command: ${program.args.join(' ')}`);
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