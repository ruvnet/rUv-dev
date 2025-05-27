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
  convertGcpEvent 
} = require('../../serverless/handlers/gcp-function-handler.js');

// Import mocked dependencies for verification
const { routingHandler } = require('../../serverless/handlers/routing-handler.js');
const { setupOptimizations } = require('../../serverless/utils/cold-start-optimization.js');

describe('GCP Cloud Function Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handler', () => {
    it('should call routingHandler with converted event', async () => {
      // Create mock GCP request
      const gcpRequest = {
        method: 'POST',
        path: '/tools/hello_world',
        url: 'https://region-project.cloudfunctions.net/mcpServer/tools/hello_world',
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
        rawBody: Buffer.from(JSON.stringify({ parameters: { name: 'Test' } }))
      };
      
      // Create mock GCP response
      const gcpResponse = {
        status: jest.fn(),
        set: jest.fn(),
        send: jest.fn()
      };
      
      // Call the handler
      await handler(gcpRequest, gcpResponse);
      
      // Verify setupOptimizations was called
      expect(setupOptimizations).toHaveBeenCalled();
      
      // Verify routingHandler was called with converted event
      expect(routingHandler).toHaveBeenCalled();
      const [genericEvent, context] = routingHandler.mock.calls[0];
      
      // Verify event was converted properly
      expect(genericEvent.path).toBe('/tools/hello_world');
      expect(genericEvent.httpMethod).toBe('POST');
      expect(genericEvent.headers).toEqual(gcpRequest.headers);
      expect(genericEvent.queryStringParameters).toEqual(gcpRequest.query);
      expect(genericEvent.pathParameters).toEqual(gcpRequest.params);
      expect(genericEvent.body).toBe(JSON.stringify(gcpRequest.body));
      
      // Verify context was created appropriately
      expect(context.functionName).toBe('mcpServer');
      
      // Verify response methods were called
      expect(gcpResponse.status).toHaveBeenCalledWith(200);
      expect(gcpResponse.set).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(gcpResponse.send).toHaveBeenCalledWith({ result: 'Success' });
    });
    
    it('should handle errors from routingHandler', async () => {
      // Setup routingHandler to throw an error
      routingHandler.mockRejectedValueOnce(new Error('Routing handler error'));
      
      // Create minimal GCP request and response
      const gcpRequest = {
        method: 'POST',
        path: '/tools/hello_world',
        headers: {}
      };
      
      const gcpResponse = {
        status: jest.fn(),
        set: jest.fn(),
        send: jest.fn()
      };
      
      // Call the handler
      await handler(gcpRequest, gcpResponse);
      
      // Verify error response was set
      expect(gcpResponse.status).toHaveBeenCalledWith(500);
      expect(gcpResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('error') })
      );
    });
  });
  
  describe('convertGcpEvent', () => {
    it('should correctly convert GCP request to generic event format', () => {
      // Create GCP request
      const gcpRequest = {
        method: 'POST',
        path: '/tools/hello_world',
        url: 'https://region-project.cloudfunctions.net/mcpServer/tools/hello_world',
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
        rawBody: Buffer.from('{"key":"value"}')
      };
      
      // Convert the request
      const genericEvent = convertGcpEvent(gcpRequest);
      
      // Verify conversion
      expect(genericEvent.path).toBe('/tools/hello_world');
      expect(genericEvent.httpMethod).toBe('POST');
      expect(genericEvent.headers).toEqual(gcpRequest.headers);
      expect(genericEvent.queryStringParameters).toEqual(gcpRequest.query);
      expect(genericEvent.pathParameters).toEqual(gcpRequest.params);
      expect(genericEvent.body).toBe('{"key":"value"}');
      expect(genericEvent.requestContext).toBeDefined();
    });
    
    it('should handle missing request fields', () => {
      // Create minimal GCP request
      const gcpRequest = {
        method: 'GET',
        path: '/health'
      };
      
      // Convert the request
      const genericEvent = convertGcpEvent(gcpRequest);
      
      // Verify conversion fills in defaults
      expect(genericEvent.path).toBe('/health');
      expect(genericEvent.httpMethod).toBe('GET');
      expect(genericEvent.headers).toEqual({});
      expect(genericEvent.queryStringParameters).toBeUndefined();
      expect(genericEvent.pathParameters).toBeUndefined();
      expect(genericEvent.body).toBeUndefined();
      expect(genericEvent.requestContext).toBeDefined();
    });
    
    it('should convert Buffer rawBody to string', () => {
      // Create GCP request with Buffer rawBody
      const gcpRequest = {
        method: 'POST',
        path: '/tools/hello_world',
        rawBody: Buffer.from('{"key":"value"}')
      };
      
      // Convert the request
      const genericEvent = convertGcpEvent(gcpRequest);
      
      // Verify rawBody was converted to string
      expect(genericEvent.body).toBe('{"key":"value"}');
    });
    
    it('should stringify body when rawBody is missing', () => {
      // Create GCP request with only body
      const gcpRequest = {
        method: 'POST',
        path: '/tools/hello_world',
        body: { key: 'value' }
      };
      
      // Convert the request
      const genericEvent = convertGcpEvent(gcpRequest);
      
      // Verify body is stringified
      expect(genericEvent.body).toBe('{"key":"value"}');
    });
    
    it('should handle base64 encoded data', () => {
      // Create base64 encoded data
      const rawData = '{"key":"value"}';
      const base64Data = Buffer.from(rawData).toString('base64');
      
      // Create GCP request with base64 encoded data
      const gcpRequest = {
        method: 'POST',
        path: '/tools/hello_world',
        rawBody: Buffer.from(base64Data, 'base64'),
        headers: {
          'content-encoding': 'base64'
        }
      };
      
      // Convert the request
      const genericEvent = convertGcpEvent(gcpRequest);
      
      // Verify base64 data was handled correctly
      expect(genericEvent.body).toBe(rawData);
      expect(genericEvent.isBase64Encoded).toBe(true);
    });
  });
  
  describe('Cold Start Optimization', () => {
    it('should call setupOptimizations during module initialization', () => {
      // Clear the module cache to trigger new load
      jest.resetModules();
      
      // This will trigger the module load, which calls setupOptimizations during initialization
      require('../../serverless/handlers/gcp-function-handler.js');
      
      // Verify setupOptimizations was called
      expect(setupOptimizations).toHaveBeenCalled();
    });
  });
});