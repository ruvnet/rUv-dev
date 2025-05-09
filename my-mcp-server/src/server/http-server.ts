import startServer from "./server.js";

// Environment variables with default values
const PORT = parseInt(process.env.PORT || "3001", 10);

async function main() {
  try {
    // Create and initialize the FastMCP server
    const server = await startServer();
    
    // Start the server with SSE transport
    server.start({
      transportType: "sse",
      sse: {
        port: PORT,
        endpoint: "/sse",
      },
    });
    
    console.error(`MCP Server running at http://localhost:${PORT}`);
    console.error(`SSE endpoint: http://localhost:${PORT}/sse`);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on("SIGINT", () => {
  console.error("Shutting down server...");
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
}); 