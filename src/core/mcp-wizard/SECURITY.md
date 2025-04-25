# MCP Security Module

The MCP Security Module provides comprehensive security features for the MCP Configuration Wizard, ensuring proper handling of sensitive information and helping users follow security best practices.

## Features

### 1. Secure Credential Management

The security module prevents hardcoded credentials in your MCP configuration by:

- Automatically detecting sensitive parameters (API keys, tokens, passwords)
- Converting hardcoded values to environment variable references
- Providing clear instructions for setting up environment variables
- Warning when sensitive information is detected in configuration files

Example of secure credential usage:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@1.0.0",
        "--access-token",
        "${env:SUPABASE_ACCESS_TOKEN}"
      ],
      "alwaysAllow": ["list_tables", "execute_query"]
    }
  }
}
```

### 2. Environment Variable Reference Handling

The security module helps manage environment variable references by:

- Validating that referenced environment variables are set
- Providing clear error messages for missing variables
- Generating standardized environment variable names
- Offering setup instructions for required variables

### 3. Permission Scope Validation

The security module helps prevent excessive permissions by:

- Warning about high-risk permissions (admin, delete, execute_sql, etc.)
- Detecting wildcard permissions that could pose security risks
- Recommending the principle of least privilege
- Validating permissions against recommended sets

### 4. Security Auditing

The security module includes a comprehensive auditing system that:

- Scans configurations for security issues
- Categorizes issues by severity (critical, warning, info)
- Provides specific recommendations for each issue
- Generates an overall security report

### 5. Warning System

The security module includes a warning system that:

- Alerts about potentially insecure configurations
- Provides clear explanations of security risks
- Offers actionable recommendations
- Can automatically fix common security issues

## Usage

### Command Line Interface

The MCP Security Module is integrated into the CLI:

```bash
# Perform a security audit
npx create-sparc configure-mcp --security-audit

# Automatically fix security issues
npx create-sparc configure-mcp --security-audit --auto-fix

# Validate environment variable references
npx create-sparc configure-mcp --validate-env
```

### Programmatic Usage

You can also use the security module programmatically:

```javascript
const { mcpSecurity } = require('create-sparc/src/core/mcp-wizard');

// Audit a configuration
const auditResults = mcpSecurity.auditConfiguration(config);

// Secure a configuration
const { securedConfig, appliedFixes } = mcpSecurity.secureConfiguration(config);

// Validate environment variable references
const envVarResults = mcpSecurity.validateEnvVarReferences(config);
```

## Best Practices

1. **Never hardcode sensitive information** - Always use environment variable references
2. **Follow the principle of least privilege** - Grant only the permissions that are necessary
3. **Use specific package versions** - Avoid using "latest" to prevent supply chain attacks
4. **Regularly audit your configurations** - Run security audits periodically
5. **Keep your MCP servers updated** - Use the latest secure versions of MCP servers
6. **Validate environment variables** - Ensure all required variables are set
7. **Use configuration integrity verification** - Detect unauthorized changes to configurations

## Security Recommendations

### Secure Storage of Environment Variables

For development:
- Use `.env` files (but don't commit them to version control)
- Consider using tools like `dotenv` to load environment variables

For production:
- Use a secrets management solution (AWS Secrets Manager, HashiCorp Vault, etc.)
- Consider using a CI/CD system that supports secure variable storage
- Rotate credentials regularly

### Permission Management

- Review the `alwaysAllow` section of your MCP configuration regularly
- Remove permissions that are no longer needed
- Be especially careful with high-risk permissions like:
  - `admin` - Typically grants full access
  - `execute_sql` - Allows arbitrary SQL execution
  - `delete` - Allows data deletion
  - Any permission containing "write", "create", or "update"

### Configuration Integrity

The security module provides integrity verification to detect unauthorized changes:

```javascript
// Calculate integrity hash
const hash = mcpSecurity.calculateIntegrityHash(config);

// Later, verify the configuration hasn't been tampered with
const isIntact = mcpSecurity.verifyIntegrity(config, hash);
```

## Troubleshooting

### Common Issues

1. **Missing environment variables**
   - Ensure all required environment variables are set
   - Check for typos in variable names
   - Verify the environment where your application runs has access to these variables

2. **Permission warnings**
   - Review the permissions and remove any that aren't necessary
   - Consider creating custom permission sets for different environments

3. **Security audit failures**
   - Address critical issues first
   - Use the `--auto-fix` option to automatically fix common issues
   - Follow the specific recommendations provided in the audit report

## Further Reading

- [Environment Variables Best Practices](https://12factor.net/config)
- [Principle of Least Privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege)
- [OWASP Security Configuration Guide](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management_Testing/README)