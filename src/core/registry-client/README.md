# Registry Client

The Registry Client is a module for interacting with the MCP Registry API to discover and retrieve information about available MCP servers.

## Features

- Discover available MCP servers
- Get detailed server information
- Search for servers by name, tags, or other criteria
- Get server categories
- Automatic caching for improved performance
- Retry mechanism for handling transient errors
- Rate limit handling

## Usage

```javascript
const { RegistryClient } = require('./registry-client');

// Create a new client
const client = new RegistryClient({
  baseUrl: 'https://registry.example.com/api/v1/mcp',
  token: 'your-auth-token'
});

// Get a list of servers
async function getServers() {
  try {
    const response = await client.getServers();
    console.log('Servers:', response.servers);
    console.log('Total:', response.meta.total);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Get details for a specific server
async function getServerDetails(serverId) {
  try {
    const server = await client.getServerDetails(serverId);
    console.log('Server:', server);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Search for servers
async function searchServers(query) {
  try {
    const response = await client.searchServers({
      q: query,
      category: 'database',
      minRating: 4
    });
    console.log('Results:', response.results);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Configuration Options

The client accepts the following configuration options:

```javascript
const client = new RegistryClient({
  baseUrl: 'https://registry.example.com/api/v1/mcp', // API base URL
  token: 'your-auth-token',                           // Authentication token
  timeout: 10000,                                     // Request timeout in ms
  retries: 3,                                         // Number of retry attempts
  retryDelay: 1000,                                   // Delay between retries in ms
  cacheEnabled: true,                                 // Whether to enable caching
  cacheTTL: {                                         // Cache TTL settings
    servers: 300000,                                  // 5 minutes
    serverDetails: 3600000,                           // 1 hour
    categories: 86400000                              // 24 hours
  }
});
```

## API Reference

### `getServers(params)`

Gets a list of all available MCP servers.

**Parameters:**
- `params.page` - Page number
- `params.pageSize` - Number of items per page
- `params.tags` - Comma-separated list of tags to filter by
- `params.search` - Search term to filter servers by name

**Returns:** Promise resolving to a server list response.

### `getServerDetails(serverId)`

Gets detailed information about a specific MCP server.

**Parameters:**
- `serverId` - Unique ID of the MCP server

**Returns:** Promise resolving to a server details response.

### `getCategories()`

Gets a list of all server categories/tags.

**Returns:** Promise resolving to a categories response.

### `searchServers(params)`

Searches for MCP servers based on various criteria.

**Parameters:**
- `params.q` - Search query
- `params.category` - Filter by category
- `params.minRating` - Minimum popularity rating
- `params.maxResults` - Maximum number of results

**Returns:** Promise resolving to a search results response.

### `clearCache()`

Clears all cached data.

### `setToken(token)`

Sets the authentication token.

## Error Handling

The client uses the `RegistryError` class for error handling. This class extends the standard `Error` class and provides additional context about the error.

```javascript
try {
  await client.getServerDetails('nonexistent');
} catch (error) {
  if (error.code === 'RES_001') {
    console.error('Server not found');
  } else if (error.code === 'AUTH_001') {
    console.error('Authentication failed');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## Mock Implementation

For testing purposes, a mock implementation of the Registry Client is available. This allows testing the MCP Configuration Wizard without requiring an actual registry server.

See [README-mock.md](./README-mock.md) for details on using the mock implementation.

## Data Models

The client uses the following data models:

- `ServerListItem` - Basic server information
- `ServerDetail` - Detailed server information
- `Category` - Server category
- `SearchResult` - Search result item
- `ServerArg` - Server argument definition
- `ServerExample` - Server example configuration
- `RoomodeTemplate` - Roomode template