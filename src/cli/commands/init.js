/**
 * Init command for creating new SPARC projects
 */

const chalk = require('chalk');
const { projectGenerator } = require('../../core/project-generator');
const { logger } = require('../../utils');

/**
 * Register the init command with the CLI program
 * @param {import('commander').Command} program - Commander program instance
 */
function initCommand(program) {
  program
    .command('init [name]')
    .description('Create a new SPARC project')
    .option('-t, --template <name>', 'Template to use', 'default')
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
        logger.info(`Creating new SPARC project: ${chalk.cyan(name || 'unnamed')}`);
        
        // Create configuration object from command options
        const config = {
          projectName: name || 'sparc-project', // Provide a default name if none is given
          projectPath: name || '.',
          template: options.template,
          force: options.force || false, // Add force option
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

        // If no name is provided, we're only creating .roo and .roomodes files
        if (!name) {
          // Override the config to only create the required files
          config.skipProjectStructure = true;
        }

        // Generate the project
        await projectGenerator.generateProject(config);
        
        if (config.skipProjectStructure) {
          logger.success(`SPARC files (.roo and .roomodes) created successfully in current directory!`);
        } else {
          logger.success(`Project ${chalk.cyan(name || 'unnamed')} created successfully!`);
          displayNextSteps(config);
        }
      } catch (error) {
        logger.error(`Failed to create project: ${error.message}`);
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
  console.log('\nHappy coding with SPARC! 🚀\n');
}

module.exports = { initCommand };