import { FastMCP } from "fastmcp";
import * as services from "./services/index.js";

/**
 * Register all resources with the MCP server
 * @param server The FastMCP server instance
 */
export function registerResources(server: FastMCP) {
  // Example resource
  server.addResourceTemplate({
    uriTemplate: "example://{id}",
    name: "Example Resource",
    mimeType: "text/plain",
    arguments: [
      {
        name: "id",
        description: "Resource ID",
        required: true,
      },
    ],
    async load({ id }) {
      return {
        text: `This is an example resource with ID: ${id}`
      };
    }
  });
} 