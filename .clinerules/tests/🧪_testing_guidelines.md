# 🧪 Testing Guidelines

## Unit Testing

- Write tests for individual functions and components
- Focus on testing behavior, not implementation details
- Use mocks and stubs for external dependencies
- Keep tests fast and independent
- Follow the AAA pattern (Arrange, Act, Assert)

## Integration Testing

- Test interactions between components
- Focus on critical paths and user flows
- Use realistic test data
- Consider edge cases and error scenarios
- Test both success and failure paths

## End-to-End Testing

- Test complete user journeys
- Focus on critical business flows
- Use realistic test environments
- Minimize test flakiness
- Balance coverage with execution time

## Test Organization

- Group tests logically by feature or component
- Use descriptive test names that explain the expected behavior
- Organize test files to mirror the structure of the code being tested
- Separate test utilities and helpers into their own modules

## Test Data Management

- Use factories or builders for test data
- Avoid hardcoding test data
- Clean up test data after tests run
- Use realistic but anonymized data for integration and E2E tests
