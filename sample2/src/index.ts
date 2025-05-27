import { FastMCP } from "fastmcp";
import startServer from "./server/server.js";
import { config } from "./core/config.js";

// Import serverless handlers
export { handler as awsHandler } from "./serverless/handlers/aws-lambda-handler.js";
export { httpTrigger as azureHandler } from "./serverless/handlers/azure-function-handler.js";
export { cloudFunctionHandler as gcpHandler } from "./serverless/handlers/gcp-function-handler.js";

/**
 * Start the MCP server with configuration from environment
 *
 * This is used for traditional server deployment.
 * For serverless deployments, use the exported handlers instead.
 */
async function main() {
  // Check if we're running in a serverless environment
  if (process.env.SERVERLESS_EXECUTION === 'true') {
    console.error('Running in serverless mode - skipping server startup');
    return;
  }
  
  try {
    const server = await startServer();
    
    server.start({
      transportType: config.startTransportType,
    });
    
    console.error(`MCP Server running on ${config.startTransportType}`);
  } catch (error) {
    console.error("Error starting MCP server:", error);
    process.exit(1);
  }
}

// Only run main() if this file is executed directly (not imported)
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
  });
}