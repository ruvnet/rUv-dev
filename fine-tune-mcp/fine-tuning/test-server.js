// Simple MCP server based on the SDK readme example
const { McpServer } = require('@modelcontextprotocol/sdk/dist/cjs/server/mcp');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/dist/cjs/server/stdio');
const { z } = require('zod');

// Create an MCP server
const server = new McpServer({
  name: "EchoTest",
  version: "1.0.0"
});

// Add an echo tool
server.tool("echo",
  { message: z.string() },
  async ({ message }) => ({
    content: [{ type: "text", text: `Echo: ${message}` }]
  })
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();

// Keep the process alive
process.stdin.resume();

// Handle process signals
process.on('SIGINT', () => {
  console.log('Shutting down MCP server...');
  process.exit(0);
});

// Connect to the server
async function main() {
  try {
    await server.connect(transport);
    console.log('Echo MCP server started with stdio transport');
  } catch (error) {
    console.error('Error starting MCP server:', error);
    process.exit(1);
  }
}

main();