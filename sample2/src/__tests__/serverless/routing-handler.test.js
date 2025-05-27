const { describe, expect, it, jest, beforeEach } = require('@jest/globals');

// Mock dependencies
jest.mock('../../serverless/config/server-config.js', () => ({
  initializeServer: jest.fn().mockResolvedValue({
    executeTool: jest.fn(),
    loadResource: jest.fn(),
    loadPrompt: jest.fn()
  })
}));

jest.mock('../../serverless/utils/handler-utils.js', () => {
  // Store the original module to selectively mock specific functions
  const originalModule = jest.requireActual('../../serverless/utils/handler-utils.js');
  
  return {
    ...originalModule,
    executeHandler: jest.fn().mockImplementation(async (handlerFn, event, context) => {
      return await handlerFn(event, context);
    }),
    createSuccessResponse: jest.fn().mockImplementation((data, statusCode = 200) => ({
      statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })),
    createErrorResponse: jest.fn().mockImplementation((error, statusCode = 500) => ({
      statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: String(error) })
    })),
    parseEventBody: jest.fn().mockImplementation((body) => {
      if (!body) return null;
      return JSON.parse(body);
    })
  };
});

// Import the module under test
const { 
  routingHandler,
  CloudProviderEvent,
  CloudProviderContext 
} = require('../../serverless/handlers/routing-handler.js');

// Import mocked dependencies for verification
const { initializeServer } = require('../../serverless/config/server-config.js');
const { 
  executeHandler, 
  createSuccessResponse, 
  createErrorResponse,
  parseEventBody 
} = require('../../serverless/utils/handler-utils.js');

describe('Routing Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('routingHandler', () => {
    it('should handle OPTIONS requests for CORS preflight', async () => {
      const event = {
        httpMethod: 'OPTIONS',
        path: '/tools/hello_world'
      };
      
      const response = await routingHandler(event, {});
      
      expect(createSuccessResponse).toHaveBeenCalledWith({}, 204);
      expect(response.statusCode).toBe(204);
    });
    
    it('should return 404 for unknown paths', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/unknown/path'
      };
      
      const response = await routingHandler(event, {});
      
      expect(createErrorResponse).toHaveBeenCalledWith(expect.stringContaining('No handler found'), 404);
      expect(response.statusCode).toBe(404);
    });
    
    it('should delegate to handleToolsRequest for /tools paths', async () => {
      // Mock server's executeTool to return a specific result
      const mockServer = {
        executeTool: jest.fn().mockResolvedValue('Tool result')
      };
      initializeServer.mockResolvedValue(mockServer);
      
      const event = {
        httpMethod: 'POST',
        path: '/tools/hello_world',
        body: JSON.stringify({
          parameters: { name: 'Test' }
        })
      };
      
      const response = await routingHandler(event, {});
      
      // Check if server was initialized
      expect(initializeServer).toHaveBeenCalled();
      
      // Check if succeeded
      expect(response.statusCode).toBe(200);
      
      // Check response contains result
      const body = JSON.parse(response.body);
      expect(body.result).toBeDefined();
    });
    
    it('should delegate to handleResourcesRequest for /resources paths', async () => {
      // Mock server's loadResource to return a specific result
      const mockServer = {
        loadResource: jest.fn().mockResolvedValue('Resource content')
      };
      initializeServer.mockResolvedValue(mockServer);
      
      const event = {
        httpMethod: 'GET',
        path: '/resources/example/test-id',
        pathParameters: { id: 'test-id' }
      };
      
      const response = await routingHandler(event, {});
      
      // Check if server was initialized
      expect(initializeServer).toHaveBeenCalled();
      
      // Check if succeeded
      expect(response.statusCode).toBe(200);
      
      // Check response contains result
      const body = JSON.parse(response.body);
      expect(body.result).toBeDefined();
    });
    
    it('should delegate to handlePromptsRequest for /prompts paths', async () => {
      // Mock server's loadPrompt to return a specific result
      const mockServer = {
        loadPrompt: jest.fn().mockResolvedValue('Prompt content')
      };
      initializeServer.mockResolvedValue(mockServer);
      
      const event = {
        httpMethod: 'POST',
        path: '/prompts/greeting',
        body: JSON.stringify({
          parameters: { name: 'Test' }
        })
      };
      
      const response = await routingHandler(event, {});
      
      // Check if server was initialized
      expect(initializeServer).toHaveBeenCalled();
      
      // Check if succeeded
      expect(response.statusCode).toBe(200);
      
      // Check response contains result
      const body = JSON.parse(response.body);
      expect(body.result).toBeDefined();
    });
    
    it('should handle health check requests', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/health'
      };
      
      const response = await routingHandler(event, {});
      
      // Check if server was initialized (health check validates server initialization)
      expect(initializeServer).toHaveBeenCalled();
      
      // Check if succeeded
      expect(response.statusCode).toBe(200);
      
      // Check health response format
      const body = JSON.parse(response.body);
      expect(body.status).toBe('ok');
      expect(body.timestamp).toBeDefined();
      expect(body.version).toBeDefined();
      expect(body.environment).toBeDefined();
    });
    
    it('should handle errors and return appropriate error responses', async () => {
      // Mock initializeServer to throw an error
      initializeServer.mockRejectedValueOnce(new Error('Server initialization failed'));
      
      const event = {
        httpMethod: 'GET',
        path: '/health'
      };
      
      const response = await routingHandler(event, {});
      
      // Check if error response was created
      expect(createErrorResponse).toHaveBeenCalled();
      expect(response.statusCode).toBe(500);
      
      // Check error response format
      const body = JSON.parse(response.body);
      expect(body.error).toBeDefined();
    });
  });
  
  describe('Tools Request Handler', () => {
    it('should require a tool name in the path', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/tools', // Missing tool name
        body: JSON.stringify({ parameters: {} })
      };
      
      const response = await routingHandler(event, {});
      
      expect(createErrorResponse).toHaveBeenCalledWith(expect.stringContaining('Tool name is required'), 400);
      expect(response.statusCode).toBe(400);
    });
    
    it('should handle tool execution for hello_world tool', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/tools/hello_world',
        body: JSON.stringify({
          parameters: { name: 'Test User' }
        })
      };
      
      const response = await routingHandler(event, {});
      
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.result).toContain('Hello');
      expect(body.result).toContain('Test User');
    });
    
    it('should handle tool execution for goodbye tool', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/tools/goodbye',
        body: JSON.stringify({
          parameters: { name: 'Test User' }
        })
      };
      
      const response = await routingHandler(event, {});
      
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.result).toContain('Goodbye');
      expect(body.result).toContain('Test User');
    });
    
    it('should return 404 for non-existent tools', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/tools/non_existent_tool',
        body: JSON.stringify({
          parameters: {}
        })
      };
      
      const response = await routingHandler(event, {});
      
      expect(createErrorResponse).toHaveBeenCalledWith(expect.stringContaining('Tool not found'), 404);
      expect(response.statusCode).toBe(404);
    });
  });
  
  describe('Resources Request Handler', () => {
    it('should require a resource ID in the path', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/resources', // Missing resource type/id
      };
      
      const response = await routingHandler(event, {});
      
      expect(createErrorResponse).toHaveBeenCalledWith(expect.stringContaining('Resource ID is required'), 400);
      expect(response.statusCode).toBe(400);
    });
    
    it('should handle resource requests', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/resources/example/test-resource',
      };
      
      const response = await routingHandler(event, {});
      
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.result).toBeDefined();
      expect(body.result.text).toContain('example resource');
    });
  });
  
  describe('Prompts Request Handler', () => {
    it('should require a prompt name in the path', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/prompts', // Missing prompt name
        body: JSON.stringify({
          parameters: {}
        })
      };
      
      const response = await routingHandler(event, {});
      
      expect(createErrorResponse).toHaveBeenCalledWith(expect.stringContaining('Prompt name is required'), 400);
      expect(response.statusCode).toBe(400);
    });
    
    it('should handle greeting prompt requests', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/prompts/greeting',
        body: JSON.stringify({
          parameters: { name: 'Test User' }
        })
      };
      
      const response = await routingHandler(event, {});
      
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.result).toContain('Hello');
    });
    
    it('should handle unknown prompt requests', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/prompts/unknown_prompt',
        body: JSON.stringify({
          parameters: {}
        })
      };
      
      const response = await routingHandler(event, {});
      
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.result).toContain('Unknown prompt');
    });
  });
});