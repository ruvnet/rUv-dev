/**
 * Azure Function Handler
 * 
 * Specialized handler for Azure Functions serverless platform.
 * Adapts generic handler to Azure Function's HTTP trigger format.
 */

import { routingHandler, CloudProviderEvent, CloudProviderContext } from './routing-handler.js';
import { setupOptimizations } from '../utils/cold-start-optimization.js';
import { ServerlessResponse } from '../utils/handler-utils.js';

// Initialize optimizations outside the handler for container reuse
setupOptimizations().catch(err => {
  console.warn('Failed to initialize optimizations:', err);
});

/**
 * Azure Function HTTP Request
 * https://learn.microsoft.com/en-us/azure/azure-functions/functions-reference-node?tabs=javascript%2Clinux%2Cazure-cli&pivots=nodejs-model-v4#http-triggers-and-bindings
 */
export interface AzureFunctionRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  params: Record<string, string>;
  body?: any;
  rawBody?: string;
}

/**
 * Azure Function Context
 * https://learn.microsoft.com/en-us/azure/azure-functions/functions-reference-node?tabs=javascript%2Clinux%2Cazure-cli&pivots=nodejs-model-v4#context-object
 */
export interface AzureFunctionContext {
  invocationId: string;
  executionContext: {
    invocationId: string;
    functionName: string;
    functionDirectory: string;
  };
  bindings: Record<string, any>;
  bindingData: Record<string, any>;
  traceContext: {
    traceparent: string;
    tracestate: string;
    attributes: Record<string, any>;
  };
  log: {
    (message: string): void;
    error(message: string): void;
    warn(message: string): void;
    info(message: string): void;
    verbose(message: string): void;
  };
  done: (err?: Error | null, result?: any) => void;
}

/**
 * Azure Function Response
 */
export interface AzureFunctionResponse {
  status: number;
  headers?: Record<string, string>;
  body?: any;
  isRaw?: boolean;
}

/**
 * Convert Azure Function request to generic event format
 */
function convertAzureRequest(request: AzureFunctionRequest): CloudProviderEvent {
  return {
    path: new URL(request.url).pathname,
    httpMethod: request.method,
    headers: request.headers,
    queryStringParameters: request.query,
    pathParameters: request.params,
    body: typeof request.body === 'string' ? request.body : JSON.stringify(request.body),
    isBase64Encoded: false,
    requestContext: {}
  };
}

/**
 * Convert generic serverless response to Azure Function response
 */
function convertToAzureResponse(response: ServerlessResponse): AzureFunctionResponse {
  return {
    status: response.statusCode,
    headers: response.headers,
    body: response.isBase64Encoded
      ? Buffer.from(response.body, 'base64')
      : JSON.parse(response.body)
  };
}

/**
 * Main Azure Function handler
 * 
 * @param context Azure Function context
 * @param request Azure Function HTTP request
 * @returns Promise<AzureFunctionResponse>
 */
export async function httpTrigger(
  context: AzureFunctionContext,
  request: AzureFunctionRequest
): Promise<AzureFunctionResponse> {
  console.log('Azure Function handler invoked');
  
  // Configure context logging
  context.log.info('Processing HTTP request');
  
  // Convert Azure-specific request to generic format
  const genericEvent = convertAzureRequest(request);
  
  // Create a generic context with necessary Azure Function properties
  const genericContext: CloudProviderContext = {
    functionName: context.executionContext.functionName,
    invokedFunctionArn: context.invocationId,
    done: context.done
  };
  
  try {
    // Call the generic routing handler
    const response = await routingHandler(genericEvent, genericContext);
    
    // Convert generic response to Azure response format
    return convertToAzureResponse(response);
  } catch (error) {
    context.log.error(`Error processing request: ${error instanceof Error ? error.message : String(error)}`);
    
    return {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : error instanceof Error ? error.message : String(error)
      }
    };
  }
}

// Export for Azure Functions v4 programming model
export default httpTrigger;