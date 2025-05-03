# Minimal Roo Mode Framework

A lightweight, extensible template for creating custom Roo modes and orchestration frameworks.

## Overview

This template provides the essential structure and configuration files needed to get started with custom Roo modes. It includes:

- Basic mode definitions for orchestration, coding, documentation, and MCP integration
- Minimal configuration files for MCP servers
- Guidelines for tool usage and best practices
- Templates for orchestration workflows

## Directory Structure

```
templates/minimal-roo/
├── .roo/                  # Configuration and rules
│   ├── README.md          # Overview and usage instructions
│   ├── mcp.json           # MCP server configuration
│   ├── rules/             # General rules
│   │   ├── general_guidelines.md
│   │   ├── tool_usage_guidelines.md
│   │   └── orchestration_template.md
│   └── rules-code/        # Code-specific rules
│       └── code_guidelines.md
└── .roomodes              # Custom mode definitions
```

## Getting Started

1. Copy this template to your project:
   ```
   cp -r templates/minimal-roo/* your-project/
   ```

2. Customize the mode definitions in `.roomodes` to fit your project's needs

3. Modify the MCP server configuration in `.roo/mcp.json` to connect to your services

4. Add or modify rules in the `.roo/rules/` and `.roo/rules-code/` directories

## Extending the Template

### Adding New Modes

To add a new mode, edit the `.roomodes` file and add a new entry to the `customModes` array:

```json
{
  "slug": "your-mode-slug",
  "name": "🔍 Your Mode Name",
  "roleDefinition": "Brief description of the mode's role",
  "customInstructions": "Detailed instructions for the mode",
  "groups": ["read", "edit", "browser", "mcp", "command"],
  "source": "project"
}
```

### Adding Mode-Specific Rules

1. Create a new directory in `.roo/` named `rules-your-mode-slug`
2. Add markdown files with rules and guidelines specific to your mode

### Configuring MCP Servers

Edit the `.roo/mcp.json` file to add or modify MCP server configurations:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "command-to-run",
      "args": ["arg1", "arg2"],
      "alwaysAllow": ["operation1", "operation2"]
    }
  }
}
```

## Best Practices

1. Keep mode definitions clear and focused on specific responsibilities
2. Use emojis in mode names for better visual distinction
3. Organize rules logically in separate markdown files
4. Document all configuration options and extension points
5. Follow the modular structure pattern for all new components

## License

MIT