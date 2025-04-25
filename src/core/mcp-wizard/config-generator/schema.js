/**
 * MCP Configuration Schema
 * Defines the structure and validation rules for MCP.json configurations
 */

/**
 * MCP Configuration Schema
 */
const mcpConfigSchema = {
  type: 'object',
  properties: {
    mcpServers: {
      type: 'object',
      patternProperties: {
        '^[a-zA-Z0-9-_]+$': {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'The command to run the MCP server'
            },
            args: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Arguments to pass to the MCP server command'
            },
            alwaysAllow: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'List of permissions to always allow for this server'
            },
            env: {
              type: 'object',
              description: 'Environment variables to set when running the server'
            }
          },
          required: ['command', 'args'],
          additionalProperties: false
        }
      },
      additionalProperties: false
    }
  },
  required: ['mcpServers'],
  additionalProperties: false
};

/**
 * Roomode Schema for MCP Integration
 */
const mcpRoomodeSchema = {
  type: 'object',
  properties: {
    slug: {
      type: 'string',
      pattern: '^mcp-[a-zA-Z0-9-_]+$',
      description: 'Unique identifier for the mode'
    },
    name: {
      type: 'string',
      description: 'Display name for the mode'
    },
    model: {
      type: 'string',
      description: 'The AI model to use',
      default: 'claude-3-7-sonnet-20250219'
    },
    roleDefinition: {
      type: 'string',
      description: 'Role definition for the AI assistant'
    },
    customInstructions: {
      type: 'string',
      description: 'Custom instructions for the AI assistant'
    },
    groups: {
      type: 'array',
      items: {
        oneOf: [
          {
            type: 'string',
            enum: ['read', 'edit', 'mcp', 'database', 'ai', 'cloud', 'command', 'browser']
          },
          {
            type: 'array',
            items: [
              {
                type: 'string',
                enum: ['read', 'edit', 'mcp', 'database', 'ai', 'cloud', 'command', 'browser']
              },
              {
                type: 'object',
                properties: {
                  fileRegex: {
                    type: 'string'
                  },
                  description: {
                    type: 'string'
                  }
                },
                required: ['fileRegex']
              }
            ]
          }
        ]
      },
      description: 'Permission groups for the mode'
    },
    source: {
      type: 'string',
      enum: ['project', 'user', 'system', 'global'],
      description: 'Source of the mode definition'
    }
  },
  required: ['slug', 'name', 'roleDefinition', 'groups', 'source'],
  additionalProperties: false
};

module.exports = {
  mcpConfigSchema,
  mcpRoomodeSchema
};