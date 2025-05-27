/**
 * Google Cloud Functions Handler
 * 
 * Specialized handler for Google Cloud Functions serverless platform.
 * Adapts generic handler to GCP Cloud Functions HTTP trigger format.
 */

import { routingHandler, CloudProviderEvent, CloudProviderContext } from './routing-handler.js';
import { setupOptimizations } from '../utils/cold-start-optimization.js';
import { ServerlessResponse } from '../utils/handler-utils.js';

// Initialize optimizations outside the handler for container reuse
setupOptimizations().catch(err => {
  console.warn('Failed to initialize optimizations:', err);
});

// Types to match Express Request and Response interfaces
// Using inline type definitions to avoid dependency on express types
interface Request {
  path: string;
  method: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, any>;
  body: any;
  ip?: string;
}

interface Response {
  status: (code: number) => Response;
  set: (name: string, value: string) => Response;
  send: (body: any) => Response;
  json: (body: any) => Response;
}

/**
 * Convert Express request to generic event format
 */
function convertGcpRequest(request: Request): CloudProviderEvent {
  // Extract path parameters from URL if available
  // Note: In GCP, path parameters are typically extracted from the URL by the router
  const pathParams: Record<string, string> = {};
  
  // In a real implementation, we would extract path parameters from the URL
  // For example: /resources/example/123 would have resourceType=example, id=123
  const pathParts = request.path.split('/').filter((p: string) => p.length > 0);
  if (pathParts.length >= 2 && pathParts[0] === 'resources' && pathParts.length > 2) {
    pathParams.resourceType = pathParts[1];
    pathParams.id = pathParts[2];
  }
  
  return {
    path: request.path,
    httpMethod: request.method,
    headers: request.headers as Record<string, string>,
    queryStringParameters: request.query as Record<string, string>,
    pathParameters: pathParams,
    body: typeof request.body === 'string' ? request.body : JSON.stringify(request.body),
    isBase64Encoded: false,
    requestContext: {
      identity: request.ip
    }
  };
}

/**
 * Convert generic serverless response to Express response
 */
function sendGcpResponse(response: Response, serverlessResponse: ServerlessResponse): void {
  // Set status code
  response.status(serverlessResponse.statusCode);
  
  // Set headers
  if (serverlessResponse.headers) {
    Object.entries(serverlessResponse.headers).forEach(([key, value]) => {
      response.set(key, value);
    });
  }
  
  // Send response body
  if (serverlessResponse.isBase64Encoded) {
    const buffer = Buffer.from(serverlessResponse.body, 'base64');
    response.send(buffer);
  } else {
    // Parse JSON body if it's a JSON string
    try {
      const bodyObj = JSON.parse(serverlessResponse.body);
      response.json(bodyObj);
    } catch (e) {
      // If it's not valid JSON, send as raw text
      response.send(serverlessResponse.body);
    }
  }
}

/**
 * Main Google Cloud Function handler
 * 
 * This is the entry point for an HTTP-triggered Cloud Function.
 * 
 * @param request Express request object
 * @param response Express response object
 */
export async function cloudFunctionHandler(req: Request, res: Response): Promise<void> {
  console.log('Google Cloud Function handler invoked');
  
  // Convert Express request to generic format
  const genericEvent = convertGcpRequest(req);
  
  // Create a generic context with GCP-specific properties
  const genericContext: CloudProviderContext = {
    functionName: process.env.FUNCTION_NAME || 'unknown',
    // Cloud Functions don't have a direct equivalent to other cloud providers' context
    // so we create a minimal compatible context
    getRemainingTimeInMillis: () => {
      // Cloud Functions have a maximum timeout, but don't expose remaining time
      // Return a default large value
      return 60000; // 60 seconds as a reasonable default
    }
  };
  
  try {
    // Call the generic routing handler
    const response = await routingHandler(genericEvent, genericContext);
    
    // Send the response using Express
    sendGcpResponse(res, response);
  } catch (error) {
    console.error(`Error processing request: ${error instanceof Error ? error.message : String(error)}`);
    
    // Send error response
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : error instanceof Error ? error.message : String(error)
    });
  }
}

// Export for Google Cloud Functions
export default cloudFunctionHandler;