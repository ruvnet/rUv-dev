/**
 * Mock Registry Client Demo
 * 
 * This example demonstrates how to use the mock registry client for testing.
 */

const { MockRegistryClient } = require('../src/core/registry-client');

// Create a mock registry client
const client = new MockRegistryClient({
  // Standard client options
  baseUrl: 'https://registry.example.com/api/v1/mcp',
  timeout: 5000,
  retries: 2,
  cacheEnabled: true
}, {
  // Mock-specific options
  simulateNetworkErrors: false,
  simulateRateLimiting: false,
  errorRate: 0.1,
  latency: 100
});

// Example: Get all servers
async function getAllServers() {
  try {
    console.log('Fetching all servers...');
    const response = await client.getServers();
    console.log(`Found ${response.servers.length} servers:`);
    response.servers.forEach(server => {
      console.log(`- ${server.name} (${server.id}): ${server.description}`);
    });
    console.log('');
  } catch (error) {
    console.error('Error fetching servers:', error.message);
  }
}

// Example: Get server details
async function getServerDetails(serverId) {
  try {
    console.log(`Fetching details for server '${serverId}'...`);
    const server = await client.getServerDetails(serverId);
    console.log(`Server: ${server.name} (${server.id})`);
    console.log(`Description: ${server.description}`);
    console.log(`Version: ${server.version}`);
    console.log(`Command: ${server.command} ${server.args.join(' ')}`);
    console.log('Required Arguments:');
    server.requiredArgs.forEach(arg => {
      console.log(`- ${arg.name}: ${arg.description}${arg.secret ? ' (secret)' : ''}`);
    });
    console.log('Optional Arguments:');
    server.optionalArgs.forEach(arg => {
      console.log(`- ${arg.name}: ${arg.description}${arg.default ? ` (default: ${arg.default})` : ''}`);
    });
    console.log('Recommended Permissions:');
    server.recommendedPermissions.forEach(perm => {
      console.log(`- ${perm}`);
    });
    console.log('Tags:', server.tags.join(', '));
    console.log('');
  } catch (error) {
    console.error(`Error fetching server details for '${serverId}':`, error.message);
  }
}

// Example: Search for servers
async function searchServers(query) {
  try {
    console.log(`Searching for servers matching '${query}'...`);
    const response = await client.searchServers({ q: query });
    console.log(`Found ${response.results.length} results:`);
    response.results.forEach(result => {
      console.log(`- ${result.name} (${result.id}): ${result.description} [Relevance: ${result.relevance.toFixed(2)}]`);
    });
    console.log('');
  } catch (error) {
    console.error(`Error searching for '${query}':`, error.message);
  }
}

// Example: Get categories
async function getCategories() {
  try {
    console.log('Fetching categories...');
    const response = await client.getCategories();
    console.log(`Found ${response.categories.length} categories:`);
    response.categories.forEach(category => {
      console.log(`- ${category.name} (${category.count} servers): ${category.description}`);
    });
    console.log('');
  } catch (error) {
    console.error('Error fetching categories:', error.message);
  }
}

// Example: Simulate network errors
async function demonstrateNetworkErrors() {
  console.log('Demonstrating network errors...');
  
  // Configure client to always produce errors
  client.configureMock({
    simulateNetworkErrors: true,
    errorRate: 1.0
  });
  
  try {
    await client.getServers();
  } catch (error) {
    console.error('Network error demonstration:', error.message);
  }
  
  // Reset client configuration
  client.configureMock({
    simulateNetworkErrors: false,
    errorRate: 0.1
  });
  console.log('');
}

// Example: Simulate rate limiting
async function demonstrateRateLimiting() {
  console.log('Demonstrating rate limiting...');
  
  // Configure client to simulate rate limiting
  client.configureMock({
    simulateRateLimiting: true
  });
  
  // Make multiple requests to trigger rate limiting
  for (let i = 0; i < 10; i++) {
    try {
      console.log(`Request ${i + 1}...`);
      await client.getServers();
      console.log('Request successful');
    } catch (error) {
      console.error(`Request ${i + 1} failed:`, error.message);
      if (error.details && error.details.retryAfter) {
        console.log(`Retry after ${error.details.retryAfter} seconds`);
      }
      break;
    }
  }
  
  // Reset client configuration
  client.configureMock({
    simulateRateLimiting: false
  });
  console.log('');
}

// Run all examples
async function runExamples() {
  console.log('=== MOCK REGISTRY CLIENT DEMO ===\n');
  
  await getAllServers();
  await getServerDetails('supabase');
  await getServerDetails('openai');
  await searchServers('database');
  await getCategories();
  await demonstrateNetworkErrors();
  await demonstrateRateLimiting();
  
  console.log('=== DEMO COMPLETE ===');
}

// Run the examples
runExamples().catch(error => {
  console.error('Unhandled error:', error);
});