/**
 * Help command for displaying help information
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

// Try to load marked and marked-terminal, but don't fail if they're not installed
let marked;
let TerminalRenderer;
try {
  marked = require('marked');
  TerminalRenderer = require('marked-terminal');
  
  // Configure marked to render for the terminal
  marked.setOptions({
    renderer: new TerminalRenderer()
  });
} catch (error) {
  // Modules not available, will fall back to displaying raw markdown
  console.log(chalk.yellow('Note: Install marked and marked-terminal for better help formatting'));
}

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
        // First try to find a dedicated help file
        const helpFilePath = path.join(__dirname, 'help', `${commandName}.md`);
        
        if (fs.existsSync(helpFilePath)) {
          // Read and display the markdown help file
          const helpContent = fs.readFileSync(helpFilePath, 'utf8');
          
          if (marked) {
            // Use marked for formatted output if available
            console.log(marked(helpContent));
          } else {
            // Fall back to displaying raw markdown
            console.log(helpContent);
          }
        } else {
          // Fall back to command's built-in help
          const command = program.commands.find(cmd =>
            cmd.name() === commandName || cmd.aliases().includes(commandName)
          );
          
          if (command) {
            command.help();
          } else {
            console.log(chalk.red(`\nUnknown command: ${commandName}`));
            program.help();
          }
        }
      } else {
        program.help();
      }
    });
}

module.exports = { helpCommand };