# 🏃 Current Sprint Guidelines

## SPARC Implementation Focus

- Apply SPARC methodology to all new development tasks
- Break down complex features into SPARC workflow phases
- Use subtasks for each SPARC phase when appropriate
- Ensure all code follows SPARC modular architecture principles

## Focus Areas

- Prioritize bug fixes for the user authentication system
- Implement new features for the reporting dashboard
- Improve test coverage for core modules
- Refactor the data processing pipeline for better performance
- Ensure all files remain under 500 lines with clear modular boundaries

## Code Review Criteria

- All new code must have corresponding tests
- Performance impact must be documented for any changes to critical paths
- Security implications must be reviewed for authentication-related changes
- UI changes must be tested on all supported browsers
- Verify no environment variables or secrets are hardcoded
- Confirm proper error handling in all code paths
- Check that functions follow single responsibility principle

## Technical Debt

- Identify and document technical debt as you encounter it
- Allocate time for addressing critical technical debt items
- Refactor code that doesn't meet our current standards when modifying it
- Split files exceeding 500 lines into logical modules

## Documentation

- Update API documentation for any changed endpoints
- Document any new configuration options
- Update the developer setup guide with new dependencies
- Auto-document each feature with clear examples
- Include SPARC phase documentation for complex features
