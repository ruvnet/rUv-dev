# Clinerules Folder System Guide

This guide provides detailed information on how to effectively use the Clinerules folder system to manage and organize your Cline rules.

## Table of Contents

1. [Introduction](#introduction)
2. [Folder Structure](#folder-structure)
3. [Rule File Format](#rule-file-format)
4. [Managing Rules](#managing-rules)
5. [Best Practices](#best-practices)
6. [Advanced Usage](#advanced-usage)
7. [Troubleshooting](#troubleshooting)

## Introduction

The Clinerules folder system is a modular approach to managing Cline rules that allows you to:

- Organize rules by category (clients, frameworks, project types, etc.)
- Activate only the rules relevant to your current task
- Maintain a central repository of rules (rules bank)
- Easily switch between different rule sets

This approach is particularly useful for teams working on multiple projects with different requirements, coding standards, or client specifications.

## Folder Structure

The recommended folder structure for the Clinerules system is:

```
your-project/
├── .clinerules/              # Active rules folder (automatically applied)
│   ├── 01-coding.md          # Core coding standards
│   ├── 02-documentation.md   # Documentation requirements
│   └── current-sprint.md     # Rules specific to current work
│
├── clinerules-bank/          # Repository of available but inactive rules
│   ├── README.md             # Overview of the rules bank
│   ├── manage-rules.sh       # Utility script for managing rules
│   ├── clients/              # Client-specific rule sets
│   │   ├── client-a.md
│   │   └── client-b.md
│   ├── frameworks/           # Framework-specific rules
│   │   ├── react.md
│   │   └── vue.md
│   ├── project-types/        # Project type standards
│   │   ├── api-service.md
│   │   └── frontend-app.md
│   └── orchestration/        # Role-based rules for SPARC methodology
│       ├── sparc-methodology.md
│       ├── architect-role.md
│       └── ...
└── ...
```

### Key Components

- **`.clinerules/`**: This directory contains all currently active rules that Cline will apply when interacting with your project.
- **`clinerules-bank/`**: This directory serves as a repository of rule files that can be activated as needed.

## Rule File Format

Each rule file should follow a consistent format to ensure readability and maintainability:

```markdown
# Title of Rule Set

## Overview/Purpose

Brief description of what these rules are for and when they should be used.

## Section 1

- Rule 1
- Rule 2
- Rule 3

## Section 2

- Rule 4
- Rule 5
- Rule 6

## Best Practices

- Best practice 1
- Best practice 2
```

## Managing Rules

### Using the Management Script

The `manage-rules.sh` script provides a convenient way to manage your Clinerules files:

```bash
# List all available rule files
./clinerules-bank/manage-rules.sh list

# List currently active rules
./clinerules-bank/manage-rules.sh active

# Activate a specific rule file
./clinerules-bank/manage-rules.sh activate frameworks/react.md

# Deactivate a specific rule file
./clinerules-bank/manage-rules.sh deactivate frameworks/react.md

# Backup current active rules
./clinerules-bank/manage-rules.sh backup

# Restore rules from backup
./clinerules-bank/manage-rules.sh restore

# Remove all active rules
./clinerules-bank/manage-rules.sh clear
```

### Manual Management

You can also manage rules manually:

```bash
# Activate a rule
cp clinerules-bank/frameworks/react.md .clinerules/

# Deactivate a rule
rm .clinerules/react.md
```

### Using the Cline Popover UI

Cline provides a popover UI that allows you to:

1. View active rules
2. Toggle rules on/off
3. Add new rules

Access this UI from the chat interface under the input field.

## Best Practices

### Rule Organization

- **Use Numeric Prefixes**: Prefix filenames with numbers (e.g., `01-coding.md`, `02-documentation.md`) to control the order in which rules are applied.
- **Group Related Rules**: Keep related rules in the same file to maintain context.
- **Keep Rules Focused**: Each rule file should have a clear, specific purpose.

### Rule Activation

- **Minimal Active Rules**: Only activate the rules you need for your current task.
- **Complementary Rule Sets**: Combine rule sets that work well together (e.g., framework + project type).
- **Task-Specific Activation**: Create task-specific combinations of rules for different phases of development.

### Rule Maintenance

- **Regular Updates**: Review and update rule files regularly to reflect evolving best practices.
- **Version Control**: Keep your rules bank under version control to track changes.
- **Documentation**: Document the purpose and usage of each rule file.

## Advanced Usage

### Role-Based Development with SPARC

For complex projects, the SPARC methodology provides a structured approach to development with specialized roles:

1. **Specification Writer**: Captures requirements and creates pseudocode
2. **Architect**: Designs system architecture and component boundaries
3. **Auto-Coder**: Implements components based on specifications
4. **TDD Specialist**: Creates and maintains tests
5. **Debugger**: Identifies and fixes issues
6. **Optimizer**: Refactors and improves performance
7. **Security Reviewer**: Ensures security best practices
8. **Documentation Writer**: Creates comprehensive documentation
9. **System Integrator**: Ensures components work together
10. **Deployment Monitor**: Manages deployment and monitoring

Activate the appropriate role-based rule file when switching roles:

```bash
# When working as an architect
./clinerules-bank/manage-rules.sh activate orchestration/architect-role.md

# When implementing components
./clinerules-bank/manage-rules.sh activate orchestration/auto-coder-role.md
```

### Creating Custom Rule Sets

You can create custom rule sets for specific projects or tasks:

1. Create a new markdown file in the appropriate category directory
2. Follow the established format for rule files
3. Add your custom rules
4. Activate the rule file when needed

## Troubleshooting

### Common Issues

- **Rules Not Applied**: Ensure the rule file is in the `.clinerules/` directory and follows the correct format.
- **Conflicting Rules**: If rules conflict, the rule in the file with the higher alphabetical/numerical prefix takes precedence.
- **Performance Issues**: Too many active rules can impact performance. Keep only necessary rules active.

### Getting Help

- Review the Cline documentation for more information on rule formatting and usage
- Check the README files in each directory for category-specific guidance
- Use the `help` command in the management script for usage information
