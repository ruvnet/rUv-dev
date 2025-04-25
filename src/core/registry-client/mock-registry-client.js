/**
 * Mock Registry Client
 * 
 * A mock implementation of the Registry Client for testing purposes.
 * This allows testing the MCP Configuration Wizard without requiring
 * an actual registry server.
 */

const RegistryError = require('./registry-error');

// Sample server metadata for testing
const MOCK_SERVERS = {
  // Supabase server
  supabase: {
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
    documentation: 'https://supabase.com/docs/mcp',
    tags: ['database', 'backend'],
    popularity: 4.8
  },
  
  // OpenAI server
  openai: {
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
    documentation: 'https://platform.openai.com/docs/mcp',
    tags: ['ai', 'nlp'],
    popularity: 4.9
  },
  
  // GitHub server
  github: {
    id: 'github',
    name: 'GitHub',
    description: 'GitHub MCP server for repository operations',
    version: '1.0.0',
    command: 'npx',
    args: [
      '-y',
      '@github/mcp-server@latest'
    ],
    requiredArgs: [
      {
        name: 'token',
        description: 'GitHub personal access token',
        secret: true,
        envVar: 'GITHUB_TOKEN'
      }
    ],
    optionalArgs: [
      {
        name: 'owner',
        description: 'Repository owner',
        secret: false
      },
      {
        name: 'repo',
        description: 'Repository name',
        secret: false
      }
    ],
    recommendedPermissions: [
      'list_repos',
      'create_issue',
      'list_pull_requests'
    ],
    documentation: 'https://docs.github.com/en/developers/mcp',
    tags: ['git', 'devops'],
    popularity: 4.7
  },
  
  // AWS server
  aws: {
    id: 'aws',
    name: 'AWS',
    description: 'AWS MCP server for cloud operations',
    version: '1.0.0',
    command: 'npx',
    args: [
      '-y',
      '@aws/mcp-server@latest'
    ],
    requiredArgs: [
      {
        name: 'access-key-id',
        description: 'AWS access key ID',
        secret: true,
        envVar: 'AWS_ACCESS_KEY_ID'
      },
      {
        name: 'secret-access-key',
        description: 'AWS secret access key',
        secret: true,
        envVar: 'AWS_SECRET_ACCESS_KEY'
      }
    ],
    optionalArgs: [
      {
        name: 'region',
        description: 'AWS region',
        default: 'us-east-1'
      }
    ],
    recommendedPermissions: [
      'list_s3_buckets',
      'list_lambda_functions',
      'describe_ec2_instances'
    ],
    documentation: 'https://docs.aws.amazon.com/mcp',
    tags: ['cloud', 'aws'],
    popularity: 4.6
  },
  
  // Firebase server
  firebase: {
    id: 'firebase',
    name: 'Firebase',
    description: 'Firebase MCP server for app development',
    version: '1.0.0',
    command: 'npx',
    args: [
      '-y',
      '@firebase/mcp-server@latest'
    ],
    requiredArgs: [
      {
        name: 'service-account-key',
        description: 'Firebase service account key (JSON)',
        secret: true,
        envVar: 'FIREBASE_SERVICE_ACCOUNT'
      },
      {
        name: 'project-id',
        description: 'Firebase project ID',
        secret: false
      }
    ],
    optionalArgs: [],
    recommendedPermissions: [
      'read_firestore',
      'write_firestore',
      'manage_auth'
    ],
    documentation: 'https://firebase.google.com/docs/mcp',
    tags: ['database', 'backend', 'firebase'],
    popularity: 4.5
  }
};

// Sample server details with additional information
const MOCK_SERVER_DETAILS = {
  supabase: {
    ...MOCK_SERVERS.supabase,
    examples: [
      {
        name: 'Basic Configuration',
        config: {
          command: 'npx',
          args: [
            '-y',
            '@supabase/mcp-server-supabase@latest',
            '--access-token',
            '${env:SUPABASE_ACCESS_TOKEN}',
            '--project-id',
            'my-project'
          ],
          alwaysAllow: [
            'list_tables',
            'execute_sql'
          ]
        }
      },
      {
        name: 'Advanced Configuration',
        config: {
          command: 'npx',
          args: [
            '-y',
            '@supabase/mcp-server-supabase@latest',
            '--access-token',
            '${env:SUPABASE_ACCESS_TOKEN}',
            '--project-id',
            'my-project',
            '--region',
            'eu-west-1'
          ],
          alwaysAllow: [
            'list_tables',
            'execute_sql',
            'list_projects'
          ]
        }
      }
    ],
    roomodeTemplate: {
      slug: 'mcp-supabase',
      name: 'Supabase Integration',
      roleDefinition: 'You are an AI assistant with access to Supabase database operations. You can help with querying data, managing tables, and analyzing database structures.',
      customInstructions: 'When working with Supabase, always prioritize data security. Use parameterized queries to prevent SQL injection. Avoid exposing sensitive data.',
      groups: ['read', 'edit', 'mcp', 'database']
    }
  },
  openai: {
    ...MOCK_SERVERS.openai,
    examples: [
      {
        name: 'Basic Configuration',
        config: {
          command: 'npx',
          args: [
            '-y',
            '@openai/mcp-server@latest',
            '--api-key',
            '${env:OPENAI_API_KEY}'
          ],
          alwaysAllow: [
            'list_models',
            'create_completion'
          ]
        }
      }
    ],
    roomodeTemplate: {
      slug: 'mcp-openai',
      name: 'OpenAI Integration',
      roleDefinition: 'You are an AI assistant with access to OpenAI APIs. You can help with generating text, analyzing content, and creating embeddings.',
      customInstructions: 'When using OpenAI APIs, be mindful of token usage and rate limits. Prefer efficient prompts and avoid unnecessary API calls.',
      groups: ['read', 'edit', 'mcp', 'ai']
    }
  },
  github: {
    ...MOCK_SERVERS.github,
    examples: [
      {
        name: 'Basic Configuration',
        config: {
          command: 'npx',
          args: [
            '-y',
            '@github/mcp-server@latest',
            '--token',
            '${env:GITHUB_TOKEN}'
          ],
          alwaysAllow: [
            'list_repos',
            'list_pull_requests'
          ]
        }
      }
    ],
    roomodeTemplate: {
      slug: 'mcp-github',
      name: 'GitHub Integration',
      roleDefinition: 'You are an AI assistant with access to GitHub repositories. You can help with managing issues, pull requests, and repository operations.',
      customInstructions: 'When working with GitHub, follow best practices for code reviews and issue management. Provide constructive feedback and clear explanations.',
      groups: ['read', 'edit', 'mcp', 'git']
    }
  },
  aws: {
    ...MOCK_SERVERS.aws,
    examples: [
      {
        name: 'Basic Configuration',
        config: {
          command: 'npx',
          args: [
            '-y',
            '@aws/mcp-server@latest',
            '--access-key-id',
            '${env:AWS_ACCESS_KEY_ID}',
            '--secret-access-key',
            '${env:AWS_SECRET_ACCESS_KEY}'
          ],
          alwaysAllow: [
            'list_s3_buckets',
            'list_lambda_functions'
          ]
        }
      }
    ],
    roomodeTemplate: {
      slug: 'mcp-aws',
      name: 'AWS Integration',
      roleDefinition: 'You are an AI assistant with access to AWS cloud services. You can help with managing S3 buckets, Lambda functions, and EC2 instances.',
      customInstructions: 'When working with AWS, follow security best practices. Use least privilege access and be cautious with resource management to avoid unexpected costs.',
      groups: ['read', 'edit', 'mcp', 'cloud']
    }
  },
  firebase: {
    ...MOCK_SERVERS.firebase,
    examples: [
      {
        name: 'Basic Configuration',
        config: {
          command: 'npx',
          args: [
            '-y',
            '@firebase/mcp-server@latest',
            '--service-account-key',
            '${env:FIREBASE_SERVICE_ACCOUNT}',
            '--project-id',
            'my-firebase-project'
          ],
          alwaysAllow: [
            'read_firestore',
            'write_firestore'
          ]
        }
      }
    ],
    roomodeTemplate: {
      slug: 'mcp-firebase',
      name: 'Firebase Integration',
      roleDefinition: 'You are an AI assistant with access to Firebase services. You can help with managing Firestore databases, authentication, and other Firebase features.',
      customInstructions: 'When working with Firebase, ensure proper data validation and security rules. Structure data efficiently for optimal performance.',
      groups: ['read', 'edit', 'mcp', 'database']
    }
  }
};

// Sample categories
const MOCK_CATEGORIES = [
  { name: 'database', count: 2, description: 'Database and data storage services' },
  { name: 'ai', count: 1, description: 'Artificial intelligence and machine learning services' },
  { name: 'backend', count: 2, description: 'Backend and server-side services' },
  { name: 'cloud', count: 1, description: 'Cloud infrastructure services' },
  { name: 'git', count: 1, description: 'Git and version control services' },
  { name: 'devops', count: 1, description: 'DevOps and CI/CD services' },
  { name: 'nlp', count: 1, description: 'Natural language processing services' },
  { name: 'aws', count: 1, description: 'Amazon Web Services' },
  { name: 'firebase', count: 1, description: 'Firebase services' }
];

/**
 * Mock Registry Client class
 */
class MockRegistryClient {
  /**
   * Create a new Mock Registry Client
   * 
   * @param {Object} options - Client configuration options
   * @param {Object} mockOptions - Mock-specific options
   * @param {boolean} mockOptions.simulateNetworkErrors - Whether to simulate network errors
   * @param {boolean} mockOptions.simulateRateLimiting - Whether to simulate rate limiting
   * @param {number} mockOptions.errorRate - Probability of error (0-1)
   * @param {number} mockOptions.latency - Simulated latency in ms
   */
  constructor(options = {}, mockOptions = {}) {
    this.options = {
      baseUrl: 'https://registry.example.com/api/v1/mcp',
      timeout: 10000,
      retries: 3,
      retryDelay: 1000,
      cacheEnabled: true,
      cacheTTL: {
        servers: 300000,
        serverDetails: 3600000,
        categories: 86400000
      },
      ...options
    };
    
    this.mockOptions = {
      simulateNetworkErrors: false,
      simulateRateLimiting: false,
      errorRate: 0.1,
      latency: 100,
      ...mockOptions
    };
    
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
    
    this.requestCount = 0;
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
   * Configure mock behavior
   * 
   * @param {Object} mockOptions - Mock configuration options
   */
  configureMock(mockOptions = {}) {
    this.mockOptions = {
      ...this.mockOptions,
      ...mockOptions
    };
  }
  
  /**
   * Get a list of all available MCP servers
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Server list response
   */
  async getServers(params = {}) {
    await this._simulateLatency();
    this._maybeSimulateError();
    
    // Check cache if enabled and no specific filters are applied
    if (this.options.cacheEnabled && !params.tags && !params.search) {
      const cacheKey = params.page ? `${params.page}-${params.pageSize || 10}` : 'default';
      const cachedData = this.cache.servers.get(cacheKey);
      const timestamp = this.cache.timestamp.servers.get(cacheKey) || 0;
      
      if (cachedData && (Date.now() - timestamp) < this.options.cacheTTL.servers) {
        return cachedData;
      }
    }
    
    // Filter servers based on params
    let filteredServers = Object.values(MOCK_SERVERS);
    
    if (params.tags) {
      const tagList = params.tags.split(',');
      filteredServers = filteredServers.filter(server => 
        tagList.some(tag => server.tags.includes(tag))
      );
    }
    
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filteredServers = filteredServers.filter(server => 
        server.name.toLowerCase().includes(searchLower) || 
        server.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Pagination
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedServers = filteredServers.slice(startIndex, endIndex);
    
    const response = {
      servers: paginatedServers,
      meta: {
        total: filteredServers.length,
        page: page,
        pageSize: pageSize,
        lastUpdated: new Date().toISOString()
      },
      _rateLimit: this._getRateLimitHeaders()
    };
    
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
    await this._simulateLatency();
    this._maybeSimulateError();
    
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
    
    const serverDetails = MOCK_SERVER_DETAILS[serverId];
    
    if (!serverDetails) {
      throw RegistryError.notFoundError(`Server with ID '${serverId}' not found`, 'RES_001');
    }
    
    const response = {
      ...serverDetails,
      _rateLimit: this._getRateLimitHeaders()
    };
    
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
    await this._simulateLatency();
    this._maybeSimulateError();
    
    // Check cache if enabled
    if (this.options.cacheEnabled) {
      const cachedData = this.cache.categories;
      const timestamp = this.cache.timestamp.categories || 0;
      
      if (cachedData && (Date.now() - timestamp) < this.options.cacheTTL.categories) {
        return cachedData;
      }
    }
    
    const response = {
      categories: MOCK_CATEGORIES,
      _rateLimit: this._getRateLimitHeaders()
    };
    
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
   * @returns {Promise<Object>} - Search results
   */
  async searchServers(params = {}) {
    await this._simulateLatency();
    this._maybeSimulateError();
    
    if (!params.q) {
      throw RegistryError.validationError('Search query is required');
    }
    
    const query = params.q.toLowerCase();
    let results = Object.values(MOCK_SERVERS).filter(server => {
      const nameMatch = server.name.toLowerCase().includes(query);
      const descMatch = server.description.toLowerCase().includes(query);
      const tagMatch = server.tags.some(tag => tag.toLowerCase().includes(query));
      
      return nameMatch || descMatch || tagMatch;
    });
    
    // Apply category filter if provided
    if (params.category) {
      results = results.filter(server => 
        server.tags.includes(params.category)
      );
    }
    
    // Apply minimum rating filter if provided
    if (params.minRating) {
      results = results.filter(server => 
        server.popularity >= parseFloat(params.minRating)
      );
    }
    
    // Calculate relevance scores (simplified)
    results = results.map(server => {
      const nameMatch = server.name.toLowerCase().includes(query) ? 0.6 : 0;
      const descMatch = server.description.toLowerCase().includes(query) ? 0.3 : 0;
      const tagMatch = server.tags.some(tag => tag.toLowerCase().includes(query)) ? 0.1 : 0;
      
      const relevance = Math.min(1, nameMatch + descMatch + tagMatch);
      
      return {
        id: server.id,
        name: server.name,
        description: server.description,
        version: server.version,
        tags: server.tags,
        popularity: server.popularity,
        relevance: relevance
      };
    });
    
    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);
    
    // Limit results if maxResults is provided
    if (params.maxResults) {
      results = results.slice(0, parseInt(params.maxResults, 10));
    }
    
    return {
      results,
      meta: {
        total: results.length,
        query: params.q,
        filters: {
          category: params.category,
          minRating: params.minRating
        }
      },
      _rateLimit: this._getRateLimitHeaders()
    };
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
   * Simulate network latency
   * 
   * @private
   * @returns {Promise<void>}
   */
  async _simulateLatency() {
    if (this.mockOptions.latency > 0) {
      await new Promise(resolve => setTimeout(resolve, this.mockOptions.latency));
    }
  }
  
  /**
   * Maybe simulate an error based on error rate
   * 
   * @private
   * @throws {RegistryError} If an error is simulated
   */
  _maybeSimulateError() {
    this.requestCount++;
    
    // Simulate rate limiting
    if (this.mockOptions.simulateRateLimiting && this.requestCount % 5 === 0) {
      throw RegistryError.rateLimitError(
        'Rate limit exceeded',
        'RATE_001',
        30
      );
    }
    
    // Simulate random errors
    if (this.mockOptions.simulateNetworkErrors && Math.random() < this.mockOptions.errorRate) {
      const errorTypes = [
        () => RegistryError.networkError('Network request failed: Connection refused'),
        () => RegistryError.serverError('Internal server error', 'SRV_001', 'req_' + Date.now()),
        () => RegistryError.authError('Invalid token', 'AUTH_001'),
        () => new RegistryError('Unknown error', 'UNK_001', 500)
      ];
      
      const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)];
      throw randomError();
    }
  }
  
  /**
   * Get mock rate limit headers
   * 
   * @private
   * @returns {Object} Rate limit headers
   */
  _getRateLimitHeaders() {
    return {
      limit: 100,
      remaining: 100 - (this.requestCount % 100),
      reset: Math.floor(Date.now() / 1000) + 3600
    };
  }
}

module.exports = MockRegistryClient;