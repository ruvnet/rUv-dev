# @mcpdotdirect/template-mcp-server

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6)

A CLI tool to quickly get started building your very own MCP (Model Context Protocol) server using FastMCP

## 📋 Usage

```bash
# with npx
npx @mcpdotdirect/create-mcp-server

# Or with npm
npm init @mcpdotdirect/mcp-server
```

## 🔭 What's Included

The template includes:

- Basic server setup with both stdio and HTTP transport options using FastMCP
- Structure for defining MCP tools, resources, and prompts
- TypeScript configuration
- Development scripts and configuration

## ✨ Features

- **FastMCP**: Built using the FastMCP framework for simpler implementation
- **Dual Transport Support**: Run your MCP server over stdio or HTTP
- **TypeScript**: Full TypeScript support for type safety
- **Extensible**: Easy to add custom tools, resources, and prompts

## 🚀 Getting Started

After creating your project:

1. Install dependencies using your preferred package manager:
   ```bash
   # Using npm
   npm install
   
   # Using yarn
   yarn
   
   # Using pnpm
   pnpm install
   
   # Using bun
   bun install
   ```

2. Start the server:
   ```bash
   # Start the stdio server
   npm start
   
   # Or start the HTTP server
   npm run start:http
   ```

3. For development with auto-reload:
   ```bash
   # Development mode with stdio
   npm run dev
   
   # Development mode with HTTP
   npm run dev:http
   ```

> **Note**: The default scripts in package.json use Bun as the runtime (e.g., `bun run src/index.ts`). If you prefer to use a different package manager or runtime, you can modify these scripts in your package.json file to use Node.js or another runtime of your choice.

## 📖 Detailed Usage

### Transport Methods

The MCP server supports two transport methods:

1. **stdio Transport** (Command Line Mode):
   - Runs on your **local machine**
   - Managed automatically by Cursor
   - Communicates directly via `stdout`
   - Only accessible by you locally
   - Ideal for personal development and tools

2. **SSE Transport** (HTTP Web Mode):
   - Can run **locally or remotely**
   - Managed and run by you
   - Communicates **over the network**
   - Can be **shared** across machines
   - Ideal for team collaboration and shared tools

### Running the Server Locally

#### stdio Transport (CLI Mode)

Start the server in stdio mode for CLI tools:

```bash
# Start the stdio server
npm start
# or with other package managers
yarn start
pnpm start
bun start

# Start the server in development mode with auto-reload
npm run dev
# or
yarn dev
pnpm dev
bun dev
```

#### HTTP Transport (Web Mode)

Start the server in HTTP mode for web applications:

```bash
# Start the HTTP server
npm run start:http
# or
yarn start:http
pnpm start:http
bun start:http

# Start the HTTP server in development mode with auto-reload
npm run dev:http
# or
yarn dev:http
pnpm dev:http
bun dev:http
```

By default, the HTTP server runs on port 3001. You can change this by setting the PORT environment variable:

```bash
# Start the HTTP server on a custom port
PORT=8080 npm run start:http
```

### Connecting to the Server

#### Connecting from Cursor

To connect to your MCP server from Cursor:

1. Open Cursor and go to Settings (gear icon in the bottom left)
2. Click on "Features" in the left sidebar
3. Scroll down to "MCP Servers" section
4. Click "Add new MCP server"
5. Enter the following details:
   - Server name: `my-mcp-server` (or any name you prefer)
   - For stdio mode:
     - Type: `command`
     - Command: The path to your server executable, e.g., `npm start`
   - For SSE mode:
     - Type: `url`
     - URL: `http://localhost:3001/sse`
6. Click "Save"

#### Using mcp.json with Cursor

For a more portable configuration, create an `.cursor/mcp.json` file in your project's root directory:

```json
{
  "mcpServers": {
    "my-mcp-stdio": {
      "command": "npm",
      "args": [
        "start"
      ],
      "env": {
        "NODE_ENV": "development"
      }
    },
    "my-mcp-sse": {
      "url": "http://localhost:3001/sse"
    }
  }
}
```

You can also create a global configuration at `~/.cursor/mcp.json` to make your MCP servers available in all your Cursor workspaces.

Note: 
- The `command` type entries run the server in stdio mode
- The `url` type entry connects to the HTTP server using SSE transport
- You can provide environment variables using the `env` field
- When connecting via SSE with FastMCP, use the full URL including the `/sse` path: `http://localhost:3001/sse`

### Testing Your Server with CLI Tools

FastMCP provides built-in tools for testing your server:

```bash
# Test with mcp-cli
npx fastmcp dev server.js

# Inspect with MCP Inspector
npx fastmcp inspect server.ts
```

### Using Environment Variables

You can customize the server using environment variables:

```bash
# Change the HTTP port (default is 3001)
PORT=8080 npm run start:http

# Change the host binding (default is 0.0.0.0)
HOST=127.0.0.1 npm run start:http
```

## 🛠️ Adding Custom Tools and Resources

When adding custom tools, resources, or prompts to your FastMCP server:

### Tools

```typescript
server.addTool({
  name: "hello_world",
  description: "A simple hello world tool",
  parameters: z.object({
    name: z.string().describe("Name to greet")
  }),
  execute: async (params) => {
    return `Hello, ${params.name}!`;
  }
});
```

### Resources

```typescript
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
```

### Prompts

```typescript
server.addPrompt({
  name: "greeting",
  description: "A simple greeting prompt",
  arguments: [
    {
      name: "name",
      description: "Name to greet",
      required: true,
    },
  ],
  load: async ({ name }) => {
    return `Hello, ${name}! How can I help you today?`;
  }
});
```

## 📚 Documentation

For more information about FastMCP, visit [FastMCP GitHub Repository](https://github.com/punkpeye/fastmcp).

For more information about the Model Context Protocol, visit the [MCP Documentation](https://modelcontextprotocol.io/introduction).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
