# MCP Configuration Wizard CLI

The MCP Configuration Wizard CLI provides an interactive interface for configuring and managing MCP servers in your project.

## Overview

The MCP Configuration Wizard helps you:

1. Discover available MCP servers
2. Configure server parameters and credentials
3. Set appropriate permission scopes
4. Generate and update configuration files
5. Manage existing server configurations

## Command Structure

The wizard is accessible through the `create-sparc wizard` command with various options:

```
create-sparc wizard [options]
```

### Interactive Mode

By default, the wizard runs in interactive mode, guiding you through the configuration process with prompts and selections.

### Non-Interactive Mode

For automation and CI/CD pipelines, you can use the `--no-interactive` flag along with the necessary parameters to configure servers without prompts.

## Configuration Files

The wizard manages two main configuration files:

1. **MCP Configuration File** (`.roo/mcp.json`): Contains server configurations, including command, arguments, and permission scopes.

2. **Roomodes File** (`.roomodes`): Contains roomode definitions for MCP servers, enabling AI assistants to interact with the servers.

## Security Considerations

### Credential Management

The wizard follows security best practices for handling credentials:

- API keys and tokens are stored as environment variable references
- Sensitive information is never stored directly in configuration files
- Clear guidance is provided on setting up environment variables

### Permission Scoping

The wizard helps you configure appropriate permission scopes:

- Default permissions are set to the minimum required
- Clear warnings are provided when expanding beyond recommended permissions
- Detailed explanations of each permission's implications

## Workflow Examples

### Adding a New Server

1. Run `create-sparc wizard`
2. Select "Add a new MCP server"
3. Choose the server from the list or enter a server ID
4. Provide the required parameters (API keys, project IDs, etc.)
5. Review and confirm the configuration
6. Set up the necessary environment variables

### Updating an Existing Server

1. Run `create-sparc wizard`
2. Select "Update an existing MCP server"
3. Choose the server to update
4. Modify the parameters as needed
5. Review and confirm the changes

### Removing a Server

1. Run `create-sparc wizard`
2. Select "Remove an MCP server"
3. Choose the server to remove
4. Confirm the removal

## Troubleshooting

### Common Issues

1. **Configuration File Not Found**: Ensure you're running the command from the project root directory.

2. **Permission Denied**: Check that you have write permissions for the configuration files.

3. **Server Not Available**: Verify your internet connection and that the registry is accessible.

4. **Invalid Parameters**: Double-check the required parameters for the server you're configuring.

### Debug Mode

Use the `--debug` flag to enable detailed logging:

```
create-sparc wizard --debug
```

## Environment Variables

For security reasons, API keys and other sensitive information are stored as environment variable references. You'll need to set these variables in your development environment.

Example for OpenAI MCP server:

```bash
# For OpenAI MCP server
export OPENAI_API_KEY=your_api_key_here
```

## Advanced Usage

### Custom Registry

You can specify a custom registry URL:

```
create-sparc wizard --registry https://your-custom-registry.com/api
```

### Custom Configuration Paths

You can specify custom paths for configuration files:

```
create-sparc wizard --config-path custom/path/mcp.json --roomodes-path custom/path/roomodes
```

## Best Practices

1. **Version Control**: Consider adding `.roo/mcp.json` to version control but exclude any files containing actual secrets.

2. **Environment Variables**: Use a `.env` file for local development (added to `.gitignore`) and proper environment variable management for production.

3. **Regular Updates**: Periodically check for updates to MCP servers and update your configurations.

4. **Permission Auditing**: Regularly review the permissions granted to each server and remove any that are no longer needed.

5. **Documentation**: Document the MCP servers used in your project and their configuration requirements for team members.