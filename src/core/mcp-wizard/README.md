# MCP Configuration Wizard

The MCP Configuration Wizard is a system that simplifies the creation and management of MCP.json configurations and related roomodes. It interacts with a registry API endpoint to discover available MCP servers and their capabilities, then guides users through configuring these services for their projects.

## Components

The MCP Configuration Wizard consists of the following components:

1. **MCP Wizard** - Main entry point that orchestrates the configuration process
2. **Configuration Generator** - Creates MCP.json configurations and roomode definitions
3. **Schema** - Defines the structure and validation rules for configurations
4. **Templates** - Provides templates for different server types

## Usage

### Configuring MCP Servers

```javascript
const { mcpWizard } = require('create-sparc');

// Server metadata from registry
const serverMetadata = {
  id: 'supabase',
  name: 'Supabase',
  description: 'Supabase MCP server for database operations',
  version: '1.0.0',
  command: 'npx',
  args: ['-y', '@supabase/mcp-server-supabase@latest'],
  requiredArgs: [
    {
      name: 'access-token',
      description: 'Supabase access token',
      secret: true,
      envVar: 'SUPABASE_ACCESS_TOKEN'
    }
  ],
  recommendedPermissions: ['list_tables', 'execute_sql'],
  tags: ['database']
};

// User-provided parameters
const serverParams = {
  'access-token': 'your-token',
  'project-id': 'your-project'
};

// Configure the server
const result = await mcpWizard.configureServers([
  { metadata: serverMetadata, params: serverParams }
], {
  projectPath: process.cwd(),
  mcpConfigPath: '.roo/mcp.json',
  roomodesPath: '.roomodes',
  mergeExisting: true
});

if (result.success) {
  console.log('MCP server configured successfully!');
} else {
  console.error('Failed to configure MCP server:', result.error);
}
```

### Adding a Server to Existing Configuration

```javascript
const result = await mcpWizard.addServer(serverMetadata, serverParams);
```

### Removing a Server from Configuration

```javascript
const result = await mcpWizard.removeServer('supabase');
```

### Updating Server Configuration

```javascript
const result = await mcpWizard.updateServer('supabase', {
  'project-id': 'new-project-id'
});
```

### Listing Configured Servers

```javascript
const result = await mcpWizard.listServers();
if (result.success) {
  console.log('Configured servers:', result.servers);
}
```

## Configuration Generator

The Configuration Generator can be used directly for more fine-grained control:

```javascript
const { configGenerator } = require('create-sparc');

// Generate server configuration
const serverConfig = configGenerator.generateServerConfig(serverMetadata, serverParams);

// Generate roomode definition
const roomode = configGenerator.generateRoomodeDefinition(serverMetadata);

// Validate configurations
const validationResult = configGenerator.validateMcpConfig(mcpConfig);
```

## MCP.json Schema

The MCP.json file follows this schema:

```json
{
  "mcpServers": {
    "[server-id]": {
      "command": "string",
      "args": ["string"],
      "alwaysAllow": ["string"],
      "env": {
        "ENV_VAR": "value"
      }
    }
  }
}
```

## Roomode Schema for MCP Integration

MCP integration roomodes follow this structure:

```json
{
  "slug": "mcp-[server-id]",
  "name": "Server Name Integration",
  "model": "claude-3-7-sonnet-20250219",
  "roleDefinition": "You are a specialized assistant...",
  "customInstructions": "Server-specific instructions...",
  "groups": ["read", "edit", "mcp"],
  "source": "project"
}
```

## Security Considerations

1. **Credential Management**
   - API keys and tokens are stored as environment variable references
   - Sensitive parameters are automatically detected and handled securely
   - References use the format `${env:ENV_VAR_NAME}`

2. **Permission Scoping**
   - Minimal required permissions are configured by default
   - Server-specific recommended permissions are included

3. **Configuration Protection**
   - Existing configurations are backed up before modification
   - All configurations are validated before saving