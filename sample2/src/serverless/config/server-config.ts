/**
 * Server Configuration
 * 
 * Initializes and configures the MCP server for serverless environments.
 * Handles server creation, optimization, and configuration based on environment.
 */

// Import type definitions but use 'any' for server instances to avoid type errors
// In a production environment, we would properly type this with appropriate interfaces
import { getEnvironment, EnvironmentConfig } from './environment.js';
import { setupOptimizations } from '../utils/cold-start-optimization.js';

// Cache the server instance for container reuse
let serverInstance: any = null;

/**
 * Initialize the MCP server
 * 
 * Creates and configures a server instance, optimized for serverless environments.
 * Uses caching to avoid re-initialization on container reuse.
 */
export async function initializeServer(): Promise<any> {
  // Return cached instance if available (container reuse scenario)
  if (serverInstance) {
    console.log('Using cached server instance');
    return serverInstance;
  }
  
  console.log('Initializing new server instance');
  
  try {
    // Ensure optimizations are applied
    await setupOptimizations();
    
    // Get environment configuration
    const env = await getEnvironment();
    
    // In a real implementation, we would create an actual FastMCP instance
    // Since we're just simulating for now, we'll create a mock server object
    const server = createMockServer(env);
    
    // Perform one-time initialization tasks
    await initializeServerComponents(server, env);
    
    // Cache the server instance for future requests
    serverInstance = server;
    
    return server;
  } catch (error) {
    console.error('Failed to initialize server:', error);
    throw error;
  }
}

/**
 * Create a mock server object for development
 * In production, this would be a real FastMCP instance
 */
function createMockServer(env: EnvironmentConfig): any {
  // Create a mock server object that mimics FastMCP interface
  const server = {
    name: env.SERVER_NAME,
    version: env.SERVER_VERSION,
    tools: [] as any[],
    resources: [] as any[],
    prompts: [] as any[],
    
    // Tool management
    addTool: function(tool: any) {
      this.tools.push(tool);
      console.log(`Registered tool: ${tool.name}`);
      return this;
    },
    
    // Resource management
    addResource: function(resource: any) {
      this.resources.push(resource);
      console.log(`Registered resource: ${resource.name}`);
      return this;
    },
    
    // Prompt management
    addPrompt: function(prompt: any) {
      this.prompts.push(prompt);
      console.log(`Registered prompt: ${prompt.name}`);
      return this;
    },
    
    // Get tools (added for routing handler)
    getTools: function() {
      return this.tools;
    },
    
    // Execute a tool
    executeTool: async function(name: string, params: any) {
      const tool = this.tools.find((t: any) => t.name === name);
      if (!tool) {
        throw new Error(`Tool not found: ${name}`);
      }
      return await tool.execute(params);
    },
    
    // Load a resource
    loadResource: async function(uri: string, params: any) {
      const [type, id] = uri.split('://');
      const resource = this.resources.find((r: any) => r.name.toLowerCase() === type);
      if (!resource) {
        throw new Error(`Resource not found: ${type}`);
      }
      return await resource.loadResource({ id, ...params });
    },
    
    // Load a prompt
    loadPrompt: async function(name: string, params: any) {
      const prompt = this.prompts.find((p: any) => p.name === name);
      if (!prompt) {
        throw new Error(`Prompt not found: ${name}`);
      }
      return await prompt.render(params);
    }
  };
  
  // Register basic tools
  registerServerTools(server);
  
  // Register resources
  registerServerResources(server);
  
  // Register prompts
  registerServerPrompts(server);
  
  return server;
}

/**
 * Initialize server components that require async operations
 */
async function initializeServerComponents(
  server: any, 
  env: EnvironmentConfig
): Promise<void> {
  // In a real implementation, we might:
  // - Connect to databases
  // - Initialize caches
  // - Load configuration from external sources
  // - Perform health checks
  
  // For now, we'll just simulate with a delay
  if (env.NODE_ENV === 'development') {
    // Skip delay in development to speed up cold starts
    return;
  }
  
  // Small artificial delay to simulate async initialization
  await new Promise(resolve => setTimeout(resolve, 10));
}

/**
 * Register server tools
 */
function registerServerTools(server: any): void {
  // Basic tools
  server.addTool({
    name: 'hello_world',
    description: 'A simple hello world tool',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name to greet'
        }
      },
      required: ['name']
    },
    execute: async (params: any) => {
      return `Hello, ${params.name}! Welcome to the MCP Server.`;
    }
  });
  
  server.addTool({
    name: 'goodbye',
    description: 'A simple goodbye tool',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name to bid farewell to'
        }
      },
      required: ['name']
    },
    execute: async (params: any) => {
      return `Goodbye, ${params.name}! Thank you for using the MCP Server.`;
    }
  });
}

/**
 * Register server resources
 */
function registerServerResources(server: any): void {
  // Example resource
  server.addResource({
    name: 'example',
    loadResource: async (params: any) => {
      return `This is example resource ${params.id}`;
    }
  });
}

/**
 * Register server prompts
 */
function registerServerPrompts(server: any): void {
  // Example prompt
  server.addPrompt({
    name: 'greeting',
    render: async (params: any) => {
      return `Hello, ${params.name || 'User'}! How can I help you today?`;
    }
  });
}

/**
 * Reset the server instance
 * 
 * Useful for testing or when configuration might have changed at runtime.
 */
export function resetServerInstance(): void {
  serverInstance = null;
}