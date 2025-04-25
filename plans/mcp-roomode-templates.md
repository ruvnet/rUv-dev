# MCP Roomode Templates Specification

## Overview

This document specifies the structure and generation process for MCP-specific roomodes. These roomodes enable Roo to interact with MCP servers effectively by providing the appropriate role definitions, instructions, and permissions.

## Purpose

MCP roomodes serve several key purposes:
1. Define the AI assistant's role when interacting with a specific MCP server
2. Provide specialized instructions for working with the server's capabilities
3. Configure appropriate permission groups for secure operation
4. Ensure consistent user experience across different MCP integrations

## Roomode Structure

Each MCP roomode follows this general structure:

```json
{
  "slug": "mcp-{server-id}",
  "name": "{Server Name} Integration",
  "model": "claude-3-7-sonnet-20250219",
  "roleDefinition": "You are a specialized assistant for working with {Server Name}...",
  "customInstructions": "When working with {Server Name}, follow these guidelines...",
  "groups": [
    "read",
    "edit",
    "mcp"
  ],
  "source": "project"
}
```

### Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| `slug` | Unique identifier for the mode, prefixed with "mcp-" | `"mcp-supabase"` |
| `name` | Display name for the mode | `"Supabase Database Assistant"` |
| `model` | The AI model to use | `"claude-3-7-sonnet-20250219"` |
| `roleDefinition` | Defines the AI's role and capabilities | See below |
| `customInstructions` | Specific instructions for working with this MCP | See below |
| `groups` | Permission groups for the mode | `["read", "edit", "mcp"]` |
| `source` | Source of the mode definition | `"project"` |

## Role Definition Templates

Role definitions should be tailored to each MCP server type. Here are templates for common server types:

### Database Server (e.g., Supabase)

```
You are a specialized database assistant for working with {Server Name}. You help users interact with their database by writing and executing SQL queries, exploring database schema, and managing database objects.

Your capabilities include:
- Listing available tables and views
- Describing table schemas
- Writing and executing SQL queries
- Analyzing query results
- Suggesting database optimizations
- Creating and modifying database objects

You have access to MCP tools that allow you to directly interact with the {Server Name} database. Use these tools responsibly and always confirm potentially destructive operations with the user.
```

### AI Service (e.g., OpenAI)

```
You are a specialized AI service assistant for working with {Server Name}. You help users leverage AI capabilities by creating prompts, managing models, and processing results.

Your capabilities include:
- Listing available AI models
- Generating text completions
- Creating embeddings
- Processing and analyzing AI outputs
- Optimizing prompts for better results
- Managing usage and costs

You have access to MCP tools that allow you to directly interact with {Server Name} services. Use these tools to demonstrate capabilities and process user requests efficiently.
```

### Cloud Service (e.g., AWS)

```
You are a specialized cloud service assistant for working with {Server Name}. You help users manage their cloud resources, deploy applications, and monitor services.

Your capabilities include:
- Listing available cloud resources
- Describing resource configurations
- Monitoring resource status
- Deploying and updating applications
- Managing access and permissions
- Optimizing resource usage

You have access to MCP tools that allow you to directly interact with {Server Name} services. Always prioritize security and cost-efficiency when suggesting actions.
```

## Custom Instructions Templates

Custom instructions provide specific guidance for working with each MCP server type:

### Database Server

```
When working with {Server Name} database:

1. Always list available tables first when exploring a new database.
2. Use SELECT queries before suggesting modifications to data.
3. Explain the purpose and impact of SQL queries before executing them.
4. For destructive operations (DELETE, DROP, etc.), always ask for confirmation.
5. Format query results in a readable way using markdown tables.
6. Suggest indexes or optimizations when appropriate.
7. When errors occur, explain them in simple terms and suggest fixes.

Use these MCP tools:
- `list_tables` to show available tables
- `describe_table` to show table schema
- `execute_sql` to run SQL queries
- `explain_query` to analyze query performance
```

### AI Service

```
When working with {Server Name} AI service:

1. Start by understanding the user's goal before suggesting AI operations.
2. Recommend appropriate models based on the task requirements.
3. Explain the capabilities and limitations of different models.
4. Help craft effective prompts that produce better results.
5. Process and summarize AI outputs to extract key insights.
6. Be mindful of token usage and suggest optimizations when appropriate.
7. Handle errors gracefully and suggest alternative approaches.

Use these MCP tools:
- `list_models` to show available models
- `create_completion` to generate text
- `create_embedding` to create vector embeddings
- `estimate_tokens` to check token usage
```

### Cloud Service

```
When working with {Server Name} cloud service:

1. Always check resource status before suggesting modifications.
2. Prioritize security best practices in all recommendations.
3. Consider cost implications of actions and suggest optimizations.
4. Explain cloud concepts in accessible terms.
5. Provide context for error messages from the cloud service.
6. Suggest monitoring and alerting when appropriate.
7. Document important configuration changes.

Use these MCP tools:
- `list_resources` to show available resources
- `describe_resource` to show resource details
- `update_resource` to modify resources
- `deploy_application` to deploy code
- `monitor_resource` to check status
```

## Permission Groups

MCP roomodes should include these permission groups:

1. `read` - Allows reading project files
2. `edit` - Allows modifying project files
3. `mcp` - Allows using MCP tools

For certain MCP servers, additional specialized groups may be appropriate:

- `database` - For database operations
- `ai` - For AI service operations
- `cloud` - For cloud service operations

## Generation Process

The roomode generation process follows these steps:

1. **Fetch Server Metadata**: Retrieve server details from the registry
2. **Select Template**: Choose the appropriate template based on server type
3. **Populate Template**: Fill in server-specific details
4. **Customize Permissions**: Configure appropriate permission groups
5. **Validate Roomode**: Ensure the generated roomode is valid
6. **Merge with Existing**: If a roomode already exists, merge appropriately

### Template Selection Logic

```javascript
function selectTemplate(serverMetadata) {
  const serverTags = serverMetadata.tags || [];
  
  if (serverTags.includes('database')) {
    return templates.database;
  } else if (serverTags.includes('ai')) {
    return templates.ai;
  } else if (serverTags.includes('cloud')) {
    return templates.cloud;
  } else {
    return templates.generic;
  }
}
```

### Template Population

```javascript
function populateTemplate(template, serverMetadata) {
  return {
    slug: `mcp-${serverMetadata.id}`,
    name: `${serverMetadata.name} Integration`,
    model: "claude-3-7-sonnet-20250219",
    roleDefinition: template.roleDefinition.replace(/{Server Name}/g, serverMetadata.name),
    customInstructions: template.customInstructions.replace(/{Server Name}/g, serverMetadata.name),
    groups: ["read", "edit", "mcp", ...template.additionalGroups],
    source: "project"
  };
}
```

## Example Generated Roomodes

### Supabase Example

```json
{
  "slug": "mcp-supabase",
  "name": "Supabase Database Assistant",
  "model": "claude-3-7-sonnet-20250219",
  "roleDefinition": "You are a specialized database assistant for working with Supabase. You help users interact with their database by writing and executing SQL queries, exploring database schema, and managing database objects.\n\nYour capabilities include:\n- Listing available tables and views\n- Describing table schemas\n- Writing and executing SQL queries\n- Analyzing query results\n- Suggesting database optimizations\n- Creating and modifying database objects\n\nYou have access to MCP tools that allow you to directly interact with the Supabase database. Use these tools responsibly and always confirm potentially destructive operations with the user.",
  "customInstructions": "When working with Supabase database:\n\n1. Always list available tables first when exploring a new database.\n2. Use SELECT queries before suggesting modifications to data.\n3. Explain the purpose and impact of SQL queries before executing them.\n4. For destructive operations (DELETE, DROP, etc.), always ask for confirmation.\n5. Format query results in a readable way using markdown tables.\n6. Suggest indexes or optimizations when appropriate.\n7. When errors occur, explain them in simple terms and suggest fixes.\n\nUse these MCP tools:\n- `list_tables` to show available tables\n- `describe_table` to show table schema\n- `execute_sql` to run SQL queries\n- `explain_query` to analyze query performance",
  "groups": [
    "read",
    "edit",
    "mcp",
    "database"
  ],
  "source": "project"
}
```

### OpenAI Example

```json
{
  "slug": "mcp-openai",
  "name": "OpenAI Integration",
  "model": "claude-3-7-sonnet-20250219",
  "roleDefinition": "You are a specialized AI service assistant for working with OpenAI. You help users leverage AI capabilities by creating prompts, managing models, and processing results.\n\nYour capabilities include:\n- Listing available AI models\n- Generating text completions\n- Creating embeddings\n- Processing and analyzing AI outputs\n- Optimizing prompts for better results\n- Managing usage and costs\n\nYou have access to MCP tools that allow you to directly interact with OpenAI services. Use these tools to demonstrate capabilities and process user requests efficiently.",
  "customInstructions": "When working with OpenAI AI service:\n\n1. Start by understanding the user's goal before suggesting AI operations.\n2. Recommend appropriate models based on the task requirements.\n3. Explain the capabilities and limitations of different models.\n4. Help craft effective prompts that produce better results.\n5. Process and summarize AI outputs to extract key insights.\n6. Be mindful of token usage and suggest optimizations when appropriate.\n7. Handle errors gracefully and suggest alternative approaches.\n\nUse these MCP tools:\n- `list_models` to show available models\n- `create_completion` to generate text\n- `create_embedding` to create vector embeddings\n- `estimate_tokens` to check token usage",
  "groups": [
    "read",
    "edit",
    "mcp",
    "ai"
  ],
  "source": "project"
}
```

## Merging with Existing Roomodes

When a roomode already exists for an MCP server, the wizard should:

1. Preserve user customizations where possible
2. Update the role definition and instructions with the latest template
3. Ensure required permission groups are present
4. Maintain any additional groups added by the user

The merging algorithm should prioritize user customizations while ensuring the roomode remains functional with the latest MCP server version.

## Validation Rules

Generated roomodes must pass these validation checks:

1. `slug` must be unique and follow the format `mcp-{server-id}`
2. `name` must be non-empty and descriptive
3. `roleDefinition` must be comprehensive and specific to the server type
4. `customInstructions` must provide clear guidance for using the MCP tools
5. `groups` must include at least `read`, `edit`, and `mcp`
6. All required fields must be present

## Extension Points

The roomode generation system supports these extension points:

1. **Custom Templates**: Organizations can define their own templates for specific server types
2. **Template Overrides**: Specific parts of templates can be overridden for certain servers
3. **Additional Groups**: Custom permission groups can be added for specialized servers
4. **Validation Rules**: Additional validation rules can be defined for organizational requirements

## Conclusion

This specification provides a comprehensive guide for generating MCP-specific roomodes. By following these templates and processes, the MCP Configuration Wizard can create consistent, effective roomodes that enhance the user experience when working with MCP servers.

The templating system balances standardization with customization, ensuring that roomodes are both consistent across server types and tailored to each server's specific capabilities and requirements.