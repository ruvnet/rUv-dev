# 💻 Core Coding Standards

## SPARC Coding Principles

- **Modularity**: Every file ≤ 500 lines, every function ≤ 50 lines with clear single responsibility
- **Security**: No hard-coded secrets, credentials, or environment variables
- **Validation**: All user inputs must be validated and sanitized
- **Error Handling**: Proper error handling in all code paths
- **Documentation**: Self-documenting code with strategic comments explaining "why" not "what"
- **Testing**: Design for unit testing with dependency injection and mockable interfaces

## General Guidelines

- Follow established coding conventions for the language/framework being used
- Use consistent indentation (2 spaces for JavaScript/TypeScript, 4 spaces for Python)
- Keep functions small and focused on a single responsibility
- Use meaningful variable and function names
- Add comments for complex logic, but prefer self-documenting code
- Avoid deep nesting of conditionals and loops
- Handle errors appropriately
- Write unit tests for critical functionality

## Code Organization

- Group related functionality together
- Separate concerns appropriately
- Use modules/components to encapsulate functionality
- Follow the project's established architecture patterns
- Apply SOLID principles (Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion)
- Eliminate code duplication through abstraction (DRY principle)

## Performance Considerations

- Be mindful of performance implications, especially in loops or recursive functions
- Avoid unnecessary computations or memory usage
- Consider caching results of expensive operations when appropriate
- Use appropriate data structures for the task at hand
- Optimize critical paths while maintaining readability
