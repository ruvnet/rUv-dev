# Fine-Tuning MCP Server

An MCP (Model Context Protocol) server implementation for OpenAI's reinforcement fine-tuning. This server provides a standardized interface for starting, monitoring, and managing reinforcement fine-tuning jobs through the OpenAI API.

> **Note:** For background research and references used to create this implementation, see [RESEARCH.md](./RESEARCH.md).

## 🔍 Project Overview

The Fine-Tuning MCP Server enables AI agents and applications to seamlessly integrate OpenAI's reinforcement fine-tuning capabilities. By implementing the Model Context Protocol, this server allows agents to discover and interact with fine-tuning operations in a standardized way, without requiring custom integration code.

### Key Features

- Start new reinforcement fine-tuning (RFT) jobs
- Monitor job status and events in real-time
- List checkpoints for ongoing jobs
- Pause and resume fine-tuning jobs
- MCP-compliant interface for agent integration
- Support for both stdio and HTTP transports
- Structured validation using Zod schemas

## 📋 Prerequisites

- Node.js >= 16
- OpenAI API key with fine-tuning access
- Fine-tuning data files already uploaded to OpenAI
- (Optional) `mcp-inspector` for debugging

## 🚀 Installation

1. Clone the repository:
   ```bash
   git clone [your-repo-url]
   cd fine-tuning
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create an `.env` file with your configuration:
   ```
   OPENAI_API_KEY=your_openai_api_key
   DEFAULT_BASE_MODEL=o4-mini-2025-04-16
   PORT=3001
   LOG_LEVEL=info
   ```

4. Build the project:
   ```bash
   npm run build
   ```

## ⚙️ Configuration

The server is configured through environment variables, which can be set in a `.env` file in the project root or provided directly when running the server.

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key with fine-tuning access | **Required** |
| `DEFAULT_BASE_MODEL` | Default model to use for fine-tuning | `o4-mini-2025-04-16` |
| `PORT` | HTTP server port | `3001` |
| `LOG_LEVEL` | Logging level (debug, info, warn, error) | `info` |

## 🖥️ Usage

### Running as a stdio-based MCP server

For direct use with OpenAI agents or integration with tools like `mcp-inspector`:

```bash
# Basic usage
npm start

# With mcp-inspector for debugging
npm start | mcp-inspector

# In development mode
npm run dev
```

### Running as an HTTP server

For use in web applications, microservices, or remote agent access:

```bash
# Start with default port (3001)
npm start -- --http

# Start with custom port
PORT=8080 npm start -- --http
```

You can also use the `-h` flag as a shorthand for `--http`.

### Docker Deployment

For containerized deployments:

```bash
# Build the Docker image
docker build -t fine-tuning-mcp-server .

# Run with stdio transport
docker run -it --rm --env OPENAI_API_KEY=your_key fine-tuning-mcp-server

# Run with HTTP transport
docker run -it --rm -p 3001:3001 --env OPENAI_API_KEY=your_key fine-tuning-mcp-server --http
```

## 📚 API Documentation

The server provides the following tool methods for interacting with OpenAI's fine-tuning API:

### `start_job`

Creates a new reinforcement fine-tuning job.

**Parameters:**
- `training_file` (string, required): OpenAI file ID for the training data
- `validation_file` (string, required): OpenAI file ID for the validation data
- `grader` (object, required): Multi-grader configuration for reinforcement learning
  - `type` (string): The type of grader to use
  - Additional grader-specific properties
- `base_model` (string, optional): Base model to fine-tune from (default: 'o4-mini-2025-04-16')
- `response_schema` (object, optional): JSON schema for structured outputs
- `hyperparameters` (object, optional): Fine-tuning hyperparameters
  - `batch_size` (integer, optional): Number of samples processed per batch
  - `learning_rate_multiplier` (number, optional): Learning rate multiplier
  - `n_epochs` (integer, optional): Number of training epochs

**Example Request:**
```json
{
  "training_file": "file-abc123",
  "validation_file": "file-xyz789",
  "grader": {
    "type": "autograder",
    "criteria": "Rate responses on accuracy, clarity, and helpfulness."
  },
  "base_model": "o4-mini-2025-04-16",
  "response_schema": {
    "type": "object",
    "properties": {
      "answer": {
        "type": "string"
      },
      "confidence": {
        "type": "number",
        "minimum": 0,
        "maximum": 1
      }
    },
    "required": ["answer", "confidence"]
  },
  "hyperparameters": {
    "batch_size": 4,
    "learning_rate_multiplier": 0.5,
    "n_epochs": 3
  }
}
```

### `get_job_status`

Fetches the event stream for a running fine-tuning job.

**Parameters:**
- `job_id` (string, required): OpenAI fine-tuning job ID

**Example Request:**
```json
{
  "job_id": "ftjob-abc123"
}
```

### `list_checkpoints`

Lists all checkpoints for a fine-tuning job.

**Parameters:**
- `job_id` (string, required): OpenAI fine-tuning job ID

**Example Request:**
```json
{
  "job_id": "ftjob-abc123"
}
```

### `pause_job`

Pauses a running fine-tuning job.

**Parameters:**
- `job_id` (string, required): OpenAI fine-tuning job ID

**Example Request:**
```json
{
  "job_id": "ftjob-abc123"
}
```

### `resume_job`

Resumes a paused fine-tuning job.

**Parameters:**
- `job_id` (string, required): OpenAI fine-tuning job ID

**Example Request:**
```json
{
  "job_id": "ftjob-abc123"
}
```

## 🔄 Integration with Agents

The MCP server can be integrated with various agent frameworks and applications. Here are examples of how to use it:

### OpenAI Python Agent

```python
from openai import Agent
from openai.agents import MCPServerStdio

# Connect to the MCP server via stdio
rft = MCPServerStdio(command="node", args=["dist/index.js"])

# Create an agent with access to the MCP server
agent = Agent(
    name="fine-tuner",
    instructions="Create specialized models",
    mcp_servers=[rft]
)

# Use the agent to fine-tune a model
agent.run("Fine-tune a model with the training file-abc and validation file-xyz")
```

### TypeScript Agent

```typescript
import { Agent } from 'openai';
import { MCPServerStdio } from 'openai/agents';

// Connect to the MCP server via stdio
const rft = new MCPServerStdio({ command: 'node', args: ['dist/index.js'] });

// Create an agent with access to the MCP server
const agent = new Agent({ 
  name: 'fine-tuner', 
  instructions: 'Create specialized models', 
  mcpServers: [rft] 
});

// Use the agent to fine-tune a model
await agent.run('Fine-tune a model with the training file-abc and validation file-xyz');
```

### HTTP Integration

When running the server in HTTP mode, you can connect to it from remote agents or applications:

```javascript
// JavaScript example using the OpenAI JS SDK
import { Agent } from 'openai';
import { MCPServerHTTP } from 'openai/agents';

const rft = new MCPServerHTTP({ url: 'http://localhost:3001' });
const agent = new Agent({
  name: 'fine-tuner',
  instructions: 'Create specialized models',
  mcpServers: [rft]
});

await agent.run('Fine-tune a model with the training file-abc and validation file-xyz');
```

## 💻 Development

### Project Structure

```
fine-tuning/
├── src/
│   ├── schemas/      # Zod schemas for API validation
│   ├── server/       # MCP server implementation
│   ├── services/     # OpenAI API interaction
│   ├── config.ts     # Configuration management
│   └── index.ts      # Entry point
├── dist/             # Compiled JavaScript (generated)
├── tool.json         # MCP tool manifest
├── .env              # Environment variables (create this)
└── package.json      # Dependencies and scripts
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Development Workflow

```bash
# Start the server in development mode
npm run dev

# Lint the codebase
npm run lint

# Format the code
npm run format
```

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and add tests
4. Run tests and linting: `npm test && npm run lint`
5. Commit your changes
6. Push to your branch: `git push origin feature/your-feature-name`
7. Create a pull request

## 🚩 Deployment Options

- **CLI/Local**: Use stdio transport for direct agent integration
- **Web Service**: Use HTTP transport for remote agent access
- **Containerized**: Package in Docker for portable deployment
- **Serverless**: Deploy as a serverless function with HTTP transport

## ⚠️ Important Considerations

- **Model Compatibility**: Reinforcement fine-tuning is currently optimized for the OpenAI O-series models.
- **Cost Management**: Reinforcement fine-tuning can be resource-intensive. Monitor your costs carefully, especially for long-running jobs.
- **Data Quality**: The quality of your fine-tuning is highly dependent on your training and validation data.
- **Security**: Never expose your MCP server publicly without proper authentication if it contains your OpenAI API key.

## 📝 License

MIT