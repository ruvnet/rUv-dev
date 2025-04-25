/**
 * Registry Client
 * 
 * Client for interacting with the MCP Registry API to discover and retrieve
 * information about available MCP servers.
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const RegistryError = require('./registry-error');

/**
 * Default options for the Registry Client
 */
const DEFAULT_OPTIONS = {
  baseUrl: 'https://registry.example.com/api/v1/mcp',
  timeout: 10000, // 10 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
  cacheEnabled: true,
  cacheTTL: {
    servers: 300000, // 5 minutes
    serverDetails: 3600000, // 1 hour
    categories: 86400000 // 24 hours
  }
};

class RegistryClient {
  /**
   * Create a new Registry Client
   * 
   * @param {Object} options - Client configuration options
   * @param {string} options.baseUrl - Base URL for the registry API
   * @param {string} options.token - Authentication token
   * @param {number} options.timeout - Request timeout in milliseconds
   * @param {number} options.retries - Number of retry attempts for failed requests
   * @param {number} options.retryDelay - Delay between retries in milliseconds
   * @param {boolean} options.cacheEnabled - Whether to enable response caching
   * @param {Object} options.cacheTTL - Cache time-to-live settings in milliseconds
   */
  constructor(options = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.cache = {
      servers: new Map(),
      serverDetails: new Map(),
      categories: null,
      timestamp: {
        servers: new Map(),
        serverDetails: new Map(),
        categories: 0
      }
    };
  }

  /**
   * Set the authentication token
   * 
   * @param {string} token - Authentication token
   */
  setToken(token) {
    this.options.token = token;
  }

  /**
   * Get a list of all available MCP servers
   * 
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.pageSize - Number of items per page
   * @param {string} params.tags - Comma-separated list of tags to filter by
   * @param {string} params.search - Search term to filter servers by name
   * @returns {Promise<Object>} - Server list response
   */
  async getServers(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);
    if (params.tags) queryParams.append('tags', params.tags);
    if (params.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/servers?${queryString}` : '/servers';
    
    // Check cache if enabled and no specific filters are applied
    if (this.options.cacheEnabled && !params.tags && !params.search) {
      const cacheKey = params.page ? `${params.page}-${params.pageSize || 10}` : 'default';
      const cachedData = this.cache.servers.get(cacheKey);
      const timestamp = this.cache.timestamp.servers.get(cacheKey) || 0;
      
      if (cachedData && (Date.now() - timestamp) < this.options.cacheTTL.servers) {
        return cachedData;
      }
    }
    
    const response = await this._makeRequest(endpoint);
    
    // Cache the response if caching is enabled
    if (this.options.cacheEnabled && !params.tags && !params.search) {
      const cacheKey = params.page ? `${params.page}-${params.pageSize || 10}` : 'default';
      this.cache.servers.set(cacheKey, response);
      this.cache.timestamp.servers.set(cacheKey, Date.now());
    }
    
    return response;
  }

  /**
   * Get detailed information about a specific MCP server
   * 
   * @param {string} serverId - Unique ID of the MCP server
   * @returns {Promise<Object>} - Server details response
   */
  async getServerDetails(serverId) {
    if (!serverId) {
      throw RegistryError.validationError('Server ID is required');
    }
    
    // Check cache if enabled
    if (this.options.cacheEnabled) {
      const cachedData = this.cache.serverDetails.get(serverId);
      const timestamp = this.cache.timestamp.serverDetails.get(serverId) || 0;
      
      if (cachedData && (Date.now() - timestamp) < this.options.cacheTTL.serverDetails) {
        return cachedData;
      }
    }
    
    const response = await this._makeRequest(`/servers/${encodeURIComponent(serverId)}`);
    
    // Cache the response if caching is enabled
    if (this.options.cacheEnabled) {
      this.cache.serverDetails.set(serverId, response);
      this.cache.timestamp.serverDetails.set(serverId, Date.now());
    }
    
    return response;
  }

  /**
   * Get a list of all server categories/tags
   * 
   * @returns {Promise<Object>} - Categories response
   */
  async getCategories() {
    // Check cache if enabled
    if (this.options.cacheEnabled) {
      const cachedData = this.cache.categories;
      const timestamp = this.cache.timestamp.categories || 0;
      
      if (cachedData && (Date.now() - timestamp) < this.options.cacheTTL.categories) {
        return cachedData;
      }
    }
    
    const response = await this._makeRequest('/categories');
    
    // Cache the response if caching is enabled
    if (this.options.cacheEnabled) {
      this.cache.categories = response;
      this.cache.timestamp.categories = Date.now();
    }
    
    return response;
  }

  /**
   * Search for MCP servers based on various criteria
   * 
   * @param {Object} params - Search parameters
   * @param {string} params.q - Search query
   * @param {string} params.category - Filter by category
   * @param {number} params.minRating - Minimum popularity rating
   * @param {number} params.maxResults - Maximum number of results
   * @returns {Promise<Object>} - Search results
   */
  async searchServers(params = {}) {
    if (!params.q) {
      throw RegistryError.validationError('Search query is required');
    }
    
    const queryParams = new URLSearchParams();
    queryParams.append('q', params.q);
    
    if (params.category) queryParams.append('category', params.category);
    if (params.minRating) queryParams.append('minRating', params.minRating);
    if (params.maxResults) queryParams.append('maxResults', params.maxResults);
    
    return this._makeRequest(`/search?${queryParams.toString()}`);
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    this.cache.servers.clear();
    this.cache.serverDetails.clear();
    this.cache.categories = null;
    this.cache.timestamp.servers.clear();
    this.cache.timestamp.serverDetails.clear();
    this.cache.timestamp.categories = 0;
  }

  /**
   * Make an HTTP request to the registry API
   * 
   * @param {string} endpoint - API endpoint path
   * @param {string} method - HTTP method
   * @returns {Promise<Object>} - Parsed response data
   * @private
   */
  async _makeRequest(endpoint, method = 'GET') {
    const url = new URL(endpoint, this.options.baseUrl);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    const options = {
      method,
      headers: {
        'Accept': 'application/json',
      },
      timeout: this.options.timeout
    };
    
    // Add authorization header if token is available
    if (this.options.token) {
      options.headers['Authorization'] = `Bearer ${this.options.token}`;
    }
    
    let retries = 0;
    
    while (true) {
      try {
        const response = await this._sendRequest(httpModule, url, options);
        return response;
      } catch (error) {
        // Don't retry if it's a client error (4xx) except for 429 (rate limit)
        if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500 && error.statusCode !== 429) {
          throw error;
        }
        
        // Check if we've reached max retries
        if (retries >= this.options.retries) {
          throw error;
        }
        
        // For rate limit errors, use the retry-after header if available
        let delay = this.options.retryDelay;
        if (error.statusCode === 429 && error.details && error.details.retryAfter) {
          delay = error.details.retryAfter * 1000;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
      }
    }
  }

  /**
   * Send an HTTP request and handle the response
   * 
   * @param {Object} httpModule - HTTP or HTTPS module
   * @param {URL} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise<Object>} - Parsed response data
   * @private
   */
  _sendRequest(httpModule, url, options) {
    return new Promise((resolve, reject) => {
      const req = httpModule.request(url, options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          // Store rate limit headers if present
          const rateLimit = {
            limit: res.headers['x-ratelimit-limit'],
            remaining: res.headers['x-ratelimit-remaining'],
            reset: res.headers['x-ratelimit-reset']
          };
          
          // Handle different response status codes
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsedData = JSON.parse(data);
              // Add rate limit info to the response
              parsedData._rateLimit = rateLimit;
              resolve(parsedData);
            } catch (error) {
              reject(RegistryError.serverError('Invalid JSON response', 'SRV_002'));
            }
          } else {
            let errorResponse;
            try {
              errorResponse = JSON.parse(data);
            } catch (e) {
              errorResponse = { error: 'unknown_error', message: 'Unknown error occurred' };
            }
            
            switch (res.statusCode) {
              case 401:
                reject(RegistryError.authError(
                  errorResponse.message || 'Authentication failed',
                  errorResponse.code || 'AUTH_001'
                ));
                break;
              case 404:
                reject(RegistryError.notFoundError(
                  errorResponse.message || 'Resource not found',
                  errorResponse.code || 'RES_001'
                ));
                break;
              case 400:
                reject(RegistryError.validationError(
                  errorResponse.message || 'Validation failed',
                  errorResponse.code || 'VAL_001',
                  errorResponse.details || {}
                ));
                break;
              case 429:
                reject(RegistryError.rateLimitError(
                  errorResponse.message || 'Rate limit exceeded',
                  errorResponse.code || 'RATE_001',
                  parseInt(res.headers['retry-after'] || errorResponse.retryAfter || 60, 10)
                ));
                break;
              case 500:
              case 502:
              case 503:
              case 504:
                reject(RegistryError.serverError(
                  errorResponse.message || 'Server error',
                  errorResponse.code || 'SRV_001',
                  errorResponse.requestId || ''
                ));
                break;
              default:
                reject(new RegistryError(
                  errorResponse.message || 'Unknown error',
                  errorResponse.code || 'UNK_001',
                  res.statusCode,
                  errorResponse.details || {}
                ));
            }
          }
        });
      });
      
      req.on('error', (error) => {
        reject(RegistryError.networkError(`Network request failed: ${error.message}`, error));
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(RegistryError.networkError('Request timed out'));
      });
      
      req.end();
    });
  }
}

module.exports = RegistryClient;