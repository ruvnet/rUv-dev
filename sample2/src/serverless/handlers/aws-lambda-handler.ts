/**
 * AWS Lambda Handler
 * 
 * Specialized handler for AWS Lambda serverless functions.
 * Adapts generic handler to AWS Lambda's event format.
 */

import { routingHandler, CloudProviderEvent, CloudProviderContext } from './routing-handler.js';
import { setupOptimizations } from '../utils/cold-start-optimization.js';

// Initialize optimizations outside the handler for container reuse
setupOptimizations().catch(err => {
  console.warn('Failed to initialize optimizations:', err);
});

/**
 * AWS Lambda specific event type
 * https://docs.aws.amazon.com/lambda/latest/dg/urls-invocation.html
 */
export interface AwsLambdaEvent {
  version: string;
  routeKey: string;
  rawPath: string;
  rawQueryString: string;
  headers: Record<string, string>;
  queryStringParameters?: Record<string, string>;
  requestContext: {
    accountId: string;
    apiId: string;
    domainName: string;
    domainPrefix: string;
    http: {
      method: string;
      path: string;
      protocol: string;
      sourceIp: string;
      userAgent: string;
    };
    requestId: string;
    routeKey: string;
    stage: string;
    time: string;
    timeEpoch: number;
  };
  body?: string;
  isBase64Encoded: boolean;
  pathParameters?: Record<string, string>;
}

/**
 * AWS Lambda specific context type
 * https://docs.aws.amazon.com/lambda/latest/dg/nodejs-context.html
 */
export interface AwsLambdaContext {
  callbackWaitsForEmptyEventLoop: boolean;
  functionName: string;
  functionVersion: string;
  invokedFunctionArn: string;
  memoryLimitInMB: string;
  awsRequestId: string;
  logGroupName: string;
  logStreamName: string;
  identity?: any;
  clientContext?: any;
  getRemainingTimeInMillis: () => number;
  done: (error?: Error, result?: any) => void;
  fail: (error: Error | string) => void;
  succeed: (messageOrObject: any) => void;
}

/**
 * Convert AWS Lambda event to generic event format
 */
function convertAwsEvent(event: AwsLambdaEvent): CloudProviderEvent {
  return {
    path: event.rawPath,
    httpMethod: event.requestContext.http.method,
    headers: event.headers,
    queryStringParameters: event.queryStringParameters,
    pathParameters: event.pathParameters,
    body: event.body,
    isBase64Encoded: event.isBase64Encoded,
    requestContext: event.requestContext
  };
}

/**
 * Main AWS Lambda handler
 * 
 * @param event AWS Lambda event object
 * @param context AWS Lambda context object
 * @returns Promise<ServerlessResponse>
 */
export async function handler(
  event: AwsLambdaEvent, 
  context: AwsLambdaContext
) {
  console.log('AWS Lambda handler invoked');
  
  // Convert AWS-specific event to generic format
  const genericEvent = convertAwsEvent(event);
  
  // Call the generic routing handler
  const response = await routingHandler(genericEvent, context);
  
  return response;
}