# Serverless MCP Tests

This directory contains unit tests for the serverless MCP implementation. The tests focus on ensuring the correctness of serverless handlers across different cloud providers (AWS Lambda, Azure Functions, and Google Cloud Functions) and the core utilities that support them.

## Test Coverage

The test suite covers:

1. **Handler Utilities** - Core utilities for request/response formatting, error handling and metrics
2. **Cold Start Optimization** - Testing cold start detection and optimization techniques
3. **Environment Configuration** - Environment variable loading and validation
4. **Server Configuration** - Server initialization and state management
5. **Request Routing** - Core request routing functionality
6. **Cloud Provider Handlers**:
   - AWS Lambda Handler
   - Azure Functions Handler
   - Google Cloud Functions Handler

## Testing Approach

These tests follow the London School of Test-Driven Development (also known as "mockist" TDD), which focuses on:

- Testing the interfaces and collaborations between components
- Using mocks for dependencies to isolate components being tested
- Starting with high-level behavior and working inward
- Verifying interactions between components

## Running Tests

To run the tests:

```bash
# Run all tests
npm test

# Run only serverless tests
npm test -- --testPathPattern=src/__tests__/serverless

# Run a specific test file
npm test -- handler-utils.test.js
```

## Mocking Strategy

The tests use Jest's mocking capabilities to isolate components:

1. **Handler Utils** - Minimal mocking, directly tests utility functions
2. **Cold Start Optimization** - Mocks environment configuration
3. **Environment** - Uses process.env manipulation to test configuration loading
4. **Server Config** - Mocks dependencies for initialization
5. **Routing Handler** - Mocks server initialization and response utilities
6. **Cloud Provider Handlers** - Mocks routing handler to test provider-specific request/response conversion

## Test Structure

Each test file follows a consistent structure:

1. Mock setup for dependencies
2. Import of the module under test
3. Test suites organized by functionality
4. Tests for both success and error scenarios

## Adding New Tests

When adding new tests:

1. Follow the existing patterns and structure
2. Mock dependencies appropriately
3. Test both success and error cases
4. Test interface contracts between components
5. Ensure coverage of all code paths

## Handler Testing Checklist

When testing a new handler implementation:

- [ ] Test request format conversion
- [ ] Test response format conversion
- [ ] Test error handling
- [ ] Test cold start behavior
- [ ] Test environment configuration integration
- [ ] Test proper routing to core handler