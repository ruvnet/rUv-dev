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
  convertAwsEvent 
} = require('../../serverless/handlers/aws-lambda-handler.js');

// Import mocked dependencies for verification
const { routingHandler } = require('../../serverless/handlers/routing-handler.js');
const { setupOptimizations } = require('../../serverless/utils/cold-start-optimization.js');

describe('AWS Lambda Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handler', () => {
    it('should call routingHandler with converted event', async () => {
      // Create mock AWS Lambda event
      const awsEvent = {
        version: '2.0',
        routeKey: 'POST /tools/hello_world',
        rawPath: '/tools/hello_world',
        rawQueryString: 'param=value',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'test'
        },
        queryStringParameters: {
          param: 'value'
        },
        requestContext: {
          accountId: '123456789012',
          apiId: 'api-id',
          domainName: 'test.execute-api.region.amazonaws.com',
          domainPrefix: 'test',
          http: {
            method: 'POST',
            path: '/tools/hello_world',
            protocol: 'HTTP/1.1',
            sourceIp: '127.0.0.1',
            userAgent: 'test'
          },
          requestId: 'request-id',
          routeKey: 'POST /tools/hello_world',
          stage: 'test',
          time: '12/Mar/2025:19:03:58 +0000',
          timeEpoch: 1715464438
        },
        body: JSON.stringify({ parameters: { name: 'Test' } }),
        isBase64Encoded: false,
        pathParameters: {
          proxy: 'hello_world'
        }
      };
      
      // Create mock AWS Lambda context
      const awsContext = {
        callbackWaitsForEmptyEventLoop: true,
        functionName: 'mcp-server-function',
        functionVersion: '$LATEST',
        invokedFunctionArn: 'arn:aws:lambda:region:account-id:function:mcp-server-function',
        memoryLimitInMB: '128',
        awsRequestId: 'request-id',
        logGroupName: '/aws/lambda/mcp-server-function',
        logStreamName: '2025/05/01/[$LATEST]abcdef123456',
        getRemainingTimeInMillis: () => 3000,
        done: jest.fn(),
        fail: jest.fn(),
        succeed: jest.fn()
      };
      
      // Call the handler
      const response = await handler(awsEvent, awsContext);
      
      // Verify setupOptimizations was called before handler execution
      expect(setupOptimizations).toHaveBeenCalled();
      
      // Verify routingHandler was called with converted event
      expect(routingHandler).toHaveBeenCalled();
      const [genericEvent, context] = routingHandler.mock.calls[0];
      
      // Verify event was converted properly
      expect(genericEvent.path).toBe('/tools/hello_world');
      expect(genericEvent.httpMethod).toBe('POST');
      expect(genericEvent.headers).toEqual(awsEvent.headers);
      expect(genericEvent.queryStringParameters).toEqual(awsEvent.queryStringParameters);
      expect(genericEvent.pathParameters).toEqual(awsEvent.pathParameters);
      expect(genericEvent.body).toBe(awsEvent.body);
      expect(genericEvent.isBase64Encoded).toBe(awsEvent.isBase64Encoded);
      
      // Verify context was passed through
      expect(context).toBe(awsContext);
      
      // Verify response was returned correctly
      expect(response).toEqual({
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result: 'Success' })
      });
    });
    
    it('should handle errors from routingHandler', async () => {
      // Setup routingHandler to throw an error
      routingHandler.mockRejectedValueOnce(new Error('Routing handler error'));
      
      // Create minimal AWS Lambda event
      const awsEvent = {
        rawPath: '/tools/hello_world',
        requestContext: {
          http: {
            method: 'POST',
            path: '/tools/hello_world'
          }
        },
        headers: {}
      };
      
      // Call the handler
      try {
        await handler(awsEvent, {});
        fail('Handler should have thrown an error');
      } catch (error) {
        expect(error.message).toBe('Routing handler error');
      }
    });
  });
  
  describe('convertAwsEvent', () => {
    it('should correctly convert AWS Lambda event to generic format', () => {
      // Create AWS Lambda event
      const awsEvent = {
        rawPath: '/tools/hello_world',
        rawQueryString: 'param=value',
        headers: {
          'Content-Type': 'application/json'
        },
        queryStringParameters: {
          param: 'value'
        },
        requestContext: {
          http: {
            method: 'POST',
            path: '/tools/hello_world'
          }
        },
        body: '{"key":"value"}',
        isBase64Encoded: false,
        pathParameters: {
          proxy: 'hello_world'
        }
      };
      
      // Convert the event
      const genericEvent = convertAwsEvent(awsEvent);
      
      // Verify conversion
      expect(genericEvent.path).toBe('/tools/hello_world');
      expect(genericEvent.httpMethod).toBe('POST');
      expect(genericEvent.headers).toEqual(awsEvent.headers);
      expect(genericEvent.queryStringParameters).toEqual(awsEvent.queryStringParameters);
      expect(genericEvent.pathParameters).toEqual(awsEvent.pathParameters);
      expect(genericEvent.body).toBe('{"key":"value"}');
      expect(genericEvent.isBase64Encoded).toBe(false);
      expect(genericEvent.requestContext).toBe(awsEvent.requestContext);
    });
  });
  
  describe('Cold Start Optimization', () => {
    it('should call setupOptimizations during module initialization', () => {
      // Clear the module cache to trigger new load
      jest.resetModules();
      
      // This will trigger the module load, which calls setupOptimizations during initialization
      require('../../serverless/handlers/aws-lambda-handler.js');
      
      // Verify setupOptimizations was called
      expect(setupOptimizations).toHaveBeenCalled();
    });
  });
});