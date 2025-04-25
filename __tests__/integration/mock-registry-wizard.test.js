/**
 * Integration tests for MCP Configuration Wizard with Mock Registry
 */

const path = require('path');
const fs = require('fs-extra');
const { mcpWizard } = require('../../src/core/mcp-wizard');
const { setupMockRegistry, getSampleServerMetadata } = require('../utils/mock-registry');

// Setup test directory
const TEST_DIR = path.join(__dirname, '../../.test-tmp-mock');
const TEST_ROO_DIR = path.join(TEST_DIR, '.roo');
const TEST_MCP_CONFIG = path.join(TEST_ROO_DIR, 'mcp.json');
const TEST_ROOMODES = path.join(TEST_DIR, '.roomodes');

describe('MCP Configuration Wizard with Mock Registry', () => {
  let mockRegistry;

  beforeAll(() => {
    // Setup mock registry
    mockRegistry = setupMockRegistry();
  });

  afterAll(() => {
    // Restore original registry client
    mockRegistry.restore();
  });

  beforeEach(async () => {
    // Reset mock registry
    mockRegistry.reset();
    
    // Create test directory
    await fs.ensureDir(TEST_ROO_DIR);
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.remove(TEST_DIR);
  });

  test('should configure a server using mock registry data', async () => {
    // Get sample server metadata from mock registry
    const serverMetadata = await getSampleServerMetadata('supabase');
    
    // Configure server parameters
    const serverParams = {
      'access-token': 'test-token',
      'project-id': 'test-project'
    };
    
    // Configure the server
    const result = await mcpWizard.addServer(serverMetadata, serverParams, {
      projectPath: TEST_DIR,
      mcpConfigPath: '.roo/mcp.json',
      roomodesPath: '.roomodes'
    });
    
    // Verify the result
    expect(result.success).toBe(true);
    
    // Verify files were created
    const mcpConfigExists = await fs.pathExists(TEST_MCP_CONFIG);
    const roomodesExists = await fs.pathExists(TEST_ROOMODES);
    
    expect(mcpConfigExists).toBe(true);
    expect(roomodesExists).toBe(true);
    
    // Verify file contents
    const mcpConfig = await fs.readJson(TEST_MCP_CONFIG);
    const roomodes = await fs.readJson(TEST_ROOMODES);
    
    expect(mcpConfig).toHaveProperty('mcpServers.supabase');
    expect(roomodes).toHaveProperty('customModes');
    expect(roomodes.customModes.length).toBe(1);
    expect(roomodes.customModes[0].slug).toBe('mcp-supabase');
  });

  test('should handle network errors gracefully', async () => {
    // Configure mock registry to simulate network errors
    mockRegistry.client.configureMock({
      simulateNetworkErrors: true,
      errorRate: 1.0 // Always error
    });
    
    // Get sample server metadata (this will fail due to network error)
    const serverMetadata = await getSampleServerMetadata('supabase');
    
    // The test should handle the null serverMetadata gracefully
    expect(serverMetadata).toBeNull();
  });

  test('should configure multiple servers', async () => {
    // Get sample server metadata
    const supabaseMetadata = await getSampleServerMetadata('supabase');
    const openaiMetadata = await getSampleServerMetadata('openai');
    
    // Configure servers
    const servers = [
      {
        metadata: supabaseMetadata,
        params: {
          'access-token': 'test-token',
          'project-id': 'test-project'
        }
      },
      {
        metadata: openaiMetadata,
        params: {
          'api-key': 'test-key'
        }
      }
    ];
    
    // Configure the servers
    const result = await mcpWizard.configureServers(servers, {
      projectPath: TEST_DIR,
      mcpConfigPath: '.roo/mcp.json',
      roomodesPath: '.roomodes'
    });
    
    // Verify the result
    expect(result.success).toBe(true);
    
    // Verify file contents
    const mcpConfig = await fs.readJson(TEST_MCP_CONFIG);
    const roomodes = await fs.readJson(TEST_ROOMODES);
    
    expect(mcpConfig.mcpServers).toHaveProperty('supabase');
    expect(mcpConfig.mcpServers).toHaveProperty('openai');
    expect(roomodes.customModes.length).toBe(2);
  });

  test('should handle rate limiting', async () => {
    // Configure mock registry to simulate rate limiting
    mockRegistry.client.configureMock({
      simulateRateLimiting: true
    });
    
    // Make multiple requests to trigger rate limiting
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(getSampleServerMetadata('supabase').catch(e => e));
    }
    
    // At least one request should fail with rate limiting
    const results = await Promise.all(promises);
    const hasRateLimitError = results.some(result => 
      result instanceof Error && result.code === 'RATE_001'
    );
    
    expect(hasRateLimitError).toBe(true);
  });
});