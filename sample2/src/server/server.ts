import { FastMCP } from "fastmcp";
import { registerResources } from "../core/resources.js";
import { registerTools } from "../core/tools.js";
import { registerPrompts } from "../core/prompts.js";
import { config } from "../core/config.js";

/**
 * Create and start the MCP server using configuration from environment
 * @returns FastMCP server instance
 */
async function startServer() {
  try {
    // Create a new FastMCP server instance with config
    const server = new FastMCP({
      name: config.serverName,
      version: config.serverVersion
    });

    // Register all resources, tools, and prompts
    registerResources(server);
    registerTools(server);
    registerPrompts(server);
    
    // Log server information
    console.error(`MCP Server initialized`);
    console.error("Server is ready to handle requests");
    
    return server;
  } catch (error) {
    console.error("Failed to initialize server:", error);
    process.exit(1);
  }
}

// Export the server creation function
export default startServer; 