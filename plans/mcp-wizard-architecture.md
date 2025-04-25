# MCP Configuration Wizard Architecture

## System Overview

The MCP Configuration Wizard is a modular system designed to simplify the creation and management of MCP.json configurations and related roomodes. It discovers available MCP servers through a registry API and guides users through the configuration process.

## Architecture Principles

- **Separation of Concerns**: Each component has a single, well-defined responsibility
- **Modularity**: Components can be developed, tested, and maintained independently
- **Extensibility**: The system can be extended to support new server types and registry providers
- **Security**: Sensitive information is handled securely throughout the system
- **Usability**: The interface provides clear guidance and feedback to users

## Component Architecture

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                        MCP Configuration Wizard                         │
│                                                                         │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────────────┐   │
│  │             │     │             │     │                         │   │
│  │ CLI         │────►│ Wizard      │────►│ Registry Client         │   │
│  │ Interface   │◄────│ Controller  │◄────│                         │   │
│  │             │     │             │     └─────────────┬───────────┘   │
│  └─────────────┘     │             │                   │               │
│                      │             │                   ▼               │
│                      │             │     ┌─────────────────────────┐   │
│                      │             │     │                         │   │
│                      │             │     │ Registry API            │   │
│                      │             │     │ (External)              │   │
│                      │             │     │                         │   │
│                      │             │     └─────────────────────────┘   │
│  ┌─────────────┐     │             │     ┌─────────────────────────┐   │
│  │             │     │             │     │                         │   │
│  │ File        │◄────┤             │────►│ Configuration           │   │
│  │ Manager     │────►│             │◄────│ Generator               │   │
│  │             │     │             │     │                         │   │
│  └─────────────┘     └─────────────┘     └─────────────────────────┘   │
│         │                                           │                   │
│         ▼                                           ▼                   │
│  ┌─────────────┐                           ┌─────────────────────────┐ │
│  │             │                           │                         │ │
│  │ Project     │                           │ Roomode                 │ │
│  │ Files       │                           │ Generator               │ │
│  │             │                           │                         │ │
│  └─────────────┘                           └─────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Detailed Component Diagram with Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                         │
│                                     MCP Configuration Wizard                                            │
│                                                                                                         │
│  ┌─────────────┐                 ┌─────────────────────────┐                 ┌─────────────────────┐   │
│  │             │ 1. Commands     │                         │ 3. Server Query │                     │   │
│  │ CLI         │────────────────►│                         ├────────────────►│ Registry Client     │   │
│  │ Interface   │                 │                         │                 │                     │   │
│  │             │◄────────────────┤ Wizard Controller       │◄────────────────┤                     │   │
│  └─────────────┘ 2. Prompts &    │                         │ 4. Server List  └─────────┬───────────┘   │
│                   Responses       │                         │                           │               │
│                                   │                         │                           │               │
│                                   │                         │                           │ HTTPS         │
│                                   │                         │                           │               │
│                                   │                         │                           ▼               │
│                                   │                         │                 ┌─────────────────────┐   │
│                                   │                         │                 │                     │   │
│                                   │                         │                 │ Registry API        │   │
│                                   │                         │                 │ (External)          │   │
│                                   │                         │                 │                     │   │
│                                   │                         │                 └─────────────────────┘   │
│  ┌─────────────┐ 9. File Ops     │                         │ 5. Config Req   ┌─────────────────────┐   │
│  │             │◄────────────────┤                         ├────────────────►│                     │   │
│  │ File        │                 │                         │                 │ Configuration        │   │
│  │ Manager     │────────────────►│                         │◄────────────────┤ Generator           │   │
│  │             │ 10. File Status │                         │ 6. Config Data  │                     │   │
│  └─────────┬───┘                 └─────────────────────────┘                 └─────────┬───────────┘   │
│            │                                                                           │               │
│            │                                                                           │               │
│            │                                                                           │               │
│            │                                                                           │               │
│            ▼                                                                           ▼               │
│  ┌─────────────────────┐                                                   ┌─────────────────────────┐ │
│  │                     │                                                   │                         │ │
│  │ Project Files:      │                                                   │ Roomode Generator:      │ │
│  │ - MCP.json          │◄──────────────────────────────────────────────────┤ - Creates mode configs  │ │
│  │ - .roomodes         │                                                   │ - Validates permissions │ │
│  │                     │                                                   │ - Merges with existing  │ │
│  └─────────────────────┘                                                   └─────────────────────────┘ │
│                                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Component Descriptions

### 1. CLI Interface

**Responsibility**: Provides the command-line interface for user interaction.

**Key Functions**:
- Process command arguments and flags
- Display interactive prompts
- Collect and validate user input
- Present results and error messages

**Interfaces**:
- **Input**: Command-line arguments, user responses to prompts
- **Output**: Formatted text output, progress indicators, error messages

### 2. Wizard Controller

**Responsibility**: Orchestrates the configuration process and manages the workflow.

**Key Functions**:
- Coordinate interactions between components
- Manage the step-by-step configuration flow
- Handle error conditions and recovery
- Validate inputs and outputs at each stage

**Interfaces**:
- **Input**: User commands and selections, component responses
- **Output**: Requests to other components, status updates

### 3. Registry Client

**Responsibility**: Communicates with the registry API to discover available MCP servers.

**Key Functions**:
- Establish secure connections to the registry API
- Authenticate with the registry if required
- Fetch and parse server metadata
- Cache results for performance
- Handle network errors and retries

**Interfaces**:
- **Input**: Registry API endpoint, optional authentication credentials
- **Output**: Structured server metadata, error information

### 4. Configuration Generator

**Responsibility**: Creates valid MCP.json configurations based on user selections.

**Key Functions**:
- Generate MCP server configurations
- Validate configurations against schema
- Apply security best practices
- Create default configurations with proper permission scopes

**Interfaces**:
- **Input**: Selected server(s), user-provided configuration parameters
- **Output**: Valid MCP.json configuration objects

### 5. Roomode Generator

**Responsibility**: Creates or updates roomode definitions for MCP integrations.

**Key Functions**:
- Generate roomode definitions for selected servers
- Configure proper tool access permissions
- Merge with existing roomode definitions
- Validate generated modes

**Interfaces**:
- **Input**: Selected server(s), existing roomodes (if any)
- **Output**: Valid roomode definitions

### 6. File Manager

**Responsibility**: Handles file system operations safely.

**Key Functions**:
- Read and write configuration files
- Create backups before modifications
- Check file permissions and existence
- Handle file system errors

**Interfaces**:
- **Input**: File paths, content to write
- **Output**: File content, operation status

## Data Flow

1. **User Initiates Wizard**:
   - User runs the wizard command with optional arguments
   - CLI Interface parses arguments and passes to Wizard Controller

2. **Server Discovery**:
   - Wizard Controller requests available servers from Registry Client
   - Registry Client connects to Registry API and fetches server metadata
   - Server list is returned to Wizard Controller

3. **Server Selection**:
   - Wizard Controller passes server list to CLI Interface
   - CLI Interface presents options to user and collects selection
   - Selected server(s) passed back to Wizard Controller

4. **Configuration Parameter Collection**:
   - Wizard Controller determines required parameters for selected server(s)
   - CLI Interface prompts user for each required parameter
   - Collected parameters passed back to Wizard Controller

5. **Configuration Generation**:
   - Wizard Controller passes server selection and parameters to Configuration Generator
   - Configuration Generator creates MCP.json configuration
   - Configuration Generator passes configuration to Roomode Generator
   - Roomode Generator creates roomode definitions
   - Complete configuration returned to Wizard Controller

6. **Configuration Saving**:
   - Wizard Controller passes configurations to File Manager
   - File Manager creates backups of existing files
   - File Manager writes new configurations to files
   - Status returned to Wizard Controller

7. **Completion**:
   - Wizard Controller passes completion status to CLI Interface
   - CLI Interface displays success message or error information

## Registry API Specification

### Endpoint: GET /api/mcp/servers

Retrieves a list of available MCP servers with their metadata.

#### Request

```http
GET /api/mcp/servers HTTP/1.1
Host: registry.example.com
Authorization: Bearer <token>
```

#### Response

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "servers": [
    {
      "id": "supabase",
      "name": "Supabase",
      "description": "Supabase MCP server for database operations",
      "version": "1.0.0",
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest"
      ],
      "requiredArgs": [
        {
          "name": "access-token",
          "description": "Supabase access token",
          "secret": true,
          "envVar": "SUPABASE_ACCESS_TOKEN"
        },
        {
          "name": "project-id",
          "description": "Supabase project ID",
          "secret": false
        }
      ],
      "optionalArgs": [
        {
          "name": "region",
          "description": "Supabase region",
          "default": "us-east-1"
        }
      ],
      "recommendedPermissions": [
        "list_tables",
        "execute_sql",
        "list_projects"
      ],
      "documentation": "https://example.com/docs/supabase-mcp",
      "tags": ["database", "backend"],
      "popularity": 4.8
    },
    {
      "id": "openai",
      "name": "OpenAI",
      "description": "OpenAI MCP server for AI operations",
      "version": "1.0.0",
      "command": "npx",
      "args": [
        "-y",
        "@openai/mcp-server@latest"
      ],
      "requiredArgs": [
        {
          "name": "api-key",
          "description": "OpenAI API key",
          "secret": true,
          "envVar": "OPENAI_API_KEY"
        }
      ],
      "optionalArgs": [
        {
          "name": "organization",
          "description": "OpenAI organization ID",
          "secret": false
        },
        {
          "name": "model",
          "description": "Default model to use",
          "default": "gpt-4"
        }
      ],
      "recommendedPermissions": [
        "create_completion",
        "list_models",
        "create_embedding"
      ],
      "documentation": "https://example.com/docs/openai-mcp",
      "tags": ["ai", "nlp"],
      "popularity": 4.9
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "pageSize": 10,
    "lastUpdated": "2025-04-20T12:00:00Z"
  }
}
```

#### Error Responses

**401 Unauthorized**
```json
{
  "error": "unauthorized",
  "message": "Invalid or missing authentication token"
}
```

**404 Not Found**
```json
{
  "error": "not_found",
  "message": "Registry endpoint not found"
}
```

**500 Internal Server Error**
```json
{
  "error": "server_error",
  "message": "An unexpected error occurred"
}
```

### Endpoint: GET /api/mcp/servers/{server-id}

Retrieves detailed information about a specific MCP server.

#### Request

```http
GET /api/mcp/servers/supabase HTTP/1.1
Host: registry.example.com
Authorization: Bearer <token>
```

#### Response

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "supabase",
  "name": "Supabase",
  "description": "Supabase MCP server for database operations",
  "version": "1.0.0",
  "command": "npx",
  "args": [
    "-y",
    "@supabase/mcp-server-supabase@latest"
  ],
  "requiredArgs": [
    {
      "name": "access-token",
      "description": "Supabase access token",
      "secret": true,
      "envVar": "SUPABASE_ACCESS_TOKEN"
    },
    {
      "name": "project-id",
      "description": "Supabase project ID",
      "secret": false
    }
  ],
  "optionalArgs": [
    {
      "name": "region",
      "description": "Supabase region",
      "default": "us-east-1"
    }
  ],
  "recommendedPermissions": [
    "list_tables",
    "execute_sql",
    "list_projects"
  ],
  "documentation": "https://example.com/docs/supabase-mcp",
  "tags": ["database", "backend"],
  "popularity": 4.8,
  "examples": [
    {
      "name": "Basic configuration",
      "config": {
        "command": "npx",
        "args": [
          "-y",
          "@supabase/mcp-server-supabase@latest",
          "--access-token",
          "${env:SUPABASE_ACCESS_TOKEN}",
          "--project-id",
          "abcdef123456"
        ],
        "alwaysAllow": [
          "list_tables",
          "execute_sql"
        ]
      }
    }
  ]
}
```

## Data Models

### MCP.json Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "mcpServers": {
      "type": "object",
      "patternProperties": {
        "^[a-zA-Z0-9-_]+$": {
          "type": "object",
          "properties": {
            "command": {
              "type": "string",
              "description": "The command to run the MCP server"
            },
            "args": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Arguments to pass to the MCP server command"
            },
            "alwaysAllow": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "List of permissions to always allow for this server"
            },
            "env": {
              "type": "object",
              "description": "Environment variables to set when running the server"
            }
          },
          "required": ["command", "args"],
          "additionalProperties": false
        }
      },
      "additionalProperties": false
    }
  },
  "required": ["mcpServers"],
  "additionalProperties": false
}
```

### Roomode Schema for MCP Integration

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "slug": {
      "type": "string",
      "pattern": "^mcp-[a-zA-Z0-9-_]+$",
      "description": "Unique identifier for the mode"
    },
    "name": {
      "type": "string",
      "description": "Display name for the mode"
    },
    "roleDefinition": {
      "type": "string",
      "description": "Role definition for the AI assistant"
    },
    "customInstructions": {
      "type": "string",
      "description": "Custom instructions for the AI assistant"
    },
    "groups": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["read", "edit", "mcp"]
      },
      "description": "Permission groups for the mode"
    },
    "source": {
      "type": "string",
      "enum": ["project", "user", "system"],
      "description": "Source of the mode definition"
    }
  },
  "required": ["slug", "name", "roleDefinition", "groups", "source"],
  "additionalProperties": false
}
```

## Integration Points

### 1. Registry API Integration

The Registry Client component integrates with the external Registry API to discover available MCP servers. This integration point requires:

- HTTP/HTTPS communication
- Authentication handling
- JSON parsing and validation
- Error handling and retry logic

### 2. File System Integration

The File Manager component integrates with the file system to read and write configuration files. This integration point requires:

- File system access permissions
- Safe file operations with backups
- Error handling for file system issues

### 3. CLI Integration

The CLI Interface component integrates with the command-line environment. This integration point requires:

- Argument parsing
- Interactive prompt handling
- Terminal output formatting

### 4. Environment Variable Integration

The Configuration Generator component integrates with environment variables for secure credential handling. This integration point requires:

- Environment variable reference syntax
- Documentation on environment setup

## Security Considerations

### 1. Credential Management

- Never store API keys or tokens directly in configuration files
- Use environment variable references (e.g., `${env:API_KEY}`) for sensitive values
- Provide guidance on secure credential storage
- Support integration with credential managers where available

### 2. Permission Scoping

- Configure minimal required permissions by default
- Provide clear documentation on permission implications
- Warn users when expanding beyond recommended permissions
- Support fine-grained permission control

### 3. Input Validation

- Validate all user inputs before processing
- Sanitize inputs to prevent injection attacks
- Validate server responses before processing
- Implement proper error handling for invalid inputs

### 4. Configuration Protection

- Create backups before modifying configurations
- Validate configurations before saving
- Implement recovery options for failed configurations
- Prevent accidental exposure of sensitive information

## Error Handling Strategy

The system implements a comprehensive error handling strategy:

1. **Validation Errors**: Detected during input validation, with clear messages about the specific validation failure.

2. **Network Errors**: Detected during communication with the Registry API, with retry logic and fallback options.

3. **File System Errors**: Detected during file operations, with backup and recovery mechanisms.

4. **Configuration Errors**: Detected during configuration generation or validation, with specific guidance on fixing issues.

5. **Runtime Errors**: Unexpected errors that occur during execution, with graceful degradation and detailed error reporting.

All errors include:
- Clear error message
- Suggested resolution steps
- Context information for debugging
- Error code for reference

## Extension Mechanisms

The architecture supports several extension mechanisms:

### 1. Custom Registry Providers

The Registry Client can be extended to support different registry sources:
- Local registry files for offline use
- Organization-specific registry endpoints
- Custom authentication mechanisms

### 2. Custom Server Templates

The Configuration Generator can be extended with custom templates:
- Server-specific configuration templates
- Organization-specific default configurations
- Custom permission sets

### 3. Custom Roomode Templates

The Roomode Generator can be extended with custom templates:
- Server-specific roomode templates
- Custom role definitions
- Organization-specific permission groups

### 4. Plugin System

A future extension could implement a plugin system to allow third-party extensions:
- Custom validation rules
- Additional configuration generators
- Integration with other tools and services

## Implementation Considerations

### 1. Performance Optimization

- Cache registry responses to reduce network requests
- Implement lazy loading of server details
- Optimize file operations to minimize disk I/O
- Use efficient data structures for configuration processing

### 2. Testability

- Design components with clear interfaces for unit testing
- Implement mock objects for external dependencies
- Support test automation for integration testing
- Include test coverage metrics

### 3. Internationalization

- Support for multiple languages in user interface
- Localized error messages and help text
- Culture-aware formatting of dates and numbers

### 4. Accessibility

- Support for screen readers in CLI interface
- High-contrast output options
- Keyboard navigation for interactive prompts

## Conclusion

This architecture provides a solid foundation for implementing the MCP Configuration Wizard. The modular design with clear component responsibilities enables independent development and testing, while the well-defined interfaces ensure proper integration. The system prioritizes security, usability, and extensibility, making it adaptable to future requirements and new MCP server types.