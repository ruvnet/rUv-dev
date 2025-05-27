/**
 * Serverless Handler Utilities
 * 
 * Common utilities and helper functions for serverless function handlers
 * across different cloud providers. Includes:
 * - Request/response formatting
 * - Error handling
 * - Logging
 * - Performance tracking
 */

import { getEnvironment } from '../config/environment.js';
import { setupOptimizations } from './cold-start-optimization.js';

// Track execution metrics
let totalExecutions = 0;
let coldStarts = 0;
let lastExecutionTime = 0;
let errors = 0;

// Container tracking for cold start detection
let containerInitTime = Date.now();
let isWarm = false;

/**
 * Standardized response format for all handlers
 */
export interface ServerlessResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  isBase64Encoded?: boolean;
}

/**
 * Initialize handler environment
 * 
 * This function should be called at the beginning of each handler
 * to ensure proper initialization and cold start optimization.
 */
export async function initializeHandler(): Promise<void> {
  // Check if this is a cold start
  if (!isWarm) {
    coldStarts++;
    isWarm = true;
    
    // Apply cold start optimizations
    await setupOptimizations();
  }
  
  // Increment execution counter
  totalExecutions++;
}

/**
 * Create a standard success response
 * 
 * @param data The data to include in the response
 * @param statusCode HTTP status code (default: 200)
 */
export function createSuccessResponse(
  data: any, 
  statusCode = 200
): ServerlessResponse {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization'
    },
    body: JSON.stringify(data)
  };
}

/**
 * Create a standard error response
 * 
 * @param error The error object or message
 * @param statusCode HTTP status code (default: 500)
 */
export function createErrorResponse(
  error: Error | string, 
  statusCode = 500
): ServerlessResponse {
  // Increment error counter
  errors++;
  
  // Log the error (could be enhanced with cloud provider logging)
  console.error('Handler error:', error);
  
  // Determine error message based on environment
  // (don't expose internal errors in production)
  const env = process.env.NODE_ENV || 'development';
  const isProduction = env === 'production';
  
  const errorMessage = isProduction 
    ? 'An internal server error occurred' 
    : error instanceof Error 
      ? `${error.message}\n${error.stack}` 
      : String(error);
  
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ 
      error: isProduction ? 'Internal Server Error' : (error instanceof Error ? error.message : String(error)),
      message: errorMessage,
      timestamp: new Date().toISOString()
    })
  };
}

/**
 * Execute handler with standard wrapping for metrics and error handling
 * 
 * @param handlerFn The handler function to execute
 * @param event The event object from the cloud provider
 * @param context The context object from the cloud provider
 */
export async function executeHandler<TEvent, TContext>(
  handlerFn: (event: TEvent, context: TContext) => Promise<ServerlessResponse>,
  event: TEvent,
  context: TContext
): Promise<ServerlessResponse> {
  const startTime = Date.now();
  
  try {
    // Initialize handler environment
    await initializeHandler();
    
    // Execute the handler function
    const response = await handlerFn(event, context);
    
    // Track execution time
    lastExecutionTime = Date.now() - startTime;
    
    // Add timing headers in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      response.headers = {
        ...response.headers,
        'X-Execution-Time': `${lastExecutionTime}ms`,
        'X-Cold-Start': isWarm ? 'false' : 'true'
      };
    }
    
    return response;
  } catch (error) {
    // Track execution time even for errors
    lastExecutionTime = Date.now() - startTime;
    
    // Return standardized error response
    return createErrorResponse(
      error instanceof Error ? error : String(error)
    );
  }
}

/**
 * Parse event body with error handling
 * 
 * @param body The request body string
 * @param required Whether the body is required
 */
export function parseEventBody<T>(body: string | null | undefined, required = true): T | null {
  if (!body) {
    if (required) {
      throw new Error('Missing request body');
    }
    return null;
  }
  
  try {
    return JSON.parse(body) as T;
  } catch (error) {
    throw new Error(`Invalid JSON in request body: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get execution metrics
 */
export function getExecutionMetrics() {
  return {
    totalExecutions,
    coldStarts,
    lastExecutionTime,
    errorRate: totalExecutions > 0 ? errors / totalExecutions : 0,
    uptime: Date.now() - containerInitTime
  };
}

/**
 * Reset metrics (for testing)
 */
export function resetMetrics() {
  totalExecutions = 0;
  coldStarts = 0;
  lastExecutionTime = 0;
  errors = 0;
  isWarm = false;
  containerInitTime = Date.now();
}