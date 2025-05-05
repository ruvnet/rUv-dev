# Minimal Roo Mode Framework

## Overview

This is a minimal template for creating Roo modes and orchestration frameworks. It provides the essential structure and configuration files needed to get started with custom Roo modes.

## Directory Structure

- `.roo/` - Configuration and rules for Roo modes
  - `README.md` - This file
  - `mcp.json` - MCP server configuration
  - `rules/` - General rules for all modes
  - `rules-code/` - Rules specific to the code mode

- `.roomodes` - Definition of custom modes

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