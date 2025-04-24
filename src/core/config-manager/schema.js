/**
 * Configuration schema for create-sparc
 */

/**
 * Configuration schema definition
 */
const configSchema = {
  type: 'object',
  properties: {
    projectName: {
      type: 'string',
      description: 'Name of the project',
      pattern: '^[a-zA-Z0-9-_]+$'
    },
    projectPath: {
      type: 'string',
      description: 'Path to the project directory'
    },
    template: {
      type: 'string',
      description: 'Template to use for project generation',
      default: 'default'
    },
    installDependencies: {
      type: 'boolean',
      description: 'Whether to install dependencies',
      default: true
    },
    symlink: {
      type: 'object',
      properties: {
        enabled: {
          type: 'boolean',
          description: 'Whether to use symlinks',
          default: true
        },
        paths: {
          type: 'array',
          items: {
            type: 'string'
          },
          default: ['.roo', '.roomodes']
        }
      }
    },
    features: {
      type: 'object',
      properties: {
        typescript: {
          type: 'boolean',
          default: false
        },
        testing: {
          type: 'boolean',
          default: true
        },
        cicd: {
          type: 'boolean',
          default: false
        }
      }
    },
    npmClient: {
      type: 'string',
      enum: ['npm', 'yarn', 'pnpm'],
      default: 'npm'
    },
    git: {
      type: 'object',
      properties: {
        init: {
          type: 'boolean',
          default: true
        },
        initialCommit: {
          type: 'boolean',
          default: true
        }
      }
    },
    verbose: {
      type: 'boolean',
      default: false
    }
  },
  required: ['projectName', 'projectPath']
};

module.exports = { configSchema };