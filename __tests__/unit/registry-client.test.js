/**
 * Registry Client Tests
 */

const { RegistryClient, RegistryError } = require('../../src/core/registry-client');
const http = require('http');
const https = require('https');

// Mock the http and https modules
jest.mock('http');
jest.mock('https');

describe('RegistryClient', () => {
  let client;
  let mockRequest;
  let mockResponse;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create a new client instance for each test
    client = new RegistryClient({
      baseUrl: 'https://registry.example.com/api/v1/mcp',
      token: 'test-token'
    });

    // Mock response object
    mockResponse = {
      on: jest.fn(),
      headers: {
        'x-ratelimit-limit': '100',
        'x-ratelimit-remaining': '99',
        'x-ratelimit-reset': '60'
      },
      statusCode: 200
    };

    // Mock request object
    mockRequest = {
      on: jest.fn(),
      end: jest.fn()
    };

    // Setup response.on('data') and response.on('end') handlers
    mockResponse.on.mockImplementation((event, callback) => {
      if (event === 'data') {
        callback(JSON.stringify({ success: true }));
      }
      if (event === 'end') {
        callback();
      }
      return mockResponse;
    });

    // Setup request.on handlers
    mockRequest.on.mockImplementation((event, callback) => {
      return mockRequest;
    });

    // Mock https.request to return our mock request
    https.request = jest.fn().mockImplementation((url, options, callback) => {
      callback(mockResponse);
      return mockRequest;
    });
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultClient = new RegistryClient();
      expect(defaultClient.options.baseUrl).toBe('https://registry.example.com/api/v1/mcp');
      expect(defaultClient.options.timeout).toBe(10000);
      expect(defaultClient.options.retries).toBe(3);
      expect(defaultClient.options.cacheEnabled).toBe(true);
    });

    it('should override default options with provided options', () => {
      const customClient = new RegistryClient({
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
  });

  describe('setToken', () => {
    it('should update the token in options', () => {
      client.setToken('new-token');
      expect(client.options.token).toBe('new-token');
    });
  });

  describe('getServers', () => {
    it('should make a request to the servers endpoint', async () => {
      await client.getServers();
      expect(https.request).toHaveBeenCalled();
      const url = https.request.mock.calls[0][0];
      expect(url.pathname).toBe('/api/v1/mcp/servers');
    });

    it('should include query parameters when provided', async () => {
      await client.getServers({
        page: 2,
        pageSize: 20,
        tags: 'database,ai',
        search: 'test'
      });
      const url = https.request.mock.calls[0][0];
      expect(url.search).toContain('page=2');
      expect(url.search).toContain('pageSize=20');
      expect(url.search).toContain('tags=database%2Cai');
      expect(url.search).toContain('search=test');
    });

    it('should use cached data when available and cache is enabled', async () => {
      // First call should make a request
      const response1 = await client.getServers();
      expect(https.request).toHaveBeenCalledTimes(1);

      // Mock the cache
      client.cache.servers.set('default', { cached: true });
      client.cache.timestamp.servers.set('default', Date.now());

      // Second call should use cache
      const response2 = await client.getServers();
      expect(https.request).toHaveBeenCalledTimes(1); // Still 1, no new request
      expect(response2).toEqual({ cached: true });
    });

    it('should not use cache when disabled', async () => {
      client.options.cacheEnabled = false;

      // First call
      await client.getServers();
      expect(https.request).toHaveBeenCalledTimes(1);

      // Second call should still make a request
      await client.getServers();
      expect(https.request).toHaveBeenCalledTimes(2);
    });
  });

  describe('getServerDetails', () => {
    it('should make a request to the server details endpoint', async () => {
      await client.getServerDetails('test-server');
      expect(https.request).toHaveBeenCalled();
      const url = https.request.mock.calls[0][0];
      expect(url.pathname).toBe('/api/v1/mcp/servers/test-server');
    });

    it('should throw an error if server ID is not provided', async () => {
      await expect(client.getServerDetails()).rejects.toThrow(RegistryError);
    });

    it('should use cached data when available and cache is enabled', async () => {
      // First call should make a request
      await client.getServerDetails('test-server');
      expect(https.request).toHaveBeenCalledTimes(1);

      // Mock the cache
      client.cache.serverDetails.set('test-server', { cached: true });
      client.cache.timestamp.serverDetails.set('test-server', Date.now());

      // Second call should use cache
      const response = await client.getServerDetails('test-server');
      expect(https.request).toHaveBeenCalledTimes(1); // Still 1, no new request
      expect(response).toEqual({ cached: true });
    });
  });

  describe('getCategories', () => {
    it('should make a request to the categories endpoint', async () => {
      await client.getCategories();
      expect(https.request).toHaveBeenCalled();
      const url = https.request.mock.calls[0][0];
      expect(url.pathname).toBe('/api/v1/mcp/categories');
    });

    it('should use cached data when available and cache is enabled', async () => {
      // First call should make a request
      await client.getCategories();
      expect(https.request).toHaveBeenCalledTimes(1);

      // Mock the cache
      client.cache.categories = { cached: true };
      client.cache.timestamp.categories = Date.now();

      // Second call should use cache
      const response = await client.getCategories();
      expect(https.request).toHaveBeenCalledTimes(1); // Still 1, no new request
      expect(response).toEqual({ cached: true });
    });
  });

  describe('searchServers', () => {
    it('should make a request to the search endpoint with query parameters', async () => {
      await client.searchServers({
        q: 'database',
        category: 'backend',
        minRating: 4,
        maxResults: 10
      });
      expect(https.request).toHaveBeenCalled();
      const url = https.request.mock.calls[0][0];
      expect(url.pathname).toBe('/api/v1/mcp/search');
      expect(url.search).toContain('q=database');
      expect(url.search).toContain('category=backend');
      expect(url.search).toContain('minRating=4');
      expect(url.search).toContain('maxResults=10');
    });

    it('should throw an error if search query is not provided', async () => {
      await expect(client.searchServers({})).rejects.toThrow(RegistryError);
    });
  });

  describe('clearCache', () => {
    it('should clear all cached data', () => {
      // Setup some cache data
      client.cache.servers.set('default', { data: true });
      client.cache.serverDetails.set('test-server', { data: true });
      client.cache.categories = { data: true };
      client.cache.timestamp.servers.set('default', Date.now());
      client.cache.timestamp.serverDetails.set('test-server', Date.now());
      client.cache.timestamp.categories = Date.now();

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

  describe('error handling', () => {
    it('should handle authentication errors (401)', async () => {
      mockResponse.statusCode = 401;
      mockResponse.on = jest.fn().mockImplementation((event, callback) => {
        if (event === 'data') {
          callback(JSON.stringify({
            error: 'unauthorized',
            message: 'Invalid token',
            code: 'AUTH_001'
          }));
        }
        if (event === 'end') {
          callback();
        }
        return mockResponse;
      });

      await expect(client.getServers()).rejects.toThrow(RegistryError);
      await expect(client.getServers()).rejects.toMatchObject({
        code: 'AUTH_001',
        statusCode: 401,
        message: 'Invalid token'
      });
    });

    it('should handle not found errors (404)', async () => {
      mockResponse.statusCode = 404;
      mockResponse.on = jest.fn().mockImplementation((event, callback) => {
        if (event === 'data') {
          callback(JSON.stringify({
            error: 'not_found',
            message: 'Server not found',
            code: 'RES_001'
          }));
        }
        if (event === 'end') {
          callback();
        }
        return mockResponse;
      });

      await expect(client.getServerDetails('nonexistent')).rejects.toThrow(RegistryError);
      await expect(client.getServerDetails('nonexistent')).rejects.toMatchObject({
        code: 'RES_001',
        statusCode: 404,
        message: 'Server not found'
      });
    });

    it('should handle validation errors (400)', async () => {
      mockResponse.statusCode = 400;
      mockResponse.on = jest.fn().mockImplementation((event, callback) => {
        if (event === 'data') {
          callback(JSON.stringify({
            error: 'validation_error',
            message: 'Invalid parameters',
            code: 'VAL_001',
            details: [
              { field: 'pageSize', message: 'Must be between 1 and 100' }
            ]
          }));
        }
        if (event === 'end') {
          callback();
        }
        return mockResponse;
      });

      await expect(client.getServers({ pageSize: 200 })).rejects.toThrow(RegistryError);
      await expect(client.getServers({ pageSize: 200 })).rejects.toMatchObject({
        code: 'VAL_001',
        statusCode: 400,
        message: 'Invalid parameters'
      });
    });

    it('should handle rate limit errors (429)', async () => {
      mockResponse.statusCode = 429;
      mockResponse.headers['retry-after'] = '30';
      mockResponse.on = jest.fn().mockImplementation((event, callback) => {
        if (event === 'data') {
          callback(JSON.stringify({
            error: 'rate_limit_exceeded',
            message: 'Too many requests',
            code: 'RATE_001',
            retryAfter: 30
          }));
        }
        if (event === 'end') {
          callback();
        }
        return mockResponse;
      });

      await expect(client.getServers()).rejects.toThrow(RegistryError);
      await expect(client.getServers()).rejects.toMatchObject({
        code: 'RATE_001',
        statusCode: 429,
        message: 'Too many requests',
        details: { retryAfter: 30 }
      });
    });

    it('should handle server errors (500)', async () => {
      mockResponse.statusCode = 500;
      mockResponse.on = jest.fn().mockImplementation((event, callback) => {
        if (event === 'data') {
          callback(JSON.stringify({
            error: 'server_error',
            message: 'Internal server error',
            code: 'SRV_001',
            requestId: 'req_123456'
          }));
        }
        if (event === 'end') {
          callback();
        }
        return mockResponse;
      });

      await expect(client.getServers()).rejects.toThrow(RegistryError);
      await expect(client.getServers()).rejects.toMatchObject({
        code: 'SRV_001',
        statusCode: 500,
        message: 'Internal server error',
        details: { requestId: 'req_123456' }
      });
    });

    it('should handle network errors', async () => {
      mockRequest.on.mockImplementation((event, callback) => {
        if (event === 'error') {
          callback(new Error('Network error'));
        }
        return mockRequest;
      });

      await expect(client.getServers()).rejects.toThrow(RegistryError);
      await expect(client.getServers()).rejects.toMatchObject({
        code: 'NET_001',
        message: 'Network request failed: Network error'
      });
    });

    it('should handle timeout errors', async () => {
      mockRequest.on.mockImplementation((event, callback) => {
        if (event === 'timeout') {
          callback();
        }
        return mockRequest;
      });

      await expect(client.getServers()).rejects.toThrow(RegistryError);
      await expect(client.getServers()).rejects.toMatchObject({
        code: 'NET_001',
        message: 'Request timed out'
      });
    });
  });
});