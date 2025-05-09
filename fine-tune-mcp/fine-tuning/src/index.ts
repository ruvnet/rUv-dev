import FineTuningMcpServer from './server/mcp-server';
import config from './config';

/**
 * Helper function to determine server type from command line args
 */
export const shouldUseHttp = () => {
  const args = process.argv.slice(2);
  return args.includes('--http') || args.includes('-h');
};

/**
 * Main application entry point
 */
export async function main() {
  try {
    // Redirect console.log to console.error to avoid interfering with MCP protocol
    const originalConsoleLog = console.log;
    console.log = function(...args) {
      console.error(...args);
    };
    // Initialize the MCP server
    const mcpServer = new FineTuningMcpServer();
    
    if (shouldUseHttp()) {
      // Start HTTP server if --http flag is provided
      const port = config.port;
      await mcpServer.startWithHttp(port);
    } else {
      // Default to stdio transport for CLI usage
      await mcpServer.startWithStdio();
    }
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

/**
 * Error handler for unhandled rejections
 */
export function handleUnhandledError(error: Error) {
  console.error('Unhandled error:', error);
  process.exit(1);
}

// Set up process error handlers
process.on('unhandledRejection', (reason) => {
  handleUnhandledError(reason as Error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// Run the main function
main().catch(handleUnhandledError);