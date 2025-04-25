/**
 * Mock Registry Utilities
 * 
 * Utilities for mocking the Registry API in tests.
 */

const { MockRegistryClient } = require('../../src/core/registry-client');

/**
 * Create a mock registry client for testing
 * 
 * @param {Object} options - Client configuration options
 * @param {Object} mockOptions - Mock-specific options
 * @returns {MockRegistryClient} - Configured mock registry client
 */
function createMockRegistryClient(options = {}, mockOptions = {}) {
  return new MockRegistryClient(options, mockOptions);
}

/**
 * Setup mock registry for integration tests
 * 
 * @param {Object} mockOptions - Mock configuration options
 * @returns {Object} - Mock registry utilities
 */
function setupMockRegistry(mockOptions = {}) {
  // Create a mock registry client
  const client = createMockRegistryClient({}, mockOptions);
  
  // Store original module
  const originalModule = jest.requireActual('../../src/core/registry-client');
  
  // Mock the registry-client module
  jest.mock('../../src/core/registry-client', () => ({
    ...originalModule,
    RegistryClient: MockRegistryClient
  }));
  
  return {
    client,
    reset: () => {
      // Reset the mock client
      client.clearCache();
      client.configureMock({
        simulateNetworkErrors: false,
        simulateRateLimiting: false,
        errorRate: 0.1,
        latency: 100
      });
    },
    restore: () => {
      // Restore the original module
      jest.resetModules();
      jest.dontMock('../../src/core/registry-client');
    }
  };
}

/**
 * Get sample server metadata for a specific server
 * 
 * @param {string} serverId - Server ID to retrieve
 * @returns {Promise<Object>} - Server metadata
 */
async function getSampleServerMetadata(serverId) {
  const client = createMockRegistryClient();
  try {
    return await client.getServerDetails(serverId);
  } catch (error) {
    console.error(`Error getting sample server metadata for ${serverId}:`, error);
    return null;
  }
}

/**
 * Get all sample server metadata
 * 
 * @returns {Promise<Object[]>} - Array of server metadata
 */
async function getAllSampleServerMetadata() {
  const client = createMockRegistryClient();
  try {
    const response = await client.getServers({ pageSize: 100 });
    return response.servers;
  } catch (error) {
    console.error('Error getting all sample server metadata:', error);
    return [];
  }
}

module.exports = {
  createMockRegistryClient,
  setupMockRegistry,
  getSampleServerMetadata,
  getAllSampleServerMetadata
};