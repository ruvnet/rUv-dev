# MCP Configuration Wizard

The MCP Configuration Wizard helps you set up and manage MCP servers in your project.

## Usage

```
create-sparc wizard [options]
```

## Options

- `-l, --list` - List all configured MCP servers
- `-a, --add <server-id>` - Add a specific MCP server
- `-r, --remove <server-id>` - Remove a configured MCP server
- `-u, --update <server-id>` - Update a configured MCP server
- `--registry <url>` - Use a custom registry URL
- `--no-interactive` - Run in non-interactive mode (requires all parameters)
- `--config-path <path>` - Custom path to MCP configuration file (default: .roo/mcp.json)
- `--roomodes-path <path>` - Custom path to roomodes file (default: .roomodes)
- `--api-key <key>` - API key for the server (use ${env:VAR_NAME} for environment variables)
- `--region <region>` - Region for the server (default: us-east-1)
- `--permissions <list>` - Comma-separated list of permissions to grant (default: read,write)
- `--model <model>` - Model to use (for AI services)
- `--timeout <seconds>` - Timeout in seconds (default: 10)
- `--debug` - Enable debug output
- `--validate` - Validate the MCP configuration

## Examples

### Interactive Wizard

Run the interactive wizard to configure MCP servers:

```
create-sparc wizard
```

### List Configured Servers

List all configured MCP servers:

```
create-sparc wizard --list
```

### Add a Server

Add a specific MCP server interactively:

```
create-sparc wizard --add openai
```

Add a server non-interactively with all parameters:

```
create-sparc wizard --add openai --no-interactive \
  --api-key "${env:OPENAI_API_KEY}" \
  --region us-east-1 \
  --permissions read,write \
  --model gpt-4 \
  --timeout 30
```

### Update a Server

Update an existing MCP server configuration interactively:

```
create-sparc wizard --update openai
```

Update a server non-interactively:

```
create-sparc wizard --update openai --no-interactive \
  --api-key "${env:OPENAI_API_KEY}" \
  --region eu-west-1 \
  --permissions read,write,delete
```

### Remove a Server

Remove a configured MCP server interactively:

```
create-sparc wizard --remove openai
```

Remove a server non-interactively (without confirmation):

```
create-sparc wizard --remove openai --no-interactive
```

### Validate Configuration

Validate the MCP configuration:

```
create-sparc wizard --validate
```

### Debug Mode

Run any command with debug output:

```
create-sparc wizard --list --debug
```

### Custom Configuration Paths

Use custom paths for configuration files:

```
create-sparc wizard --add openai --config-path custom/path/mcp.json --roomodes-path custom/path/roomodes
```

## Environment Variables

For security reasons, API keys and other sensitive information are stored as environment variable references in the configuration files. You'll need to set these environment variables in your development environment.

Example:

```
# For OpenAI MCP server
export OPENAI_API_KEY=your_api_key_here
```

## Configuration Files

The wizard manages two main configuration files:

- `.roo/mcp.json` - Contains MCP server configurations
- `.roomodes` - Contains roomode definitions for MCP servers

## Troubleshooting

If you encounter issues with the wizard:

1. Use the `--debug` flag to enable debug output
2. Check that your environment variables are correctly set
3. Verify that you have the necessary permissions to write to the configuration files
4. Use the `--validate` option to check your configuration for errors
5. Make sure your server ID follows the naming convention (alphanumeric with hyphens)
6. For non-interactive mode, ensure all required parameters are provided

### Common Errors

- **Invalid server ID**: Server IDs must contain only letters, numbers, and hyphens
- **Server not found**: The specified server ID doesn't exist in your configuration
- **API key is required**: In non-interactive mode, you must provide an API key
- **Permission denied**: Check file system permissions for configuration files
- **Invalid configuration**: Use `--validate` to identify and fix configuration errors

### Environment Variables

When using environment variables in your configuration, make sure they are properly set:

```bash
# Check if environment variable is set
echo $OPENAI_API_KEY

# Set environment variable if needed
export OPENAI_API_KEY=your_api_key_here
```