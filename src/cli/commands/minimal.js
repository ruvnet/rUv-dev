/**
 * Minimal command for creating minimal Roo mode framework
 */

const chalk = require('chalk');
const { projectGenerator } = require('../../core/project-generator');
const { logger } = require('../../utils');

/**
 * Register the minimal command with the CLI program
 * @param {import('commander').Command} program - Commander program instance
 */
function minimalCommand(program) {
  // Create a command group for minimal commands
  const minimalGroup = program
    .command('minimal')
    .description('Commands for creating minimal Roo mode framework')
    .addHelpText('after', `
  Examples:
    $ npx create-sparc minimal init my-project     Create a new minimal Roo mode framework
    $ npx create-sparc minimal init                Initialize minimal Roo mode files in current directory
    `);

  // Add the init subcommand to the minimal command group
  minimalGroup
    .command('init [name]')
    .description('Create a new minimal Roo mode framework')
    .option('-f, --force', 'Allow initialization in non-empty directories')
    .option('--skip-install', 'Skip dependency installation')
    .option('--use-npm', 'Use npm as package manager')
    .option('--use-yarn', 'Use yarn as package manager')
    .option('--use-pnpm', 'Use pnpm as package manager')
    .option('--no-git', 'Skip git initialization')
    .option('--typescript', 'Use TypeScript')
    .option('--no-symlink', 'Disable symlink creation')
    .action(async (name, options) => {
      try {
        console.log('Options:', options); // Debug: Log options
        logger.info(`Creating new minimal Roo mode framework: ${chalk.cyan(name || 'unnamed')}`);
        
        // Create configuration object from command options
        const config = {
          projectName: name || 'minimal-roo-project', // Provide a default name if none is given
          projectPath: name || '.',
          sourceDir: 'templates/minimal-roo', // Set the source directory to templates/minimal-roo
          force: options.force || false,
          installDependencies: !options.skipInstall,
          symlink: {
            enabled: options.symlink !== false,
            paths: ['.roo', '.roomodes']
          },
          features: {
            typescript: options.typescript || false,
            testing: true,
            cicd: false
          },
          npmClient: determineNpmClient(options),
          git: {
            init: options.git !== false,
            initialCommit: options.git !== false
          },
          verbose: options.verbose || false
        };
        
        console.log('Config:', config); // Debug: Log config

        // If no name is provided, we're only creating .roo and .roomodes files
        if (!name) {
          // Override the config to only create the required files
          config.skipProjectStructure = true;
        }

        // Generate the project
        await projectGenerator.generateProject(config);
        
        if (config.skipProjectStructure) {
          logger.success(`Minimal Roo mode framework files (.roo and .roomodes) created successfully in current directory!`);
        } else {
          logger.success(`Minimal Roo mode framework ${chalk.cyan(name || 'unnamed')} created successfully!`);
          displayNextSteps(config);
        }
      } catch (error) {
        logger.error(`Failed to create minimal Roo mode framework: ${error.message}`);
        if (process.env.DEBUG) {
          console.error(error);
        }
        process.exit(1);
      }
    });
}

/**
 * Determine which package manager to use based on options
 * @param {Object} options - Command options
 * @returns {string} - Package manager name (npm, yarn, or pnpm)
 */
function determineNpmClient(options) {
  if (options.useYarn) return 'yarn';
  if (options.usePnpm) return 'pnpm';
  return 'npm';
}

/**
 * Display next steps after project creation
 * @param {Object} config - Project configuration
 */
function displayNextSteps(config) {
  const projectPath = config.projectName ? `cd ${config.projectName}` : '';
  
  console.log('\n' + chalk.bold('Next steps:'));
  
  if (projectPath) {
    console.log(`  ${chalk.cyan(projectPath)}`);
  }
  
  if (!config.installDependencies) {
    const installCmd = `${config.npmClient} install`;
    console.log(`  ${chalk.cyan(installCmd)}`);
  }
  
  console.log(`  ${chalk.cyan(`${config.npmClient} start`)}`);
  console.log('\nHappy coding with your minimal Roo mode framework! 🚀\n');
}

module.exports = { minimalCommand };