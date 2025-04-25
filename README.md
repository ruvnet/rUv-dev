# create-sparc

> **Transform your development workflow with SPARC methodology and AI-powered assistance**

`create-sparc` is a powerful agentic toolkit that changes how you build software by integrating the structured SPARC methodology with advanced AI assistance through Roo Code and Model Context Protocol (MCP) capabilities. This comprehensive platform enables AI agents to securely connect with external services like databases, APIs, and cloud resources, allowing developers to create modular, secure, and maintainable applications with unprecedented efficiency while seamlessly bridging the gap between AI and real-world systems.
 
## Installation

You don't need to install this package directly. Use npx to run it:

```bash
npx create-sparc init
```

## Why SPARC?

The SPARC methodology (Specification, Pseudocode, Architecture, Refinement, Completion) breaks down complex development tasks into manageable phases, each handled by specialized AI assistants. This approach ensures:

- **Structured Development**: Clear progression through well-defined phases
- **Modular Architecture**: Code naturally organized into maintainable components
- **Security by Design**: No hard-coded secrets, proper configuration management
- **Comprehensive Testing**: Built-in test-driven development practices
- **Thorough Documentation**: Automatically generated, always up-to-date

## Prerequisites

### Roo Code VS Code Extension

To fully leverage the SPARC methodology, you'll need the Roo Code extension for Visual Studio Code. This powerful extension provides:

- **AI-powered coding assistance** with specialized modes for different development phases
- **Context-aware interactions** that understand your project structure
- **Integrated task management** with the Boomerang task concept
- **Seamless file operations** directly within your editor

You can install the Roo Code extension from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=RooVeterinaryInc.roo-cline).

## Core Features

- Scaffolds new projects with SPARC methodology structure
- Sets up .roo directory and .roomodes file for SPARC modes
- Supports TypeScript projects
- Configurable templates
- Symlink support for efficient file management
- MCP (Model Context Protocol) integration for external services
- Secure credential management
- Comprehensive documentation generation

## What is MCP?

MCP (Model-Context Protocol) is a powerful bridge between your applications and external services that enables AI-assisted interactions with databases, APIs, and cloud resources. With MCP integration in create-sparc, you can:

### Seamless Service Integration

MCP allows your AI assistants to directly interact with external services like Supabase, OpenAI, GitHub, AWS, and Firebase through a standardized protocol. This means your Roo Code assistant can:

- **Query databases** without you writing SQL
- **Deploy applications** to cloud providers
- **Manage infrastructure** across multiple platforms
- **Interact with APIs** using natural language requests
- **Generate and analyze data** from various sources

### Secure by Design

MCP prioritizes security through:

- **Environment variable references** for all sensitive credentials
- **Permission scoping** that follows the principle of least privilege
- **No hardcoded secrets** in any configuration files
- **Automatic security auditing** to detect potential vulnerabilities
- **Secure credential management** with clear separation from code

### Easy Configuration

The MCP Wizard makes setup simple:

- **Interactive configuration** guides you through connecting services
- **Automatic discovery** of available MCP servers
- **Validation and verification** of all configurations
- **Clear documentation** for each integration step
- **Seamless updates** when service requirements change

## Usage

### Create a new project

You can create a new project in two ways:

```bash
# Create a full project with a specific name
npx create-sparc init my-project

# Create only .roo and .roomodes files in the current directory
npx create-sparc init
```

You can also use the shorthand version:

```bash
npx create-sparc my-project
```

Options:
- `--template <name>` - Template to use (default: "default")
- `--skip-install` - Skip dependency installation
- `--use-npm` - Use npm as package manager
- `--use-yarn` - Use yarn as package manager
- `--use-pnpm` - Use pnpm as package manager
- `--no-git` - Skip git initialization
- `--typescript` - Use TypeScript
- `--no-symlink` - Disable symlink creation

### Initialize SPARC files in an existing project

If you want to add SPARC methodology to an existing project, you can run:

```bash
# Navigate to your project directory
cd my-existing-project

# Initialize SPARC files (.roo and .roomodes) without creating project structure
npx create-sparc init
```

This will only create the necessary SPARC files in your current directory without modifying your existing project structure.

### Add a component to an existing project

```bash
npx create-sparc add component --name MyComponent
```

Options:
- `--name <name>` - Component name
- `--type <type>` - Component type (default: "component")
- `--path <path>` - Custom path for component

### Get help

```bash
npx create-sparc help
```

## SPARC Methodology

SPARC stands for:

- **S**pecification
- **P**seudocode
- **A**rchitecture
- **R**efinement
- **C**ompletion

This methodology provides a structured approach to software development, ensuring high-quality, maintainable code. SPARC enables you to deconstruct large, intricate projects into manageable subtasks, each delegated to a specialized mode.

### SPARC with Roo Code Integration

The SPARC methodology is fully integrated with Roo Code through the Boomerang task concept. This integration empowers you to build complex, production-ready, secure, and scalable applications by leveraging specialized AI assistants for different phases of development.

By using advanced reasoning models such as Claude 3.7 Sonnet, GPT-4o, and DeepSeek for analytical tasks, alongside instructive models for coding, DevOps, testing, and implementation, you create a robust, automated, and secure workflow.

### SPARC Modes

When you initialize a project with `npx create-sparc init`, the following specialized modes become available in your Roo Code environment:

- **⚡️ SPARC Orchestrator**: Breaks down large objectives into delegated subtasks aligned to the SPARC methodology
- **📋 Specification Writer**: Captures full project context and translates it into modular pseudocode with TDD anchors
- **🏗️ Architect**: Designs scalable, secure, and modular architectures based on requirements
- **🧠 Auto-Coder**: Writes clean, efficient, modular code based on pseudocode and architecture
- **🧪 Tester (TDD)**: Implements Test-Driven Development by writing tests first and refactoring after minimal implementation
- **🪲 Debugger**: Troubleshoots runtime bugs, logic errors, or integration failures
- **🛡️ Security Reviewer**: Performs static and dynamic audits to ensure secure code practices
- **📚 Documentation Writer**: Writes concise, clear, and modular Markdown documentation
- **🔗 System Integrator**: Merges the outputs of all modes into a working, tested, production-ready system
- **📈 Deployment Monitor**: Observes the system post-launch, collecting performance, logs, and user feedback
- **🧹 Optimizer**: Refactors, modularizes, and improves system performance
- **❓ Ask**: Guides users in formulating precise, modular requests to delegate tasks
- **🚀 DevOps**: Manages deployments and infrastructure operations across cloud providers
- **📘 SPARC Tutorial**: Guides new users through the SPARC development process
- **🔐 Supabase Admin**: Designs and implements database schemas, RLS policies, triggers, and functions for Supabase projects
- **♾️ MCP Integration**: Connects to and manages external services through MCP interfaces

Each mode operates within its own isolated context, ensuring focused and efficient task management while adhering to best practices—avoiding hard-coded environment variables, maintaining files under 500 lines, and ensuring a modular, extensible design.

## MCP Wizard

The MCP (Model Context Protocol) Wizard is a powerful feature that simplifies the configuration and management of external service integrations in your SPARC projects.

### What is the MCP Wizard?

The MCP Wizard is a configuration system that enables seamless integration between your SPARC projects and external services like databases, AI models, cloud providers, and more. It provides:

- **Simplified Service Configuration**: Easily connect to external services with guided setup
- **Secure Credential Management**: Store API keys and tokens as environment variable references
- **Permission Scoping**: Configure appropriate access levels for each service
- **AI Assistant Integration**: Enable Roo Code to interact with external services

The MCP Configuration Wizard consists of the following components:

1. **MCP Wizard** - Main entry point that orchestrates the configuration process
2. **Configuration Generator** - Creates MCP.json configurations and roomode definitions
3. **Registry Client** - Interacts with the MCP Registry API to discover available servers
4. **Security Module** - Ensures proper handling of sensitive information
5. **File Manager** - Provides safe and reliable file system operations for configurations

### MCP Configuration Files

The MCP Wizard manages two main configuration files:

1. **MCP Configuration File** (`.roo/mcp.json`): Contains server configurations, including command, arguments, and permission scopes.

2. **Roomodes File** (`.roomodes`): Contains roomode definitions for MCP servers, enabling AI assistants to interact with the servers.

Example MCP configuration:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "${env:SUPABASE_ACCESS_TOKEN}"
      ],
      "alwaysAllow": [
        "list_tables",
        "execute_sql"
      ]
    }
  }
}
```

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

### Using the MCP Wizard

You can configure MCP servers using the interactive wizard:

```bash
npx create-sparc configure-mcp
```

This will guide you through the process of:
1. Discovering available MCP servers
2. Configuring server parameters and credentials
3. Setting appropriate permission scopes
4. Generating and updating configuration files

#### Interactive Mode Workflow

1. Run `npx create-sparc configure-mcp`
2. Select "Add a new MCP server"
3. Choose the server from the list or enter a server ID
4. Provide the required parameters (API keys, project IDs, etc.)
5. Review and confirm the configuration
6. Set up the necessary environment variables

#### Updating an Existing Server

1. Run `npx create-sparc configure-mcp`
2. Select "Update an existing MCP server"
3. Choose the server to update
4. Modify the parameters as needed
5. Review and confirm the changes

#### Removing a Server

1. Run `npx create-sparc configure-mcp`
2. Select "Remove an MCP server"
3. Choose the server to remove
4. Confirm the removal

### MCP Wizard CLI Commands

The MCP Wizard provides several command-line options:

```bash
# Start the interactive wizard
npx create-sparc configure-mcp

# List configured MCP servers
npx create-sparc configure-mcp --list

# Discover available MCP servers
npx create-sparc configure-mcp --discover

# Add a specific MCP server
npx create-sparc configure-mcp --add <server-id>

# Update a configured MCP server
npx create-sparc configure-mcp --update <server-id>

# Remove a configured MCP server
npx create-sparc configure-mcp --remove <server-id>

# Validate current MCP configuration
npx create-sparc configure-mcp --validate

# Create a backup of current configuration
npx create-sparc configure-mcp --backup

# Perform security audit on MCP configuration
npx create-sparc configure-mcp --security-audit

# Automatically fix security issues
npx create-sparc configure-mcp --security-audit --auto-fix

# Validate environment variable references
npx create-sparc configure-mcp --validate-env
```

### Advanced MCP Configuration Options

For more advanced use cases, you can customize the MCP configuration:

```bash
# Use a custom registry URL
npx create-sparc configure-mcp --registry https://your-custom-registry.com/api

# Specify custom paths for configuration files
npx create-sparc configure-mcp --config-path custom/path/mcp.json --roomodes-path custom/path/roomodes

# Run in non-interactive mode (for CI/CD pipelines)
npx create-sparc configure-mcp --add supabase --no-interactive
```

### MCP Security Features

The MCP Wizard includes comprehensive security features:

1. **Secure Credential Management**
   - Automatically detects sensitive parameters (API keys, tokens, passwords)
   - Converts hardcoded values to environment variable references
   - Provides clear instructions for setting up environment variables
   - Warning when sensitive information is detected in configuration files

2. **Permission Scoping**
   - Default permissions are set to the minimum required
   - Clear warnings are provided when expanding beyond recommended permissions
   - Detailed explanations of each permission's implications
   - Validation against recommended permission sets

3. **Security Auditing**
   - Scans configurations for security issues
   - Categorizes issues by severity (critical, warning, info)
   - Provides specific recommendations for each issue
   - Generates an overall security report

4. **Configuration Protection**
   - Existing configurations are backed up before modification
   - All configurations are validated before saving
   - Hash-based file integrity verification
   - Automatic recovery from failed operations

5. **Warning System**
   - Alerts about potentially insecure configurations
   - Provides clear explanations of security risks
   - Offers actionable recommendations
   - Can automatically fix common security issues

### MCP Registry Integration

The MCP Wizard integrates with the MCP Registry API to discover and retrieve information about available MCP servers. The Registry Client provides:

- **Server Discovery**: Find available MCP servers from the registry
- **Detailed Information**: Get comprehensive details about each server
- **Search Capabilities**: Find servers by name, tags, or other criteria
- **Caching**: Automatic caching for improved performance
- **Error Handling**: Robust error handling with retry mechanisms

Available MCP servers include:
- `supabase` - Supabase database server
- `openai` - OpenAI AI operations server
- `github` - GitHub repository operations server
- `aws` - AWS cloud operations server
- `firebase` - Firebase app development server

Each server includes:
- Basic metadata (name, description, version, etc.)
- Required and optional arguments
- Recommended permissions
- Example configurations
- Roomode templates

For testing purposes, a mock implementation of the Registry Client is available, which simulates all Registry API endpoints without requiring an actual registry server.

### MCP Integration Best Practices

1. **Version Control**: Add `.roo/mcp.json` to version control but exclude any files containing actual secrets.

2. **Environment Variables**: Use a `.env` file for local development (added to `.gitignore`) and proper environment variable management for production.

3. **Regular Updates**: Periodically check for updates to MCP servers and update your configurations.

4. **Permission Auditing**: Regularly review the permissions granted to each server and remove any that are no longer needed.

5. **Documentation**: Document the MCP servers used in your project and their configuration requirements for team members.

6. **Secure Storage of Environment Variables**:
   - For development: Use `.env` files (but don't commit them to version control)
   - For production: Use a secrets management solution (AWS Secrets Manager, HashiCorp Vault, etc.)

7. **Follow the principle of least privilege**: Grant only the permissions that are necessary

8. **Use specific package versions**: Avoid using "latest" to prevent supply chain attacks

## Benefits of SPARC with Roo Code

### Enhanced Development Workflow

- **Specialized AI Assistance**: Each development phase is handled by a dedicated AI mode optimized for that specific task
- **Context Isolation**: Tasks run in isolated contexts, ensuring focused and efficient problem-solving
- **Seamless Handoffs**: Work flows naturally between different development phases
- **Reduced Cognitive Load**: Focus on one aspect of development at a time

### Technical Excellence

- **Modular Architecture**: Ensures code is split into files under 500 lines
- **Security by Design**: Prevents hard-coded secrets and environment variables
- **Test-Driven Development**: Enforces thorough test coverage
- **Documentation First**: Ensures comprehensive documentation

### Team Collaboration

- **Consistent Standards**: Enforces best practices across all team members
- **Knowledge Transfer**: Documentation and code structure make onboarding easier
- **Parallel Development**: Different team members can work on different SPARC phases simultaneously
- **Reduced Technical Debt**: Structured approach prevents accumulation of shortcuts and workarounds

## SPARC Files and Implementation

When you run `npx create-sparc init` without a project name, it creates two essential SPARC files:

### .roo Directory

The `.roo` directory contains configuration files, rules, and templates that define how the SPARC methodology is applied to your project. It includes:

- Rules for code generation
- Templates for components and other project elements
- Configuration for SPARC modes
- Guidelines for development practices
- MCP configuration (mcp.json)

### .roomodes File

The `.roomodes` file defines the different modes that can be used with the SPARC methodology in your project. These modes help structure the development process according to the SPARC phases (Specification, Pseudocode, Architecture, Refinement, Completion).

These files are essential for using the SPARC methodology in your project and provide the foundation for structured, efficient development.

## Implementation Instructions

### Installation & Activation

1. **Initialize SPARC in your project**: Run `npx create-sparc init` in your project directory to set up the necessary SPARC files.
2. **Activate SPARC Orchestrator**: In Roo Code, select the "SPARC Orchestrator" as your primary mode to begin the development process.

### Task Delegation

1. **Use Boomerang Tasks**: Delegate tasks to specialized modes (Specification & Pseudocode, Architect, Code, TDD, etc.) using the Boomerang task concept with clear instructions.
2. **Context Isolation**: Each subtask runs in its own isolated context and returns a concise summary upon completion.
3. **Iterative Refinement**: Modes like TDD, Debug, and Security Reviewer iterate until all tests pass, files remain modular (<500 lines), and no environment variables are hard-coded.

### Final Integration & Monitoring

1. **Integration**: The Integrator mode consolidates outputs from all specialized modes into a final, cohesive deliverable.
2. **Documentation & Monitoring**: The Documentation Writer mode produces detailed guides, while the Post-Deployment Monitor tracks live performance and flags issues.
3. **Continuous Optimization**: The Optimizer mode ensures ongoing improvements and adherence to best practices.

### Customization Options

1. **Tool Access Restrictions**: Adjust the access permissions for each mode to control which tools they can use.
2. **Role Definitions**: Edit the role definitions to match your organization's language and standards.
3. **Project-Specific Overrides**: The `.roomodes` file in your project root can override global settings for your specific project needs.

## Quick Start Example

Here's a quick example of how to use SPARC methodology with Roo Code for a new project:

1. **Initialize a new SPARC project**:
   ```bash
   mkdir my-sparc-project
   cd my-sparc-project
   npx create-sparc init
   ```

2. **Open the project in VS Code with Roo Code extension installed**

3. **Start with the SPARC Orchestrator mode**:
   - Select the "⚡️ SPARC Orchestrator" mode in Roo Code
   - Describe your project goal: "I want to create a REST API for a todo list application"

4. **Follow the guided workflow**:
   - The Orchestrator will break down your project into phases
   - Each phase will be handled by a specialized mode
   - You'll receive clear instructions at each step

5. **Review and integrate the results**:
   - The final code will be modular, secure, and well-tested
   - Documentation will be comprehensive and up-to-date
   - The architecture will follow best practices

This workflow dramatically reduces development time while ensuring high-quality, maintainable code.

## Contributing

Contributions to `create-sparc` are welcome! Whether you're fixing bugs, improving documentation, or proposing new features, your help is appreciated.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

---

Created by [Reuven Cohen](https://github.com/ruvnet) - Agentic Engineer / aiCTO / Vibe Coach

For questions or support, please open an issue on the [GitHub repository](https://github.com/ruvnet/rUv-dev).
