/**
 * Project Generator for create-sparc
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const os = require('os');
const { logger, errorHandler, fsUtils, pathUtils } = require('../../utils');
const { fileManager } = require('../file-manager');
const { symlinkManager } = require('../file-manager/symlink');
const { configManager } = require('../config-manager');

/**
 * Project Generator
 */
const projectGenerator = {
  /**
   * Generate a new SPARC project
   * @param {Object} config - Project configuration
   * @returns {Promise<void>}
   */
  async generateProject(config) {
    logger.debug('Starting project generation');
    
    // Validate configuration
    const validationResult = configManager.validateConfig(config);
    if (!validationResult.valid) {
      const errors = validationResult.errors.map(err => `  - ${err.property}: ${err.message}`).join('\n');
      throw new Error(`Invalid configuration:\n${errors}`);
    }
    
    // Create project directory
    const spinner = ora('Creating project directory').start();
    try {
      await this._createProjectDirectory(config);
      spinner.succeed('Project directory created');
    } catch (error) {
      spinner.fail('Failed to create project directory');
      throw error;
    }
    
    // Setup SPARC structure
    spinner.text = 'Setting up SPARC structure';
    spinner.start();
    try {
      await this._setupSparcStructure(config);
      spinner.succeed('SPARC structure set up');
    } catch (error) {
      spinner.fail('Failed to set up SPARC structure');
      throw error;
    }
    
    // Generate configuration files
    spinner.text = 'Generating configuration files';
    spinner.start();
    try {
      await this._generateConfigFiles(config);
      spinner.succeed('Configuration files generated');
    } catch (error) {
      spinner.fail('Failed to generate configuration files');
      throw error;
    }
    
    // Skip dependency installation and git initialization if we're only creating .roo and .roomodes files
    if (!config.skipProjectStructure) {
      // Install dependencies if requested
      if (config.installDependencies) {
        spinner.text = 'Installing dependencies';
        spinner.start();
        try {
          await this._installDependencies(config);
          spinner.succeed('Dependencies installed');
        } catch (error) {
          spinner.fail('Failed to install dependencies');
          logger.warn('You can install dependencies manually later');
        }
      }
      
      // Initialize git if requested
      if (config.git && config.git.init) {
        spinner.text = 'Initializing git repository';
        spinner.start();
        try {
          await this._initializeGit(config);
          spinner.succeed('Git repository initialized');
        } catch (error) {
          spinner.fail('Failed to initialize git repository');
          logger.warn('You can initialize git manually later');
        }
      }
    }
    
    logger.debug('Project generation completed');
  },
  
  /**
   * Add a component to an existing project
   * @param {Object} componentConfig - Component configuration
   * @returns {Promise<void>}
   */
  async addComponent(componentConfig) {
    logger.debug(`Adding component: ${componentConfig.name}`);
    
    // Validate component configuration
    if (!componentConfig.name) {
      throw new Error('Component name is required');
    }
    
    // TODO: Implement component addition logic
    
    logger.debug('Component added successfully');
  },
  
  /**
   * Create the project directory
   * @param {Object} config - Project configuration
   * @returns {Promise<void>}
   * @private
   */
  async _createProjectDirectory(config) {
    const projectPath = pathUtils.resolve(config.projectPath);
    
    // Check if directory already exists
    if (await fsUtils.exists(projectPath)) {
      if (config.projectPath === '.') {
        // Current directory, check if it's empty
        const files = await fs.readdir(projectPath);
        const nonHiddenFiles = files.filter(file => !file.startsWith('.') && file !== 'node_modules');
        
        if (nonHiddenFiles.length > 0 && !config.force) {
          throw new Error('Current directory is not empty. Use a new directory, empty the current one, or use --force option.');
        }
      } else if (!config.force) {
        throw new Error(`Directory ${config.projectPath} already exists. Use --force option to initialize anyway.`);
      }
    } else {
      // Create the directory
      await fs.mkdir(projectPath, { recursive: true });
    }
  },
  
  /**
   * Set up SPARC structure
   * @param {Object} config - Project configuration
   * @returns {Promise<void>}
   * @private
   */
  async _setupSparcStructure(config) {
    const projectPath = pathUtils.resolve(config.projectPath);
    
    // If skipProjectStructure is true, only copy the .roo and .roomodes files
    if (config.skipProjectStructure) {
      logger.debug('Skipping project structure creation, only copying .roo and .roomodes files');
      await this._copySparcFiles(config);
      return;
    }
    
    // Create basic project structure
    await fs.mkdir(path.join(projectPath, 'src'), { recursive: true });
    
    // Create tests directory structure with index files
    await fs.mkdir(path.join(projectPath, 'tests'), { recursive: true });
    await fs.mkdir(path.join(projectPath, 'tests/unit'), { recursive: true });
    await fs.mkdir(path.join(projectPath, 'tests/integration'), { recursive: true });
    
    // Create index.js and index.ts in tests directory
    await fs.writeFile(path.join(projectPath, 'tests/index.js'), '// Test entry point\n');
    await fs.writeFile(path.join(projectPath, 'tests/index.ts'), '// TypeScript test entry point\n');
    
    // Copy .roo directory and .roomodes file to the project
    await this._copySparcFiles(config);
  },
  
  /**
   * Copy SPARC files (.roo directory and .roomodes file) to the project
   * @param {Object} config - Project configuration
   * @returns {Promise<void>}
   * @private
   */
  async _copySparcFiles(config) {
    const projectPath = pathUtils.resolve(config.projectPath);
    
    // Get paths to the actual .roo directory and .roomodes file
    // Use custom source directory if provided, otherwise use the root directory
    // Find the package root directory (where package.json is located)
    const packageRoot = path.resolve(__dirname, '../../../');
    
    // Resolve the source directory as an absolute path
    const rootDir = config.sourceDir
      ? path.resolve(packageRoot, config.sourceDir)
      : packageRoot;
    
    console.log('Package root:', packageRoot); // Debug: Log package root
    console.log('Root directory:', rootDir); // Debug: Log root directory
    console.log('Project path:', projectPath); // Debug: Log project path
    
    // Copy standard SPARC files (.roo and .roomodes)
    for (const filePath of config.symlink.paths) {
      const sourcePath = path.join(rootDir, filePath);
      const targetPath = path.join(projectPath, filePath);
      
      console.log(`Copying ${filePath} from ${sourcePath} to ${targetPath}`); // Debug: Log copy operation
      
      // Ensure source exists
      if (!await fsUtils.exists(sourcePath)) {
        console.error(`Source path not found: ${sourcePath}`); // Debug: Log error
        throw new Error(`Source path not found: ${sourcePath}`);
      }
      
      // Copy directory or file
      if (await fsUtils.isDirectory(sourcePath)) {
        logger.debug(`Copying directory: ${sourcePath} to ${targetPath}`);
        await fs.copy(sourcePath, targetPath);
      } else {
        // Ensure parent directory exists
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        logger.debug(`Copying file: ${sourcePath} to ${targetPath}`);
        await fs.copy(sourcePath, targetPath);
      }
      
      logger.debug(`Successfully copied ${filePath} to project`);
    }
    
    // If this is an AIGI project, also copy the aigi.md file
    if (config.sourceDir === 'aiGI') {
      const aigiMdSource = path.join(rootDir, 'aigi.md');
      const aigiMdTarget = path.join(projectPath, 'aigi.md');
      
      console.log(`Checking for aigi.md at ${aigiMdSource}`); // Debug: Log aigi.md path
      
      // Check if aigi.md exists in the source directory
      if (await fsUtils.exists(aigiMdSource)) {
        logger.debug(`Copying aigi.md from ${aigiMdSource} to ${aigiMdTarget}`);
        await fs.copy(aigiMdSource, aigiMdTarget);
        logger.debug('Successfully copied aigi.md to project');
      } else {
        logger.debug(`aigi.md not found at ${aigiMdSource}`);
        
        // Try alternative locations if the file is not found
        const altLocations = [
          path.join(packageRoot, 'aiGI', 'aigi.md'),
          path.join(process.cwd(), 'aiGI', 'aigi.md')
        ];
        
        for (const altPath of altLocations) {
          console.log(`Trying alternative path: ${altPath}`); // Debug: Log alternative path
          
          if (await fsUtils.exists(altPath)) {
            logger.debug(`Found aigi.md at alternative location: ${altPath}`);
            await fs.copy(altPath, aigiMdTarget);
            logger.debug('Successfully copied aigi.md to project from alternative location');
            break;
          }
        }
      }
    }
  },
  
  /**
   * Generate configuration files
   * @param {Object} config - Project configuration
   * @returns {Promise<void>}
   * @private
   */
  async _generateConfigFiles(config) {
    const projectPath = pathUtils.resolve(config.projectPath);
    
    // If skipProjectStructure is true, skip generating project files
    if (config.skipProjectStructure) {
      logger.debug('Skipping configuration file generation');
      return;
    }
    
    // Generate package.json
    const packageJson = {
      name: config.projectName || path.basename(projectPath),
      version: '0.1.0',
      description: 'A project created with SPARC methodology',
      main: 'src/index.js',
      scripts: {
        start: 'node src/index.js',
        test: 'echo "Error: no test specified" && exit 1'
      },
      keywords: ['sparc'],
      author: '',
      license: 'MIT',
      dependencies: {},
      devDependencies: {}
    };
    
    // Add TypeScript configuration if requested
    if (config.features && config.features.typescript) {
      packageJson.main = 'dist/index.js';
      packageJson.scripts.build = 'tsc';
      packageJson.scripts.start = 'node dist/index.js';
      packageJson.devDependencies.typescript = '^4.9.5';
      
      // Create tsconfig.json
      const tsConfig = {
        compilerOptions: {
          target: 'es2020',
          module: 'commonjs',
          outDir: './dist',
          rootDir: './src',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true
        },
        include: ['src/**/*'],
        exclude: ['node_modules', '**/*.test.ts']
      };
      
      await fs.writeJson(path.join(projectPath, 'tsconfig.json'), tsConfig, { spaces: 2 });
    }
    
    // Write package.json
    await fs.writeJson(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 });
    
    // Create README.md
    const readmeContent = `# ${config.projectName || 'SPARC Project'}

A project created with SPARC methodology.

## Getting Started

\`\`\`bash
# Install dependencies
${config.npmClient} install

# Start the project
${config.npmClient} start
\`\`\`

## Project Structure

This project follows the SPARC methodology:

- **S**pecification
- **P**seudocode
- **A**rchitecture
- **R**efinement
- **C**ompletion

## License

MIT
`;
    
    await fs.writeFile(path.join(projectPath, 'README.md'), readmeContent);
    
    // Create basic source file
    const indexContent = config.features && config.features.typescript
      ? `/**
 * Main entry point
 */

export function main(): void {
  console.log('Hello from SPARC!');
}

main();
`
      : `/**
 * Main entry point
 */

function main() {
  console.log('Hello from SPARC!');
}

main();
`;
    
    // Ensure src directory exists
    await fs.ensureDir(path.join(projectPath, 'src'));
    
    // Create index.js/ts in src directory
    await fs.writeFile(
      path.join(projectPath, 'src', 'index.' + (config.features && config.features.typescript ? 'ts' : 'js')),
      indexContent
    );
    
    // Create tests directory and index files if they don't exist yet
    await fs.ensureDir(path.join(projectPath, 'tests'));
    
    // Create index.js in tests directory
    await fs.writeFile(
      path.join(projectPath, 'tests', 'index.js'),
      '// Test entry point\n'
    );
    
    // Create index.ts in tests directory
    await fs.writeFile(
      path.join(projectPath, 'tests', 'index.ts'),
      '// TypeScript test entry point\n'
    );
  },
  
  /**
   * Install dependencies
   * @param {Object} config - Project configuration
   * @returns {Promise<void>}
   * @private
   */
  async _installDependencies(config) {
    const projectPath = pathUtils.resolve(config.projectPath);
    const { execSync } = require('child_process');
    
    // Determine package manager command
    const command = config.npmClient || 'npm';
    
    try {
      execSync(`${command} install`, {
        cwd: projectPath,
        stdio: config.verbose ? 'inherit' : 'pipe'
      });
    } catch (error) {
      throw new Error(`Failed to install dependencies: ${error.message}`);
    }
  },
  
  /**
   * Initialize git repository
   * @param {Object} config - Project configuration
   * @returns {Promise<void>}
   * @private
   */
  async _initializeGit(config) {
    const projectPath = pathUtils.resolve(config.projectPath);
    const { execSync } = require('child_process');
    
    try {
      // Initialize git repository
      execSync('git init', {
        cwd: projectPath,
        stdio: config.verbose ? 'inherit' : 'pipe'
      });
      
      // Create .gitignore
      const gitignoreContent = `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
.pnpm-debug.log*

# Diagnostic reports (https://nodejs.org/api/report.html)
report.[0-9]*.[0-9]*.[0-9]*.[0-9]*.json

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Directory for instrumented libs generated by jscoverage/JSCover
lib-cov

# Coverage directory used by tools like istanbul
coverage
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Build output
dist/
build/

# Environment variables
.env
.env.development.local
.env.test.local
.env.production.local
.env.local

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next
out

# Nuxt.js build / generate output
.nuxt

# IDE files
.idea/
.vscode/
*.sublime-project
*.sublime-workspace

# OS files
.DS_Store
Thumbs.db
`;
      
      await fs.writeFile(path.join(projectPath, '.gitignore'), gitignoreContent);
      
      // Initial commit if requested
      if (config.git.initialCommit) {
        execSync('git add .', {
          cwd: projectPath,
          stdio: config.verbose ? 'inherit' : 'pipe'
        });
        
        execSync('git commit -m "Initial commit"', {
          cwd: projectPath,
          stdio: config.verbose ? 'inherit' : 'pipe'
        });
      }
    } catch (error) {
      throw new Error(`Failed to initialize git repository: ${error.message}`);
    }
  }
};

module.exports = { projectGenerator };