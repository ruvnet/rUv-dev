# Cline Rules Bank

This directory contains a collection of rule files that can be selectively activated by copying them to the `.clinerules/` directory in your project root.

## Directory Structure

- **clients/** - Client-specific rule sets
  - `client-a.md` - Rules specific to Client A projects
  - `client-b.md` - Rules specific to Client B projects

- **frameworks/** - Framework-specific rules
  - `react.md` - Rules for React projects
  - `vue.md` - Rules for Vue.js projects

- **project-types/** - Project type standards
  - `api-service.md` - Rules for API service projects
  - `frontend-app.md` - Rules for frontend applications

- **orchestration/** - Role-based rules for SPARC methodology
  - `sparc-methodology.md` - Overview of the SPARC methodology
  - `architect-role.md` - Rules for the Architect role
  - `auto-coder-role.md` - Rules for the Auto-Coder role
  - `debugger-role.md` - Rules for the Debugger role
  - `deployment-monitor-role.md` - Rules for the Deployment Monitor role
  - `docs-writer-role.md` - Rules for the Documentation Writer role
  - `mcp-integration-role.md` - Rules for the MCP Integration role
  - `optimizer-role.md` - Rules for the Optimizer role
  - `security-reviewer-role.md` - Rules for the Security Reviewer role
  - `specification-writer-role.md` - Rules for the Specification Writer role
  - `system-integrator-role.md` - Rules for the System Integrator role
  - `tdd-role.md` - Rules for the TDD role

## Usage

To activate a specific rule set, copy the desired rule file(s) to the `.clinerules/` directory in your project root:

```bash
# Activate React framework rules
cp clinerules-bank/frameworks/react.md .clinerules/

# Activate Client A specific rules
cp clinerules-bank/clients/client-a.md .clinerules/
```

You can also use the Cline popover UI to toggle rules on and off without manually copying files.

## Creating New Rule Files

When creating new rule files for the bank:

1. Place them in the appropriate category directory
2. Use clear, descriptive filenames
3. Follow the established format for rule files
4. Include a clear title and description
5. Organize rules into logical sections
6. Use markdown formatting for readability

## Best Practices

- Activate only the rules relevant to your current task
- Combine complementary rule sets (e.g., framework + project type)
- Review and update rule files regularly
- Create project-specific rule files for unique requirements
- Use the SPARC methodology roles for complex projects requiring specialized expertise
