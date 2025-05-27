const { describe, expect, it, jest, beforeEach, afterEach } = require('@jest/globals');

// Create mocks before importing the module under test
jest.mock('../../serverless/config/environment.js', () => ({
  getEnvironment: jest.fn().mockResolvedValue({
    NODE_ENV: 'test',
    SERVER_NAME: 'test-server',
    SERVER_VERSION: '1.0.0',
  })
}));

jest.mock('../../serverless/utils/cold-start-optimization.js', () => ({
  setupOptimizations: jest.fn().mockResolvedValue(undefined)
}));

// Import the module under test
const {
  initializeHandler,
  createSuccessResponse,
  createErrorResponse,
  executeHandler,
  parseEventBody,
  getExecutionMetrics,
  resetMetrics
} = require('../../serverless/utils/handler-utils.js');

// Import mocked dependencies for verification
const { setupOptimizations } = require('../../serverless/utils/cold-start-optimization.js');

describe('Serverless Handler Utilities', () => {
  
  beforeEach(() => {
    // Reset all metrics before each test
    resetMetrics();
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  describe('initializeHandler', () => {
    it('should call setupOptimizations on first call (cold start)', async () => {
      await initializeHandler();
      
      expect(setupOptimizations).toHaveBeenCalledTimes(1);
    });
    
    it('should not call setupOptimizations on subsequent calls (warm start)', async () => {
      // First call - cold start
      await initializeHandler();
      
      // Reset mock counts
      jest.clearAllMocks();
      
      // Second call - warm start
      await initializeHandler();
      
      expect(setupOptimizations).not.toHaveBeenCalled();
    });
    
    it('should increment execution count on each call', async () => {
      await initializeHandler();
      expect(getExecutionMetrics().totalExecutions).toBe(1);
      
      await initializeHandler();
      expect(getExecutionMetrics().totalExecutions).toBe(2);
    });
  });
  
  describe('createSuccessResponse', () => {
    it('should create a properly formatted success response with default status code', () => {
      const data = { message: 'success' };
      const response = createSuccessResponse(data);
      
      expect(response).toEqual({
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization'
        },
        body: JSON.stringify(data)
      });
    });
    
    it('should use custom status code when provided', () => {
      const data = { message: 'created' };
      const response = createSuccessResponse(data, 201);
      
      expect(response.statusCode).toBe(201);
    });
  });
  
  describe('createErrorResponse', () => {
    it('should create a properly formatted error response with default status code', () => {
      const errorMessage = 'Something went wrong';
      const response = createErrorResponse(errorMessage);
      
      expect(response.statusCode).toBe(500);
      expect(response.headers).toEqual({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      
      const body = JSON.parse(response.body);
      expect(body.error).toBe(errorMessage);
      expect(body.message).toBe(errorMessage);
      expect(body.timestamp).toBeDefined();
    });
    
    it('should use custom status code when provided', () => {
      const response = createErrorResponse('Bad request', 400);
      
      expect(response.statusCode).toBe(400);
    });
    
    it('should handle Error objects', () => {
      const error = new Error('Test error');
      const response = createErrorResponse(error);
      
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Test error');
      expect(body.message).toContain('Test error');
      expect(body.message).toContain('Error: Test error');
    });
    
    it('should mask error details in production environment', () => {
      // Temporarily set NODE_ENV to production
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const response = createErrorResponse('Detailed error message');
      const body = JSON.parse(response.body);
      
      expect(body.error).toBe('Internal Server Error');
      expect(body.message).toBe('An internal server error occurred');
      
      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });
  });
  
  describe('executeHandler', () => {
    it('should execute the handler function and return its response', async () => {
      const mockHandler = jest.fn().mockResolvedValue({
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      });
      
      const event = { path: '/test' };
      const context = { functionName: 'test' };
      
      const response = await executeHandler(mockHandler, event, context);
      
      expect(mockHandler).toHaveBeenCalledWith(event, context);
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({ success: true });
    });
    
    it('should initialize the handler before execution', async () => {
      const mockHandler = jest.fn().mockResolvedValue({
        statusCode: 200,
        headers: {},
        body: '{}'
      });
      
      // Spy on initializeHandler
      const initSpy = jest.spyOn({ initializeHandler }, 'initializeHandler');
      
      await executeHandler(mockHandler, {}, {});
      
      expect(initSpy).toHaveBeenCalled();
    });
    
    it('should add timing headers in non-production environment', async () => {
      const mockHandler = jest.fn().mockResolvedValue({
        statusCode: 200,
        headers: {},
        body: '{}'
      });
      
      // Ensure we're in development mode
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const response = await executeHandler(mockHandler, {}, {});
      
      expect(response.headers).toHaveProperty('X-Execution-Time');
      expect(response.headers).toHaveProperty('X-Cold-Start');
      
      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });
    
    it('should handle errors and return standardized error response', async () => {
      const mockError = new Error('Handler error');
      const mockHandler = jest.fn().mockRejectedValue(mockError);
      
      const response = await executeHandler(mockHandler, {}, {});
      
      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Handler error');
    });
  });
  
  describe('parseEventBody', () => {
    it('should parse valid JSON body', () => {
      const body = JSON.stringify({ key: 'value' });
      const result = parseEventBody(body);
      
      expect(result).toEqual({ key: 'value' });
    });
    
    it('should throw error for invalid JSON', () => {
      const invalidJson = '{not valid json}';
      
      expect(() => parseEventBody(invalidJson)).toThrow('Invalid JSON');
    });
    
    it('should throw error for missing body when required', () => {
      expect(() => parseEventBody(null)).toThrow('Missing request body');
    });
    
    it('should return null for missing body when not required', () => {
      const result = parseEventBody(null, false);
      expect(result).toBeNull();
    });
  });
  
  describe('getExecutionMetrics', () => {
    it('should return metrics with initial values after reset', () => {
      resetMetrics();
      
      const metrics = getExecutionMetrics();
      
      expect(metrics.totalExecutions).toBe(0);
      expect(metrics.coldStarts).toBe(0);
      expect(metrics.lastExecutionTime).toBe(0);
      expect(metrics.errorRate).toBe(0);
      expect(metrics.uptime).toBeGreaterThan(0);
    });
    
    it('should track cold starts', async () => {
      resetMetrics();
      
      await initializeHandler(); // Cold start
      
      const metrics = getExecutionMetrics();
      expect(metrics.coldStarts).toBe(1);
    });
    
    it('should track error rate', async () => {
      resetMetrics();
      
      // Create 2 errors
      createErrorResponse('Error 1');
      createErrorResponse('Error 2');
      
      // Simulate 5 total executions
      for (let i = 0; i < 5; i++) {
        await initializeHandler();
      }
      
      const metrics = getExecutionMetrics();
      expect(metrics.totalExecutions).toBe(5);
      expect(metrics.errorRate).toBe(2/5);
    });
  });
  
  describe('resetMetrics', () => {
    it('should reset all metrics to initial values', async () => {
      // Set some metrics
      await initializeHandler();
      createErrorResponse('Test error');
      
      // Verify metrics were updated
      let metrics = getExecutionMetrics();
      expect(metrics.totalExecutions).toBe(1);
      expect(metrics.coldStarts).toBe(1);
      expect(metrics.errorRate).toBeGreaterThan(0);
      
      // Reset metrics
      resetMetrics();
      
      // Verify reset
      metrics = getExecutionMetrics();
      expect(metrics.totalExecutions).toBe(0);
      expect(metrics.coldStarts).toBe(0);
      expect(metrics.errorRate).toBe(0);
    });
  });
});