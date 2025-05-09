import { FastMCP } from "fastmcp";
import startServer from "./server/server.js";
import { config } from "./core/config.js";

/**
 * Start the MCP server with configuration from environment
 */
async function main() {
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

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
}); 