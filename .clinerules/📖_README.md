# 📖 Cline Rules

This directory contains rules and guidelines for Cline to follow when working with this project, incorporating the SPARC methodology for structured development.

## Structure

- `rules/` - Contains general guidelines and rules for Cline
- `rules-code/` - Contains code-specific guidelines and rules
- `tests/` - Contains testing guidelines and rules

## SPARC Methodology

The SPARC methodology provides a structured workflow for development:

1. **Specification** - Define goals, scope, constraints, and acceptance criteria
2. **Pseudocode** - Develop high-level logic with TDD anchors
3. **Architecture** - Design modular components with clear interfaces
4. **Refinement** - Implement with TDD, debugging, and optimization
5. **Completion** - Integrate, document, test, and verify against criteria

## Usage

Cline automatically processes all Markdown files inside the `.clinerules/` directory, combining them into a unified set of rules. The numeric prefixes (optional) help organize files in a logical sequence.

## Benefits of the Folder Approach

- **Contextual Activation**: Copy only relevant rules from the bank to the active folder
- **Easier Maintenance**: Update individual rule files without affecting others
- **Team Flexibility**: Different team members can activate rules specific to their current task
- **Reduced Noise**: Keep the active ruleset focused and relevant

## Managing Rules with the Toggleable Popover

Located under the chat input field, the popover UI allows you to:

- Instantly See Active Rules: View which global rules and workspace rules are currently active
- Quickly Toggle Rules: Enable or disable specific rule files within your workspace
- Easily Add/Manage Rules: Create a workspace `.clinerules` file or folder if one doesn't exist

## Memory Bank

The Memory Bank files (prefixed with emojis) provide Cline with persistent memory between sessions:

- 📋 `_projectbrief.md` - Foundation document defining core requirements and goals
- 🔍 `_productContext.md` - Why this project exists and how it should work
- 🔄 `_activeContext.md` - Current work focus, recent changes, and next steps
- 🏗️ `_systemPatterns.md` - System architecture and key technical decisions
- ⚙️ `_techContext.md` - Technologies used and development setup
- 📊 `_progress.md` - Project status, completed features, and known issues
- 🧠 `_memory-bank.md` - Core documentation about the Memory Bank system itself
