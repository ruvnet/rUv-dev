const { describe, expect, it, jest, beforeEach } = require('@jest/globals');

// Mock dependencies
jest.mock('../../serverless/handlers/routing-handler.js', () => ({
  routingHandler: jest.fn().mockResolvedValue({
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ result: 'Success' })
  })
}));

jest.mock('../../serverless/utils/cold-start-optimization.js', () => ({
  setupOptimizations: jest.fn().mockResolvedValue(undefined)
}));

// Import the module under test
const { 
  handler, 
  convertAzureEvent 
} = require('../../serverless/handlers/azure-function-handler.js');

// Import mocked dependencies for verification
const { routingHandler } = require('../../serverless/handlers/routing-handler.js');
const { setupOptimizations } = require('../../serverless/utils/cold-start-optimization.js');

describe('Azure Function Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handler', () => {
    it('should call routingHandler with converted event', async () => {
      // Create mock Azure Function context
      const azureContext = {
        log: {
          info: jest.fn(),
          error: jest.fn()
        },
        executionContext: {
          invocationId: 'invocation-id',
          functionName: 'mcp-server-function'
        },
        bindings: {},
        done: jest.fn()
      };
      
      // Create mock Azure request
      const azureRequest = {
        method: 'POST',
        url: '/api/tools/hello_world',
        headers: {
          'content-type': 'application/json',
          'user-agent': 'test'
        },
        query: {
          param: 'value'
        },
        params: {
          toolName: 'hello_world'
        },
        body: { parameters: { name: 'Test' } },
        rawBody: JSON.stringify({ parameters: { name: 'Test' } })
      };
      
      // Call the handler
      await handler(azureContext, azureRequest);
      
      // Verify setupOptimizations was called
      expect(setupOptimizations).toHaveBeenCalled();
      
      // Verify routingHandler was called with converted event
      expect(routingHandler).toHaveBeenCalled();
      const [genericEvent, context] = routingHandler.mock.calls[0];
      
      // Verify event was converted properly
      expect(genericEvent.path).toBe('/api/tools/hello_world');
      expect(genericEvent.httpMethod).toBe('POST');
      expect(genericEvent.headers).toEqual(azureRequest.headers);
      expect(genericEvent.queryStringParameters).toEqual(azureRequest.query);
      expect(genericEvent.pathParameters).toEqual(azureRequest.params);
      expect(genericEvent.body).toBe(JSON.stringify(azureRequest.body));
      
      // Verify context was adapted appropriately
      expect(context.log).toBe(azureContext.log);
      expect(context.functionName).toBe(azureContext.executionContext.functionName);
      
      // Verify response was set in context.res
      expect(azureContext.res).toEqual({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: { result: 'Success' }
      });
      
      // Verify done was called
      expect(azureContext.done).toHaveBeenCalled();
    });
    
    it('should handle errors from routingHandler', async () => {
      // Setup routingHandler to throw an error
      routingHandler.mockRejectedValueOnce(new Error('Routing handler error'));
      
      // Create minimal Azure context and request
      const azureContext = {
        log: {
          info: jest.fn(),
          error: jest.fn()
        },
        executionContext: {
          invocationId: 'invocation-id',
          functionName: 'mcp-server-function'
        },
        bindings: {},
        done: jest.fn()
      };
      
      const azureRequest = {
        method: 'POST',
        url: '/api/tools/hello_world',
        headers: {}
      };
      
      // Call the handler
      await handler(azureContext, azureRequest);
      
      // Verify error was logged
      expect(azureContext.log.error).toHaveBeenCalledWith(expect.any(Error));
      
      // Verify error response was set
      expect(azureContext.res.status).toBe(500);
      expect(azureContext.res.body).toHaveProperty('error');
      
      // Verify done was called even with error
      expect(azureContext.done).toHaveBeenCalled();
    });
  });
  
  describe('convertAzureEvent', () => {
    it('should correctly convert Azure request to generic event format', () => {
      // Create Azure request
      const azureRequest = {
        method: 'POST',
        url: '/api/tools/hello_world',
        headers: {
          'content-type': 'application/json'
        },
        query: {
          param: 'value'
        },
        params: {
          toolName: 'hello_world'
        },
        body: { key: 'value' },
        rawBody: '{"key":"value"}'
      };
      
      // Convert the request
      const genericEvent = convertAzureEvent(azureRequest);
      
      // Verify conversion
      expect(genericEvent.path).toBe('/api/tools/hello_world');
      expect(genericEvent.httpMethod).toBe('POST');
      expect(genericEvent.headers).toEqual(azureRequest.headers);
      expect(genericEvent.queryStringParameters).toEqual(azureRequest.query);
      expect(genericEvent.pathParameters).toEqual(azureRequest.params);
      expect(genericEvent.body).toBe('{"key":"value"}');
      expect(genericEvent.requestContext).toBeDefined();
    });
    
    it('should handle missing request fields', () => {
      // Create minimal Azure request
      const azureRequest = {
        method: 'GET',
        url: '/api/health'
      };
      
      // Convert the request
      const genericEvent = convertAzureEvent(azureRequest);
      
      // Verify conversion fills in defaults
      expect(genericEvent.path).toBe('/api/health');
      expect(genericEvent.httpMethod).toBe('GET');
      expect(genericEvent.headers).toEqual({});
      expect(genericEvent.queryStringParameters).toBeUndefined();
      expect(genericEvent.pathParameters).toBeUndefined();
      expect(genericEvent.body).toBeUndefined();
      expect(genericEvent.requestContext).toBeDefined();
    });
    
    it('should prefer rawBody over stringified body', () => {
      // Create Azure request with both body and rawBody
      const azureRequest = {
        method: 'POST',
        url: '/api/tools/hello_world',
        body: { key: 'value' },
        rawBody: '{"key":"different_value"}'
      };
      
      // Convert the request
      const genericEvent = convertAzureEvent(azureRequest);
      
      // Verify rawBody is used
      expect(genericEvent.body).toBe('{"key":"different_value"}');
    });
    
    it('should stringify body when rawBody is missing', () => {
      // Create Azure request with only body
      const azureRequest = {
        method: 'POST',
        url: '/api/tools/hello_world',
        body: { key: 'value' }
      };
      
      // Convert the request
      const genericEvent = convertAzureEvent(azureRequest);
      
      // Verify body is stringified
      expect(genericEvent.body).toBe('{"key":"value"}');
    });
  });
  
  describe('Cold Start Optimization', () => {
    it('should call setupOptimizations during module initialization', () => {
      // Clear the module cache to trigger new load
      jest.resetModules();
      
      // This will trigger the module load, which calls setupOptimizations during initialization
      require('../../serverless/handlers/azure-function-handler.js');
      
      // Verify setupOptimizations was called
      expect(setupOptimizations).toHaveBeenCalled();
    });
  });
});