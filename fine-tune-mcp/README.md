# fine-tune-mcp

A Model Context Protocol (MCP) server

## Overview

This is a Model Context Protocol (MCP) server that exposes tools, resources, and prompts for use with LLM applications like Claude. MCP servers let you extend AI applications with custom functionality, data sources, and templated interactions.

## Quick Start

### Setup with uv (Recommended)

```bash
# Set up the environment
make setup

# Activate the virtual environment
source .venv/bin/activate  # On Unix/MacOS
# or
.venv\Scripts\activate     # On Windows

# Run the server in development mode with the MCP Inspector
make dev

# Install the server in Claude Desktop
make install
```

### Manual Setup

```bash
# Install uv if you don't have it
pip install uv

# Create a virtual environment
uv venv

# Activate the virtual environment
source .venv/bin/activate  # On Unix/MacOS
# or
.venv\Scripts\activate     # On Windows

# Install the package in development mode
uv pip install -e .

# Run in development mode
mcp dev fine_tune_mcp.server

# Install in Claude Desktop
mcp install fine_tune_mcp.server
```

## Docker

Build and run using Docker:

```bash
# Build the Docker image
make docker-build
# or
docker build -t fine-tune-mcp .

# Run the container
make docker-run
# or
docker run -p 8000:8000 fine-tune-mcp
```

## Server Architecture

The server is organized into several components:

- `server.py`: Main MCP server setup and configuration
- `config.py`: Configuration management
- `tools/`: Tool implementations (functions that LLMs can execute)
- `resources/`: Resource implementations (data that LLMs can access)
- `prompts/`: Prompt template implementations (reusable conversation templates)

## MCP Features

This server implements all three MCP primitives:

1. **Tools**: Functions that the LLM can call to perform actions
   - Example: `calculate`, `fetch_data`, `long_task`

2. **Resources**: Data sources that provide context to the LLM
   - Example: `static://example`, `dynamic://{parameter}`, `config://{section}`

3. **Prompts**: Reusable templates for LLM interactions
   - Example: `simple_prompt`, `structured_prompt`, `data_analysis_prompt`

## Adding Your Own Components

### Adding a New Tool

Create or modify files in the `tools/` directory:

```python
@mcp.tool()
def my_custom_tool(param1: str, param2: int = 42) -> str:
    """
    A custom tool that does something useful.
    
    Args:
        param1: Description of first parameter
        param2: Description of second parameter with default value
        
    Returns:
        Description of the return value
    """
    # Your implementation here
    return f"Result: {param1}, {param2}"
```

### Adding a New Resource

Create or modify files in the `resources/` directory:

```python
@mcp.resource("my-custom-resource://{param}")
def my_custom_resource(param: str) -> str:
    """
    A custom resource that provides useful data.
    
    Args:
        param: Description of the parameter
        
    Returns:
        The resource content
    """
    # Your implementation here
    return f"Resource content for: {param}"
```

### Adding a New Prompt

Create or modify files in the `prompts/` directory:

```python
@mcp.prompt()
def my_custom_prompt(param: str) -> str:
    """
    A custom prompt template.
    
    Args:
        param: Description of the parameter
        
    Returns:
        The formatted prompt
    """
    return f"""
    # Custom Prompt Template
    
    Context: {param}
    
    Please respond with your analysis of the above context.
    """
```

## Configuration

The server supports configuration via:

1. **Environment Variables**: Prefix with `MCP_` (e.g., `MCP_API_KEY=xyz123`)
   - Nested config: Use double underscores (`MCP_DATABASE__HOST=localhost`)

2. **Config File**: Specify via `MCP_CONFIG_FILE` environment variable

Example config:

```json
{
  "api": {
    "key": "xyz123",
    "url": "https://api.example.com"
  },
  "database": {
    "host": "localhost",
    "port": 5432
  }
}
```

## Development

```bash
# Run tests
make test

# Format code
make format

# Type checking
make type-check

# Clean up build artifacts
make clean
```

## License

[Include your license information here]