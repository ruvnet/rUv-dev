# 👨‍💻 Code Guidelines

## Naming Conventions

- Use camelCase for variables and functions in JavaScript/TypeScript
- Use PascalCase for classes and component names
- Use snake_case for variables and functions in Python
- Use UPPER_SNAKE_CASE for constants
- Choose descriptive names that reflect purpose

## Function Design

- Functions should do one thing and do it well
- Keep functions short (generally under 30 lines)
- Limit the number of parameters (prefer objects for multiple parameters)
- Use meaningful parameter names
- Return early to avoid deep nesting
- Document complex functions with JSDoc or similar

## Error Handling

- Never silently catch errors without proper handling
- Use specific error types when possible
- Provide meaningful error messages
- Log errors with appropriate context
- Consider retry mechanisms for transient failures
- Clean up resources in finally blocks or equivalent

## Testing

- Write unit tests for business logic
- Use integration tests for API endpoints
- Test edge cases and error conditions
- Keep tests independent and idempotent
- Use meaningful test descriptions
- Maintain test coverage for critical paths
