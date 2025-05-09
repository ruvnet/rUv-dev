# Testing Documentation for fine-tune-mcp

This document provides comprehensive information about the testing framework and practices used in the fine-tune-mcp project.

## 1. Overview of the Testing Framework

The fine-tune-mcp project uses a structured testing framework based on pytest to ensure code reliability and functionality. The testing approach follows modern Python testing practices with a clear separation between unit tests and integration tests.

### Technologies Used

- **pytest**: Primary testing framework
- **pytest-asyncio**: Extension for testing asynchronous code
- **pytest-mock**: For creating mock objects and patching functionality
- **unittest.mock**: Python's built-in mocking library
- **pytest-cov**: For generating test coverage reports

### Test Directory Structure

```
fine-tune-mcp/
└── tests/
    ├── __init__.py
    ├── conftest.py         # Shared fixtures and test setup
    ├── unit/               # Unit tests for individual components
    │   ├── __init__.py
    │   ├── test_openai_integration.py
    │   └── test_fine_tuning_tools.py
    └── integration/        # Integration tests for workflows
        ├── __init__.py
        └── test_fine_tuning_workflow.py
```

## 2. Test Categories

### Unit Tests

Unit tests focus on testing individual components in isolation to ensure each part of the system works correctly on its own. These tests mock external dependencies to create a controlled testing environment.

**Location:** `tests/unit/`

**Key files:**
- `test_openai_integration.py`: Tests for the OpenAI client integration
- `test_fine_tuning_tools.py`: Tests for individual MCP tools

Unit tests verify:
- Function input validation
- Response formatting
- Error handling
- Parameter validation
- Individual tool functionality

### Integration Tests

Integration tests verify that different components work together correctly through complete workflows. These tests ensure proper interaction between components while still mocking external API calls.

**Location:** `tests/integration/`

**Key files:**
- `test_fine_tuning_workflow.py`: Tests for the complete fine-tuning workflow

Integration tests verify:
- End-to-end workflows
- Component interactions
- State management between steps
- Error handling across components
- Data flow throughout the system

## 3. Running the Tests

The project uses `make` commands to simplify test execution.

### Basic Test Execution

To run all tests:

```bash
make test
```

To run tests with verbose output:

```bash
make test-verbose
```

### Test Coverage

To run tests with coverage reporting:

```bash
make test-coverage
```

This generates both terminal output and HTML reports in the `htmlcov/` directory.

### Running Specific Tests

To run specific test modules:

```bash
pytest tests/unit/test_fine_tuning_tools.py
```

To run specific test classes:

```bash
pytest tests/unit/test_fine_tuning_tools.py::TestPrepareTrainingData
```

To run specific test methods:

```bash
pytest tests/unit/test_fine_tuning_tools.py::TestPrepareTrainingData::test_prepare_training_data_chat_format
```

### Test Markers

You can use markers to group and select tests:

```bash
pytest -m asyncio
```

The project defines the following markers in `pytest.ini`:
- `asyncio`: Marks asynchronous tests

## 4. Test Fixtures

Test fixtures provide reusable test data and mocked components. All shared fixtures are defined in `tests/conftest.py`.

### Available Fixtures

#### `mock_openai_client`

Provides a pre-configured mock of the OpenAI client with methods stubbed out to return expected values.

```python
def test_example(mock_openai_client):
    # The mock_openai_client is already set up with expected return values
    result = await some_function_that_uses_client(mock_openai_client)
    assert result["status"] == "success"
```

#### `mock_context`

Mocks the MCP Context object that's passed to tool functions, including logging methods.

```python
def test_with_context(mock_context):
    await my_tool_function(param1="value", ctx=mock_context)
    mock_context.info.assert_called_once()  # Verify logging was called
```

#### `sample_training_data`

Provides sample chat completion data for testing:

```python
def test_data_processing(sample_training_data):
    result = process_training_data(sample_training_data)
    assert len(result) == len(sample_training_data)
```

#### File-based Fixtures

- `sample_jsonl_file`: Creates a temporary JSONL file with valid sample data
- `empty_file`: Creates an empty temporary file
- `invalid_json_file`: Creates a file with invalid JSON content

Example:

```python
def test_file_reading(sample_jsonl_file):
    data = read_jsonl_file(sample_jsonl_file)
    assert len(data) == 3  # The fixture contains 3 examples
```

## 5. Mocking Strategy

External services and dependencies are mocked to create isolated and reliable tests.

### OpenAI API Mocking

The OpenAI API is completely mocked to avoid making actual API calls during testing:

```python
# Example of patching the OpenAI client
with patch('fine_tune_mcp.tools.fine_tuning_tools.OpenAIClient') as MockClient:
    mock_client = MockClient.return_value
    mock_client.create_fine_tuning_job = AsyncMock(return_value={
        "id": "ft-12345",
        "status": "created"
    })
    
    result = await start_fine_tuning_job(
        training_file_id="file-123",
        model="o4-mini-2025-04-16",
        ctx=mock_context
    )
```

### Mocking MCP Context

The MCP Context is mocked to test proper logging and context usage:

```python
# The mock_context fixture provides these mocks
mock_context.info.assert_called_with("Processing started")
mock_context.error.assert_not_called()
```

### File System Mocking

File operations are mocked or use temporary files to avoid modifying the actual file system:

```python
# Using pytest's tmp_path fixture with our custom fixtures
def test_file_writing(tmp_path):
    output_file = tmp_path / "output.jsonl"
    write_result = write_to_file(data, str(output_file))
    assert output_file.exists()
```

### Adding New Mocks

When adding new functionality that relies on external services:

1. Add appropriate mock methods to `mock_openai_client` or create a new fixture in `conftest.py`
2. Use `unittest.mock.patch` to replace dependencies with mocks
3. Configure mocks to return appropriate test data
4. For async functions, use `AsyncMock` instead of `MagicMock`

## 6. Adding New Tests

### Adding Unit Tests

1. Identify the component to test
2. Create or use an existing test file in `tests/unit/`
3. Create a test class for the component (or add to an existing class)
4. Add test methods that focus on individual functionality
5. Use appropriate fixtures and mocks
6. Verify both success cases and error handling

Example:

```python
class TestNewComponent:
    @pytest.mark.asyncio
    async def test_component_success_case(self, mock_context):
        # Test setup
        with patch('some.dependency', return_value=mock_value):
            # Execute function
            result = await component_function(params, ctx=mock_context)
            # Assertions
            assert result["status"] == "success"
            assert "data" in result
    
    @pytest.mark.asyncio
    async def test_component_error_case(self, mock_context):
        # Test error handling
        result = await component_function(invalid_params, ctx=mock_context)
        assert "error" in result
        mock_context.error.assert_called_once()
```

### Adding Integration Tests

1. Identify the workflow to test
2. Create or use an existing test file in `tests/integration/`
3. Create a test class for the workflow
4. Design tests that follow the complete workflow
5. Mock external dependencies but allow internal interactions
6. Verify the entire process works as expected

Example:

```python
class TestNewWorkflow:
    @pytest.mark.asyncio
    async def test_complete_workflow(self, mock_context, sample_data, tmp_path):
        # Step 1: Setup and first component test
        with patch('external.dependency') as mock_dep:
            mock_dep.return_value = expected_value
            result1 = await first_step(data, ctx=mock_context)
            assert result1["status"] == "success"
        
        # Step 2: Second component using result from first
        result2 = await second_step(result1["id"], ctx=mock_context)
        assert result2["status"] == "complete"
        
        # Verify the workflow completed correctly
        assert some_condition_is_met
```

### Best Practices

1. **Isolation**: Each test should be independent and not rely on the state from other tests
2. **Coverage**: Aim to test both the "happy path" and error conditions
3. **Readability**: Use clear test names that describe what's being tested
4. **Documentation**: Add docstrings to test classes and methods
5. **Fixtures**: Create fixtures for commonly used test data or setup
6. **Assertions**: Make specific assertions about expected outcomes

## 7. Troubleshooting Common Issues

### Tests Hanging

If tests are hanging, it's often due to unresolved async operations:

- Ensure all `AsyncMock` calls have appropriate return values
- Check for uncaught exceptions in async code
- Verify that all async functions are properly awaited

### Mock Not Being Called

If your mock isn't being called as expected:

- Verify the import path in the `patch` call matches the actual import in the code
- Check that the patched object is accessed in the code under test
- Ensure the patch is applied at the correct scope

### Fixture Not Found

If pytest can't find a fixture:

- Check the fixture name for typos
- Verify that `conftest.py` is in the correct location
- Make sure the test is in a file with a `test_` prefix

### Coverage Issues

If coverage reports show missing coverage:

- Ensure all code paths are tested, including error handling
- Check for conditional code that might not be executed in tests
- Add specific tests for edge cases

### Test Environment Issues

When tests pass locally but fail in CI:

- Check for environment-specific assumptions (paths, environment variables)
- Verify that all dependencies are properly installed
- Look for race conditions or timing issues in async tests

## Conclusion

The testing framework in fine-tune-mcp provides robust verification of functionality and helps maintain code quality as the project evolves. By following the guidelines in this document, you can create effective tests that ensure the reliability of the MCP server and its tools.