const { describe, expect, it, jest, beforeEach, afterEach } = require('@jest/globals');

// Mock the dependencies
jest.mock('../../serverless/config/environment.js', () => ({
  getEnvironment: jest.fn().mockResolvedValue({
    NODE_ENV: 'test',
    SERVER_NAME: 'test-server',
    SERVER_VERSION: '1.0.0'
  })
}));

jest.mock('../../serverless/utils/cold-start-optimization.js', () => ({
  setupOptimizations: jest.fn().mockResolvedValue(undefined)
}));

// Import the module under test
const { 
  initializeServer, 
  resetServerInstance 
} = require('../../serverless/config/server-config.js');

// Import the mocked dependencies
const { getEnvironment } = require('../../serverless/config/environment.js');
const { setupOptimizations } = require('../../serverless/utils/cold-start-optimization.js');

describe('Server Configuration', () => {
  
  beforeEach(() => {
    // Reset module state before each test
    resetServerInstance();
    jest.clearAllMocks();
  });
  
  describe('initializeServer', () => {
    it('should create a new server instance on first call', async () => {
      const server = await initializeServer();
      
      // Verify server was created with proper properties
      expect(server).toBeDefined();
      expect(server.name).toBe('test-server');
      expect(server.version).toBe('1.0.0');
      expect(server.tools).toEqual(expect.any(Array));
      expect(server.resources).toEqual(expect.any(Array));
      expect(server.prompts).toEqual(expect.any(Array));
      
      // Verify dependencies were called
      expect(getEnvironment).toHaveBeenCalledTimes(1);
      expect(setupOptimizations).toHaveBeenCalledTimes(1);
    });
    
    it('should register default tools on server creation', async () => {
      const server = await initializeServer();
      
      // Verify default tools were registered
      const tools = server.getTools();
      expect(tools.length).toBeGreaterThan(0);
      
      // Verify hello_world tool exists
      const helloTool = tools.find(t => t.name === 'hello_world');
      expect(helloTool).toBeDefined();
      expect(helloTool.description).toBe('A simple hello world tool');
      
      // Verify goodbye tool exists
      const goodbyeTool = tools.find(t => t.name === 'goodbye');
      expect(goodbyeTool).toBeDefined();
      expect(goodbyeTool.description).toBe('A simple goodbye tool');
    });
    
    it('should return cached instance on subsequent calls', async () => {
      // First call to create the instance
      const server1 = await initializeServer();
      
      // Reset mocks to check if they're called again
      jest.clearAllMocks();
      
      // Second call should use cached instance
      const server2 = await initializeServer();
      
      // Verify it's the same instance
      expect(server2).toBe(server1);
      
      // Verify dependencies weren't called again
      expect(getEnvironment).not.toHaveBeenCalled();
      expect(setupOptimizations).not.toHaveBeenCalled();
    });
    
    it('should apply optimizations when initializing server', async () => {
      await initializeServer();
      
      // Verify optimizations were applied
      expect(setupOptimizations).toHaveBeenCalledTimes(1);
    });
    
    it('should handle errors during initialization', async () => {
      // Mock getEnvironment to throw an error
      getEnvironment.mockRejectedValueOnce(new Error('Failed to get environment'));
      
      // Should propagate the error
      await expect(initializeServer()).rejects.toThrow('Failed to get environment');
    });
  });
  
  describe('Server Tool Registration', () => {
    it('should allow tools to be added to the server', async () => {
      const server = await initializeServer();
      
      // Initial tool count
      const initialToolCount = server.tools.length;
      
      // Add a new tool
      server.addTool({
        name: 'test_tool',
        description: 'A test tool',
        inputSchema: {
          type: 'object',
          properties: {
            input: { type: 'string' }
          }
        },
        execute: async () => 'test result'
      });
      
      // Verify tool was added
      expect(server.tools.length).toBe(initialToolCount + 1);
      
      // Verify tool exists in the tools list
      const tool = server.tools.find(t => t.name === 'test_tool');
      expect(tool).toBeDefined();
      expect(tool.description).toBe('A test tool');
    });
    
    it('should be able to execute registered tools', async () => {
      const server = await initializeServer();
      
      // Execute the hello_world tool
      const result = await server.executeTool('hello_world', { name: 'Tester' });
      
      // Verify result
      expect(result).toContain('Hello, Tester');
    });
    
    it('should throw error when executing non-existent tool', async () => {
      const server = await initializeServer();
      
      // Try to execute a non-existent tool
      await expect(
        server.executeTool('non_existent_tool', {})
      ).rejects.toThrow('Tool not found');
    });
  });
  
  describe('Server Resource Registration', () => {
    it('should allow resources to be added to the server', async () => {
      const server = await initializeServer();
      
      // Initial resource count
      const initialResourceCount = server.resources.length;
      
      // Add a new resource
      server.addResource({
        name: 'test_resource',
        loadResource: async () => 'test resource data'
      });
      
      // Verify resource was added
      expect(server.resources.length).toBe(initialResourceCount + 1);
      
      // Verify resource exists in the resources list
      const resource = server.resources.find(r => r.name === 'test_resource');
      expect(resource).toBeDefined();
    });
    
    it('should be able to load registered resources', async () => {
      const server = await initializeServer();
      
      // Execute the example resource
      const result = await server.loadResource('example://test', { id: 'test' });
      
      // Verify result
      expect(result).toContain('example resource');
    });
    
    it('should throw error when loading non-existent resource', async () => {
      const server = await initializeServer();
      
      // Try to load a non-existent resource
      await expect(
        server.loadResource('non_existent://test', {})
      ).rejects.toThrow('Resource not found');
    });
  });
  
  describe('Server Prompt Registration', () => {
    it('should allow prompts to be added to the server', async () => {
      const server = await initializeServer();
      
      // Initial prompt count
      const initialPromptCount = server.prompts.length;
      
      // Add a new prompt
      server.addPrompt({
        name: 'test_prompt',
        render: async (params) => `Test prompt with ${params.value}`
      });
      
      // Verify prompt was added
      expect(server.prompts.length).toBe(initialPromptCount + 1);
      
      // Verify prompt exists in the prompts list
      const prompt = server.prompts.find(p => p.name === 'test_prompt');
      expect(prompt).toBeDefined();
    });
    
    it('should be able to load registered prompts', async () => {
      const server = await initializeServer();
      
      // Execute the greeting prompt
      const result = await server.loadPrompt('greeting', { name: 'Tester' });
      
      // Verify result
      expect(result).toContain('Hello, Tester');
    });
    
    it('should throw error when loading non-existent prompt', async () => {
      const server = await initializeServer();
      
      // Try to load a non-existent prompt
      await expect(
        server.loadPrompt('non_existent_prompt', {})
      ).rejects.toThrow('Prompt not found');
    });
  });
  
  describe('resetServerInstance', () => {
    it('should clear the cached server instance', async () => {
      // First initialize to create an instance
      await initializeServer();
      
      // Reset mocks to check if they're called again
      jest.clearAllMocks();
      
      // Reset the server instance
      resetServerInstance();
      
      // Initialize again, should create a new instance
      await initializeServer();
      
      // Verify dependencies were called again
      expect(getEnvironment).toHaveBeenCalledTimes(1);
      expect(setupOptimizations).toHaveBeenCalledTimes(1);
    });
  });
});