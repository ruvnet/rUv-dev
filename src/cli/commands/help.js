/**
 * Help command for displaying help information
 */

const chalk = require('chalk');

/**
 * Register the help command with the CLI program
 * @param {import('commander').Command} program - Commander program instance
 */
function helpCommand(program) {
  program
    .command('help [command]')
    .description('Display help for a specific command')
    .action((commandName) => {
      if (commandName) {
        const command = program.commands.find(cmd => 
          cmd.name() === commandName || cmd.aliases().includes(commandName)
        );
        
        if (command) {
          command.help();
        } else {
          console.log(chalk.red(`\nUnknown command: ${commandName}`));
          program.help();
        }
      } else {
        program.help();
      }
    });
}

module.exports = { helpCommand };