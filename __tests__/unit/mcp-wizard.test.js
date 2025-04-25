/**
 * Tests for MCP Configuration Wizard
 */

const path = require('path');
const fs = require('fs-extra');
const { mcpWizard, configGenerator } = require('../../src/core/mcp-wizard');

// Mock server metadata for testing
const mockSupabaseServer = {
  id: 'supabase',
  name: 'Supabase',
  description: 'Supabase MCP server for database operations',
  version: '1.0.0',
  command: 'npx',
  args: [
    '-y',
    '@supabase/mcp-server-supabase@latest'
  ],
  requiredArgs: [
    {
      name: 'access-token',
      description: 'Supabase access token',
      secret: true,
      envVar: 'SUPABASE_ACCESS_TOKEN'
    },
    {
      name: 'project-id',
      description: 'Supabase project ID',
      secret: false
    }
  ],
  optionalArgs: [
    {
      name: 'region',
      description: 'Supabase region',
      default: 'us-east-1'
    }
  ],
  recommendedPermissions: [
    'list_tables',
    'execute_sql',
    'list_projects'
  ],
  tags: ['database', 'backend']
};

const mockOpenAIServer = {
  id: 'openai',
  name: 'OpenAI',
  description: 'OpenAI MCP server for AI operations',
  version: '1.0.0',
  command: 'npx',
  args: [
    '-y',
    '@openai/mcp-server@latest'
  ],
  requiredArgs: [
    {
      name: 'api-key',
      description: 'OpenAI API key',
      secret: true,
      envVar: 'OPENAI_API_KEY'
    }
  ],
  optionalArgs: [
    {
      name: 'organization',
      description: 'OpenAI organization ID',
      secret: false
    }
  ],
  recommendedPermissions: [
    'create_completion',
    'list_models',
    'create_embedding'
  ],
  tags: ['ai', 'nlp']
};

// Setup test directory
const TEST_DIR = path.join(__dirname, '../../.test-tmp');
const TEST_ROO_DIR = path.join(TEST_DIR, '.roo');
const TEST_MCP_CONFIG = path.join(TEST_ROO_DIR, 'mcp.json');
const TEST_ROOMODES = path.join(TEST_DIR, '.roomodes');

// Setup and teardown
beforeEach(async () => {
  await fs.ensureDir(TEST_ROO_DIR);
});

afterEach(async () => {
  await fs.remove(TEST_DIR);
});

describe('MCP Configuration Generator', () => {
  test('generates server configuration', () => {
    const params = {
      'access-token': 'test-token',
      'project-id': 'test-project'
    };
    
    const config = configGenerator.generateServerConfig(mockSupabaseServer, params);
    
    expect(config).toHaveProperty('command', 'npx');
    expect(config).toHaveProperty('args');
    expect(config.args).toContain('-y');
    expect(config.args).toContain('@supabase/mcp-server-supabase@latest');
    expect(config.args).toContain('--access-token');
    expect(config.args).toContain('${env:SUPABASE_ACCESS_TOKEN}');
    expect(config.args).toContain('--project-id');
    expect(config.args).toContain('test-project');
    expect(config).toHaveProperty('alwaysAllow');
    expect(config.alwaysAllow).toContain('list_tables');
    expect(config.alwaysAllow).toContain('execute_sql');
    expect(config.alwaysAllow).toContain('list_projects');
  });
  
  test('generates MCP configuration for multiple servers', () => {
    const servers = [
      {
        metadata: mockSupabaseServer,
        params: {
          'access-token': 'test-token',
          'project-id': 'test-project'
        }
      },
      {
        metadata: mockOpenAIServer,
        params: {
          'api-key': 'test-key'
        }
      }
    ];
    
    const config = configGenerator.generateMcpConfig(servers);
    
    expect(config).toHaveProperty('mcpServers');
    expect(config.mcpServers).toHaveProperty('supabase');
    expect(config.mcpServers).toHaveProperty('openai');
    expect(config.mcpServers.supabase).toHaveProperty('command', 'npx');
    expect(config.mcpServers.openai).toHaveProperty('command', 'npx');
  });
  
  test('generates roomode definition', () => {
    const roomode = configGenerator.generateRoomodeDefinition(mockSupabaseServer);
    
    expect(roomode).toHaveProperty('slug', 'mcp-supabase');
    expect(roomode).toHaveProperty('name', 'Supabase Integration');
    expect(roomode).toHaveProperty('roleDefinition');
    expect(roomode.roleDefinition).toContain('Supabase');
    expect(roomode).toHaveProperty('customInstructions');
    expect(roomode).toHaveProperty('groups');
    expect(roomode.groups).toContain('read');
    expect(roomode.groups).toContain('edit');
    expect(roomode.groups).toContain('mcp');
    expect(roomode.groups).toContain('database');
    expect(roomode).toHaveProperty('source', 'project');
  });
  
  test('validates MCP configuration', () => {
    const validConfig = {
      mcpServers: {
        supabase: {
          command: 'npx',
          args: ['-y', '@supabase/mcp-server-supabase@latest'],
          alwaysAllow: ['list_tables']
        }
      }
    };
    
    const invalidConfig = {
      mcpServers: {
        supabase: {
          command: 'npx',
          // Missing args
          alwaysAllow: ['list_tables']
        }
      }
    };
    
    const validResult = configGenerator.validateMcpConfig(validConfig);
    const invalidResult = configGenerator.validateMcpConfig(invalidConfig);
    
    expect(validResult.valid).toBe(true);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(0);
  });
  
  test('validates roomode definition', () => {
    const validRoomode = {
      slug: 'mcp-supabase',
      name: 'Supabase Integration',
      roleDefinition: 'Test role definition',
      customInstructions: 'Test instructions',
      groups: ['read', 'edit', 'mcp'],
      source: 'project'
    };
    
    const invalidRoomode = {
      slug: 'supabase', // Missing mcp- prefix
      name: 'Supabase Integration',
      roleDefinition: 'Test role definition',
      customInstructions: 'Test instructions',
      groups: ['read', 'edit'], // Missing mcp group
      source: 'project'
    };
    
    const validResult = configGenerator.validateRoomodeDefinition(validRoomode);
    const invalidResult = configGenerator.validateRoomodeDefinition(invalidRoomode);
    
    expect(validResult.valid).toBe(true);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(0);
  });
  
  test('merges roomodes', () => {
    const existingRoomodes = {
      customModes: [
        {
          slug: 'mcp-supabase',
          name: 'Custom Supabase',
          roleDefinition: 'Custom role definition',
          customInstructions: 'Custom instructions',
          groups: ['read', 'edit', 'mcp'],
          source: 'project'
        },
        {
          slug: 'other-mode',
          name: 'Other Mode',
          roleDefinition: 'Other role',
          customInstructions: 'Other instructions',
          groups: ['read'],
          source: 'project'
        }
      ]
    };
    
    const newRoomodes = [
      {
        slug: 'mcp-supabase',
        name: 'Supabase Integration',
        roleDefinition: 'New role definition',
        customInstructions: 'New instructions',
        groups: ['read', 'edit', 'mcp', 'database'],
        source: 'project'
      },
      {
        slug: 'mcp-openai',
        name: 'OpenAI Integration',
        roleDefinition: 'OpenAI role',
        customInstructions: 'OpenAI instructions',
        groups: ['read', 'edit', 'mcp', 'ai'],
        source: 'project'
      }
    ];
    
    const mergedRoomodes = configGenerator.mergeRoomodes(newRoomodes, existingRoomodes);
    
    expect(mergedRoomodes.customModes.length).toBe(3);
    
    // Check that existing mode was updated
    const supabaseMode = mergedRoomodes.customModes.find(mode => mode.slug === 'mcp-supabase');
    expect(supabaseMode).toBeDefined();
    expect(supabaseMode.name).toBe('Custom Supabase'); // Preserved
    expect(supabaseMode.roleDefinition).toBe('New role definition'); // Updated
    expect(supabaseMode.customInstructions).toBe('Custom instructions'); // Preserved
    expect(supabaseMode.groups).toContain('database'); // Added new group
    
    // Check that new mode was added
    const openaiMode = mergedRoomodes.customModes.find(mode => mode.slug === 'mcp-openai');
    expect(openaiMode).toBeDefined();
    
    // Check that other mode was preserved
    const otherMode = mergedRoomodes.customModes.find(mode => mode.slug === 'other-mode');
    expect(otherMode).toBeDefined();
  });
});

describe('MCP Wizard', () => {
  test('configures servers', async () => {
    const servers = [
      {
        metadata: mockSupabaseServer,
        params: {
          'access-token': 'test-token',
          'project-id': 'test-project'
        }
      }
    ];
    
    const options = {
      projectPath: TEST_DIR,
      mcpConfigPath: '.roo/mcp.json',
      roomodesPath: '.roomodes',
      mergeExisting: false
    };
    
    const result = await mcpWizard.configureServers(servers, options);
    
    expect(result.success).toBe(true);
    expect(result).toHaveProperty('mcpConfig');
    expect(result).toHaveProperty('roomodes');
    
    // Check that files were created
    const mcpConfigExists = await fs.pathExists(TEST_MCP_CONFIG);
    const roomodesExists = await fs.pathExists(TEST_ROOMODES);
    
    expect(mcpConfigExists).toBe(true);
    expect(roomodesExists).toBe(true);
    
    // Check file contents
    const mcpConfig = await fs.readJson(TEST_MCP_CONFIG);
    const roomodes = await fs.readJson(TEST_ROOMODES);
    
    expect(mcpConfig).toHaveProperty('mcpServers.supabase');
    expect(roomodes).toHaveProperty('customModes');
    expect(roomodes.customModes.length).toBe(1);
    expect(roomodes.customModes[0].slug).toBe('mcp-supabase');
  });
  
  test('adds server to existing configuration', async () => {
    // Create initial configuration
    await fs.ensureDir(TEST_ROO_DIR);
    await fs.writeJson(TEST_MCP_CONFIG, {
      mcpServers: {
        supabase: {
          command: 'npx',
          args: ['-y', '@supabase/mcp-server-supabase@latest'],
          alwaysAllow: ['list_tables']
        }
      }
    });
    
    await fs.writeJson(TEST_ROOMODES, {
      customModes: [
        {
          slug: 'mcp-supabase',
          name: 'Supabase Integration',
          roleDefinition: 'Test role',
          customInstructions: 'Test instructions',
          groups: ['read', 'edit', 'mcp'],
          source: 'project'
        }
      ]
    });
    
    const options = {
      projectPath: TEST_DIR,
      mcpConfigPath: '.roo/mcp.json',
      roomodesPath: '.roomodes'
    };
    
    const result = await mcpWizard.addServer(mockOpenAIServer, { 'api-key': 'test-key' }, options);
    
    expect(result.success).toBe(true);
    
    // Check updated files
    const mcpConfig = await fs.readJson(TEST_MCP_CONFIG);
    const roomodes = await fs.readJson(TEST_ROOMODES);
    
    expect(mcpConfig.mcpServers).toHaveProperty('supabase');
    expect(mcpConfig.mcpServers).toHaveProperty('openai');
    expect(roomodes.customModes.length).toBe(2);
    
    const openaiMode = roomodes.customModes.find(mode => mode.slug === 'mcp-openai');
    expect(openaiMode).toBeDefined();
  });
  
  test('removes server from configuration', async () => {
    // Create initial configuration with two servers
    await fs.ensureDir(TEST_ROO_DIR);
    await fs.writeJson(TEST_MCP_CONFIG, {
      mcpServers: {
        supabase: {
          command: 'npx',
          args: ['-y', '@supabase/mcp-server-supabase@latest'],
          alwaysAllow: ['list_tables']
        },
        openai: {
          command: 'npx',
          args: ['-y', '@openai/mcp-server@latest'],
          alwaysAllow: ['list_models']
        }
      }
    });
    
    await fs.writeJson(TEST_ROOMODES, {
      customModes: [
        {
          slug: 'mcp-supabase',
          name: 'Supabase Integration',
          roleDefinition: 'Test role',
          customInstructions: 'Test instructions',
          groups: ['read', 'edit', 'mcp'],
          source: 'project'
        },
        {
          slug: 'mcp-openai',
          name: 'OpenAI Integration',
          roleDefinition: 'Test role',
          customInstructions: 'Test instructions',
          groups: ['read', 'edit', 'mcp'],
          source: 'project'
        }
      ]
    });
    
    const options = {
      projectPath: TEST_DIR,
      mcpConfigPath: '.roo/mcp.json',
      roomodesPath: '.roomodes'
    };
    
    const result = await mcpWizard.removeServer('openai', options);
    
    expect(result.success).toBe(true);
    
    // Check updated files
    const mcpConfig = await fs.readJson(TEST_MCP_CONFIG);
    const roomodes = await fs.readJson(TEST_ROOMODES);
    
    expect(mcpConfig.mcpServers).toHaveProperty('supabase');
    expect(mcpConfig.mcpServers).not.toHaveProperty('openai');
    expect(roomodes.customModes.length).toBe(1);
    expect(roomodes.customModes[0].slug).toBe('mcp-supabase');
  });
  
  test('lists configured servers', async () => {
    // Create initial configuration
    await fs.ensureDir(TEST_ROO_DIR);
    await fs.writeJson(TEST_MCP_CONFIG, {
      mcpServers: {
        supabase: {
          command: 'npx',
          args: ['-y', '@supabase/mcp-server-supabase@latest'],
          alwaysAllow: ['list_tables']
        },
        openai: {
          command: 'npx',
          args: ['-y', '@openai/mcp-server@latest'],
          alwaysAllow: ['list_models']
        }
      }
    });
    
    const options = {
      projectPath: TEST_DIR,
      mcpConfigPath: '.roo/mcp.json'
    };
    
    const result = await mcpWizard.listServers(options);
    
    expect(result.success).toBe(true);
    expect(result).toHaveProperty('servers');
    expect(result.servers).toHaveProperty('supabase');
    expect(result.servers).toHaveProperty('openai');
    expect(result.servers.supabase).toHaveProperty('command', 'npx');
    expect(result.servers.openai).toHaveProperty('command', 'npx');
  });
});