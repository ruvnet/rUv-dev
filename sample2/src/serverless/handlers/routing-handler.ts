/**
 * Request Routing Handler
 * 
 * Routes incoming requests to the appropriate handler functions
 * based on the request path and method. This serves as the main
 * entry point for API Gateway requests.
 */

import { initializeServer } from '../config/server-config.js';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  executeHandler, 
  ServerlessResponse, 
  parseEventBody 
} from '../utils/handler-utils.js';

// Generic cloud provider event types
export interface CloudProviderEvent {
  path?: string;
  httpMethod?: string;
  resource?: string;
  pathParameters?: Record<string, string>;
  queryStringParameters?: Record<string, string>;
  headers?: Record<string, string>;
  body?: string;
  isBase64Encoded?: boolean;
  requestContext?: any;
}

export interface CloudProviderContext {
  functionName?: string;
  functionVersion?: string;
  invokedFunctionArn?: string;
  memoryLimitInMB?: string;
  awsRequestId?: string;
  logGroupName?: string;
  logStreamName?: string;
  identity?: any;
  clientContext?: any;
  callbackWaitsForEmptyEventLoop?: boolean;
  getRemainingTimeInMillis?: () => number;
  done?: (error?: Error, result?: any) => void;
  fail?: (error: Error | string) => void;
  succeed?: (messageOrObject: any) => void;
}

/**
 * Main routing handler function
 * 
 * @param event The cloud provider event object
 * @param context The cloud provider context object
 * @returns Promise<ServerlessResponse>
 */
export async function routingHandler(
  event: CloudProviderEvent,
  context: CloudProviderContext
): Promise<ServerlessResponse> {
  return executeHandler(async (event, context) => {
    try {
      console.log('Request received:', {
        path: event.path,
        method: event.httpMethod,
        resource: event.resource
      });
      
      // Handle CORS preflight requests
      if (event.httpMethod === 'OPTIONS') {
        return createSuccessResponse({}, 204);
      }
      
      // Get path and method
      const path = event.path || '/';
      const method = (event.httpMethod || 'GET').toUpperCase();
      
      // Parse path to determine resource type
      if (path.startsWith('/tools') || path.includes('/tools/')) {
        return await handleToolsRequest(event, context);
      } else if (path.startsWith('/resources') || path.includes('/resources/')) {
        return await handleResourcesRequest(event, context);
      } else if (path.startsWith('/prompts') || path.includes('/prompts/')) {
        return await handlePromptsRequest(event, context);
      } else if (path === '/health' || path === '/healthz') {
        return await handleHealthCheck(event, context);
      } else {
        // Default response for unknown paths
        return createErrorResponse(`No handler found for path: ${path}`, 404);
      }
    } catch (error) {
      console.error('Error in routing handler:', error);
      return createErrorResponse(error instanceof Error ? error : String(error));
    }
  }, event, context);
}

/**
 * Handle requests to execute tools
 */
async function handleToolsRequest(
  event: CloudProviderEvent,
  context: CloudProviderContext
): Promise<ServerlessResponse> {
  try {
    // Initialize the server
    const server = await initializeServer();
    
    // Extract tool name from the path
    const pathParts = (event.path || '').split('/').filter(part => part.length > 0);
    const toolName = pathParts.length > 1 ? pathParts[1] : null;
    
    if (!toolName) {
      return createErrorResponse('Tool name is required', 400);
    }
    
    // Parse request body
    const requestBody = parseEventBody<{
      parameters?: Record<string, any>;
    }>(event.body, true);
    
    if (!requestBody) {
      return createErrorResponse('Invalid request body', 400);
    }
    
    // FastMCP doesn't have direct tool execution methods in its public API
    // We'll need to use a workaround to execute tools

    // In a real implementation, we would have a proper API to execute tools
    // For now, we'll simulate tool execution based on the registered tools
    const params = requestBody.parameters || {};
    
    // Note: This is a simplified version for the prototype
    // In a real implementation, we would need a more robust approach
    let resultText: string;
    
    if (toolName === 'hello_world') {
      resultText = `Hello, ${params.name || 'World'}! Welcome to the MCP Server.`;
      return createSuccessResponse({ result: resultText });
    } else if (toolName === 'goodbye') {
      resultText = `Goodbye, ${params.name || 'User'}! Thank you for using the MCP Server.`;
      return createSuccessResponse({ result: resultText });
    } else {
      return createErrorResponse(`Tool not found: ${toolName}`, 404);
    }
    
    return createSuccessResponse({ result: resultText });
  } catch (error) {
    console.error('Error executing tool:', error);
    return createErrorResponse(error instanceof Error ? error : String(error));
  }
}

/**
 * Handle requests to access resources
 */
async function handleResourcesRequest(
  event: CloudProviderEvent,
  context: CloudProviderContext
): Promise<ServerlessResponse> {
  try {
    // Initialize the server
    await initializeServer();
    
    // Extract resource URI from the path and query parameters
    const pathParts = (event.path || '').split('/').filter(part => part.length > 0);
    
    // Check if we have a resource ID
    if (pathParts.length < 2) {
      return createErrorResponse('Resource ID is required', 400);
    }
    
    // Construct the resource URI
    const resourceType = pathParts[1];
    const resourceId = event.pathParameters?.id || pathParts[2] || '';
    const resourceUri = `${resourceType}://${resourceId}`;
    
    // Parse any parameters from query string
    const parameters = event.queryStringParameters || {};
    
    // In a real implementation, we would use the FastMCP API to load resources
    // For now, simulate a basic resource response
    const result = {
      text: `This is an example resource with URI: ${resourceUri}`
    };
    
    return createSuccessResponse({ result });
  } catch (error) {
    console.error('Error loading resource:', error);
    return createErrorResponse(error instanceof Error ? error : String(error));
  }
}

/**
 * Handle requests to load prompts
 */
async function handlePromptsRequest(
  event: CloudProviderEvent,
  context: CloudProviderContext
): Promise<ServerlessResponse> {
  try {
    // Initialize the server
    await initializeServer();
    
    // Extract prompt name from the path
    const pathParts = (event.path || '').split('/').filter(part => part.length > 0);
    const promptName = pathParts.length > 1 ? pathParts[1] : null;
    
    if (!promptName) {
      return createErrorResponse('Prompt name is required', 400);
    }
    
    // Parse request body for parameters
    const requestBody = parseEventBody<{
      parameters?: Record<string, any>;
    }>(event.body, false);
    
    // In a real implementation, we would use the FastMCP API to load prompts
    // For now, simulate a basic prompt response
    let resultText: string;
    
    if (promptName === 'greeting') {
      const name = requestBody?.parameters?.name || 'User';
      resultText = `Hello, ${name}! How can I help you today?`;
    } else {
      resultText = `Unknown prompt: ${promptName}`;
    }
    
    return createSuccessResponse({ result: resultText });
  } catch (error) {
    console.error('Error loading prompt:', error);
    return createErrorResponse(error instanceof Error ? error : String(error));
  }
}

/**
 * Handle health check requests
 */
async function handleHealthCheck(
  event: CloudProviderEvent,
  context: CloudProviderContext
): Promise<ServerlessResponse> {
  try {
    // Initialize the server (this validates that the server can be created)
    await initializeServer();
    
    // Include remaining time if available (AWS Lambda specific)
    const remainingTime = context.getRemainingTimeInMillis 
      ? context.getRemainingTimeInMillis() 
      : undefined;
    
    return createSuccessResponse({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.SERVER_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      ...(remainingTime !== undefined ? { remainingTimeMs: remainingTime } : {})
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return createErrorResponse('Health check failed: ' + (error instanceof Error ? error.message : String(error)), 500);
  }
}

// Default AWS Lambda handler export
export const handler = routingHandler;

// Azure Function handler format
export default routingHandler;

// Google Cloud Function handler
export const cloudFunction = routingHandler;