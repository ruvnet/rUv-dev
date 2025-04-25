# Mock Registry API for Testing

This module provides a mock implementation of the MCP Registry API for testing purposes. It allows testing the MCP Configuration Wizard without requiring an actual registry server.

## Features

- Simulates all Registry API endpoints
- Provides consistent test data
- Supports caching behavior like the real client
- Can simulate network errors and rate limiting
- Configurable latency for realistic testing

## Usage

### Basic Usage

```javascript
const { MockRegistryClient } = require('../../src/core/registry-client');

// Create a mock registry client
const client = new MockRegistryClient();

// Use it like the real client
async function getServers() {
  try {
    const response = await client.getServers();
    console.log('Servers:', response.servers);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Configuration Options

The mock client accepts the same options as the real client, plus additional mock-specific options:

```javascript
const client = new MockRegistryClient(
  // Standard client options
  {
    baseUrl: 'https://registry.example.com/api/v1/mcp',
    timeout: 5000,
    retries: 2,
    cacheEnabled: true
  },
  // Mock-specific options
  {
    simulateNetworkErrors: false, // Whether to simulate random network errors
    simulateRateLimiting: false,  // Whether to simulate rate limiting
    errorRate: 0.1,               // Probability of error (0-1)
    latency: 100                  // Simulated latency in ms
  }
);
```

### Simulating Network Conditions

You can configure the mock client to simulate different network conditions:

```javascript
// Configure mock behavior
client.configureMock({
  simulateNetworkErrors: true,
  errorRate: 0.3,        // 30% chance of error
  latency: 500           // 500ms latency
});

// Reset to default behavior
client.configureMock({
  simulateNetworkErrors: false,
  simulateRateLimiting: false,
  errorRate: 0.1,
  latency: 100
});
```

### Using in Tests

For integration testing, you can use the provided test utilities:

```javascript
const { setupMockRegistry, getSampleServerMetadata } = require('../utils/mock-registry');

describe('My Test Suite', () => {
  let mockRegistry;

  beforeAll(() => {
    // Setup mock registry
    mockRegistry = setupMockRegistry();
  });

  afterAll(() => {
    // Restore original registry client
    mockRegistry.restore();
  });

  beforeEach(() => {
    // Reset mock registry between tests
    mockRegistry.reset();
  });

  test('my test', async () => {
    // Get sample server metadata
    const serverMetadata = await getSampleServerMetadata('supabase');
    
    // Use the metadata in your test
    // ...
  });
});
```

## Available Mock Data

The mock registry includes sample data for the following servers:

- `supabase` - Supabase database server
- `openai` - OpenAI AI operations server
- `github` - GitHub repository operations server
- `aws` - AWS cloud operations server
- `firebase` - Firebase app development server

Each server includes:
- Basic metadata (name, description, version, etc.)
- Required and optional arguments
- Recommended permissions
- Example configurations
- Roomode templates

## API Reference

The mock client implements the same API as the real client:

### `getServers(params)`

Returns a list of available MCP servers.

### `getServerDetails(serverId)`

Returns detailed information about a specific MCP server.

### `getCategories()`

Returns a list of server categories/tags.

### `searchServers(params)`

Searches for MCP servers based on various criteria.

### `clearCache()`

Clears all cached data.

### `setToken(token)`

Sets the authentication token.

### `configureMock(options)`

Configures mock behavior (mock client only).

## Error Simulation

The mock client can simulate various error conditions:

- Authentication errors (401)
- Not found errors (404)
- Validation errors (400)
- Rate limit errors (429)
- Server errors (500)
- Network errors

This allows testing error handling in your application.