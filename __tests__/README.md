# create-sparc Test Suite

This directory contains the test suite for the create-sparc NPX package. The tests are organized into unit tests and integration tests.

## Test Structure

- `__tests__/unit/`: Unit tests for individual components
- `__tests__/integration/`: Integration tests for the entire package
- `__tests__/utils/`: Test utilities and helpers
- `__tests__/setup.js`: Common setup for all tests

## Running Tests

You can run the tests using the following npm scripts:

```bash
# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests in watch mode (useful during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

The test suite covers:

1. **File Manager**: Tests for file operations like creating directories, writing files, and copying files.
2. **Project Generator**: Tests for generating new SPARC projects with different configurations.
3. **Symlink Manager**: Tests for creating symlinks and handling platform-specific symlink behavior.
4. **CLI Commands**: Tests for the command-line interface and command handling.
5. **Integration**: End-to-end tests for the entire package workflow.

## Cross-Platform Testing

The tests are designed to run on multiple platforms (Windows, macOS, Linux) and handle platform-specific behaviors, especially for symlinks which work differently across operating systems.

## Mocking

The tests use Jest's mocking capabilities to:

- Mock file system operations for faster and more reliable tests
- Mock command execution to avoid actual system changes
- Mock user input and console output

## Test Environment

Tests run in a temporary directory that is cleaned up after each test run to ensure isolation between test runs.

## Adding New Tests

When adding new features to create-sparc, please add corresponding tests:

1. Unit tests for new components or functions
2. Integration tests for new workflows
3. Update existing tests if you modify existing functionality

## Debugging Tests

To run tests in debug mode with more verbose output:

```bash
DEBUG=true npm test
```

This will show more detailed logs and error stacks during test execution.