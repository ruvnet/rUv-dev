/**
 * Tests for Mock Registry Client
 */

const MockRegistryClient = require('../../src/core/registry-client/mock-registry-client');
const RegistryError = require('../../src/core/registry-client/registry-error');

describe('MockRegistryClient', () => {
  let client;

  beforeEach(() => {
    // Create a new client instance for each test with default options
    client = new MockRegistryClient();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      expect(client.options.baseUrl).toBe('https://registry.example.com/api/v1/mcp');
      expect(client.options.timeout).toBe(10000);
      expect(client.options.retries).toBe(3);
      expect(client.options.cacheEnabled).toBe(true);
    });

    it('should override default options with provided options', () => {
      const customClient = new MockRegistryClient({
        baseUrl: 'https://custom.example.com/api',
        timeout: 5000,
        retries: 1,
        cacheEnabled: false
      });
      expect(customClient.options.baseUrl).toBe('https://custom.example.com/api');
      expect(customClient.options.timeout).toBe(5000);
      expect(customClient.options.retries).toBe(1);
      expect(customClient.options.cacheEnabled).toBe(false);
    });

    it('should initialize mock options', () => {
      const mockClient = new MockRegistryClient({}, {
        simulateNetworkErrors: true,
        errorRate: 0.5,
        latency: 200
      });
      expect(mockClient.mockOptions.simulateNetworkErrors).toBe(true);
      expect(mockClient.mockOptions.errorRate).toBe(0.5);
      expect(mockClient.mockOptions.latency).toBe(200);
    });
  });

  describe('setToken', () => {
    it('should update the token in options', () => {
      client.setToken('new-token');
      expect(client.options.token).toBe('new-token');
    });
  });

  describe('configureMock', () => {
    it('should update mock options', () => {
      client.configureMock({
        simulateNetworkErrors: true,
        errorRate: 0.8
      });
      expect(client.mockOptions.simulateNetworkErrors).toBe(true);
      expect(client.mockOptions.errorRate).toBe(0.8);
      expect(client.mockOptions.latency).toBe(100); // Unchanged
    });
  });

  describe('getServers', () => {
    it('should return a list of servers', async () => {
      const response = await client.getServers();
      expect(response).toHaveProperty('servers');
      expect(response).toHaveProperty('meta');
      expect(response.servers.length).toBeGreaterThan(0);
      expect(response.meta).toHaveProperty('total');
      expect(response.meta).toHaveProperty('page');
      expect(response.meta).toHaveProperty('pageSize');
    });

    it('should filter servers by tags', async () => {
      const response = await client.getServers({ tags: 'database' });
      expect(response.servers.length).toBeGreaterThan(0);
      response.servers.forEach(server => {
        expect(server.tags).toContain('database');
      });
    });

    it('should filter servers by search term', async () => {
      const response = await client.getServers({ search: 'supabase' });
      expect(response.servers.length).toBeGreaterThan(0);
      response.servers.forEach(server => {
        expect(server.name.toLowerCase()).toContain('supabase');
      });
    });

    it('should handle pagination', async () => {
      const page1 = await client.getServers({ page: 1, pageSize: 2 });
      const page2 = await client.getServers({ page: 2, pageSize: 2 });
      
      expect(page1.servers.length).toBe(2);
      expect(page2.servers.length).toBeGreaterThan(0);
      expect(page1.servers[0].id).not.toBe(page2.servers[0].id);
    });

    it('should use cached data when available', async () => {
      // First call
      const response1 = await client.getServers();
      
      // Modify cache directly to test caching
      const cachedResponse = { ...response1, cached: true };
      client.cache.servers.set('default', cachedResponse);
      client.cache.timestamp.servers.set('default', Date.now());
      
      // Second call should use cache
      const response2 = await client.getServers();
      expect(response2).toHaveProperty('cached', true);
    });

    it('should not use cache when disabled', async () => {
      client.options.cacheEnabled = false;
      
      // First call
      const response1 = await client.getServers();
      
      // Modify cache directly
      const cachedResponse = { ...response1, cached: true };
      client.cache.servers.set('default', cachedResponse);
      client.cache.timestamp.servers.set('default', Date.now());
      
      // Second call should not use cache
      const response2 = await client.getServers();
      expect(response2).not.toHaveProperty('cached');
    });
  });

  describe('getServerDetails', () => {
    it('should return server details for a valid ID', async () => {
      const response = await client.getServerDetails('supabase');
      expect(response).toHaveProperty('id', 'supabase');
      expect(response).toHaveProperty('name', 'Supabase');
      expect(response).toHaveProperty('examples');
      expect(response).toHaveProperty('roomodeTemplate');
    });

    it('should throw an error for an invalid ID', async () => {
      await expect(client.getServerDetails('nonexistent')).rejects.toThrow(RegistryError);
      await expect(client.getServerDetails('nonexistent')).rejects.toMatchObject({
        code: 'RES_001',
        statusCode: 404
      });
    });

    it('should throw an error if server ID is not provided', async () => {
      await expect(client.getServerDetails()).rejects.toThrow(RegistryError);
    });

    it('should use cached data when available', async () => {
      // First call
      const response1 = await client.getServerDetails('supabase');
      
      // Modify cache directly
      const cachedResponse = { ...response1, cached: true };
      client.cache.serverDetails.set('supabase', cachedResponse);
      client.cache.timestamp.serverDetails.set('supabase', Date.now());
      
      // Second call should use cache
      const response2 = await client.getServerDetails('supabase');
      expect(response2).toHaveProperty('cached', true);
    });
  });

  describe('getCategories', () => {
    it('should return a list of categories', async () => {
      const response = await client.getCategories();
      expect(response).toHaveProperty('categories');
      expect(response.categories.length).toBeGreaterThan(0);
      expect(response.categories[0]).toHaveProperty('name');
      expect(response.categories[0]).toHaveProperty('count');
      expect(response.categories[0]).toHaveProperty('description');
    });

    it('should use cached data when available', async () => {
      // First call
      const response1 = await client.getCategories();
      
      // Modify cache directly
      const cachedResponse = { ...response1, cached: true };
      client.cache.categories = cachedResponse;
      client.cache.timestamp.categories = Date.now();
      
      // Second call should use cache
      const response2 = await client.getCategories();
      expect(response2).toHaveProperty('cached', true);
    });
  });

  describe('searchServers', () => {
    it('should return search results for a valid query', async () => {
      const response = await client.searchServers({ q: 'database' });
      expect(response).toHaveProperty('results');
      expect(response).toHaveProperty('meta');
      expect(response.results.length).toBeGreaterThan(0);
      expect(response.meta).toHaveProperty('total');
      expect(response.meta).toHaveProperty('query', 'database');
    });

    it('should throw an error if search query is not provided', async () => {
      await expect(client.searchServers({})).rejects.toThrow(RegistryError);
    });

    it('should filter results by category', async () => {
      const response = await client.searchServers({ q: 'server', category: 'ai' });
      expect(response.results.length).toBeGreaterThan(0);
      response.results.forEach(result => {
        expect(result.tags).toContain('ai');
      });
    });

    it('should filter results by minimum rating', async () => {
      const response = await client.searchServers({ q: 'server', minRating: 4.8 });
      expect(response.results.length).toBeGreaterThan(0);
      response.results.forEach(result => {
        expect(result.popularity).toBeGreaterThanOrEqual(4.8);
      });
    });

    it('should limit results when maxResults is provided', async () => {
      const response = await client.searchServers({ q: 'server', maxResults: 2 });
      expect(response.results.length).toBeLessThanOrEqual(2);
    });

    it('should sort results by relevance', async () => {
      const response = await client.searchServers({ q: 'openai' });
      expect(response.results.length).toBeGreaterThan(0);
      expect(response.results[0].name.toLowerCase()).toContain('openai');
    });
  });

  describe('clearCache', () => {
    it('should clear all cached data', async () => {
      // Populate cache
      await client.getServers();
      await client.getServerDetails('supabase');
      await client.getCategories();
      
      // Clear cache
      client.clearCache();
      
      // Verify cache is cleared
      expect(client.cache.servers.size).toBe(0);
      expect(client.cache.serverDetails.size).toBe(0);
      expect(client.cache.categories).toBeNull();
      expect(client.cache.timestamp.servers.size).toBe(0);
      expect(client.cache.timestamp.serverDetails.size).toBe(0);
      expect(client.cache.timestamp.categories).toBe(0);
    });
  });

  describe('error simulation', () => {
    it('should simulate rate limiting when enabled', async () => {
      client.configureMock({
        simulateRateLimiting: true
      });
      
      // Make requests until rate limit is hit
      try {
        for (let i = 0; i < 10; i++) {
          await client.getServers();
        }
        fail('Should have thrown a rate limit error');
      } catch (error) {
        expect(error).toBeInstanceOf(RegistryError);
        expect(error.code).toBe('RATE_001');
        expect(error.statusCode).toBe(429);
        expect(error.details).toHaveProperty('retryAfter');
      }
    });

    it('should simulate network errors when enabled', async () => {
      client.configureMock({
        simulateNetworkErrors: true,
        errorRate: 1.0 // Always error
      });
      
      await expect(client.getServers()).rejects.toThrow(RegistryError);
    });
  });
});