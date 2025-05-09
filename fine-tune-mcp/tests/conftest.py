"""
Pytest fixtures for testing the fine-tune-mcp package.
"""

import os
import json
import tempfile
import pytest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch


@pytest.fixture
def mock_openai_client():
    """
    Fixture that provides a mocked OpenAI client for testing.
    """
    mock_client = MagicMock()
    
    # Mock methods needed for testing
    mock_client.format_training_data = MagicMock(return_value='{"formatted":"data"}')
    mock_client.validate_training_data = MagicMock(return_value={"valid": True})
    mock_client.save_training_data = MagicMock(return_value="/path/to/saved/data.jsonl")
    
    # Mock async methods
    mock_client.upload_file = AsyncMock(return_value={
        "id": "file-123456",
        "filename": "test.jsonl",
        "bytes": 1234,
        "created_at": 1620000000,
        "status": "uploaded"
    })
    mock_client.create_fine_tuning_job = AsyncMock(return_value={
        "id": "ft-12345",
        "status": "created",
        "model": "o4-mini-2025-04-16",
        "created_at": 1620000000
    })
    mock_client.get_fine_tuning_job = AsyncMock(return_value={
        "id": "ft-12345",
        "status": "running",
        "model": "o4-mini-2025-04-16",
        "created_at": 1620000000,
        "updated_at": 1620001000
    })
    mock_client.list_fine_tuning_jobs = AsyncMock(return_value=[
        {
            "id": "ft-12345",
            "status": "running",
            "model": "o4-mini-2025-04-16"
        },
        {
            "id": "ft-67890",
            "status": "completed",
            "model": "o4-mini-2025-04-16"
        }
    ])
    mock_client.list_models = AsyncMock(return_value=[
        {"id": "base-model", "owned_by": "openai"},
        {"id": "ft-model-123", "owned_by": "organization-owner"}
    ])
    mock_client.delete_model = AsyncMock(return_value={"id": "ft-model-123", "deleted": True})
    
    return mock_client


@pytest.fixture
def mock_context():
    """
    Fixture that provides a mocked Context object for testing tools.
    """
    context = MagicMock()
    
    # Mock common attributes and methods
    context.info = MagicMock()
    context.warning = MagicMock()
    context.error = MagicMock()
    context.progress = MagicMock()
    
    # Mock app context
    context.app = MagicMock()
    context.app.openai_client = AsyncMock()
    
    return context


@pytest.fixture
def sample_training_data():
    """
    Fixture that provides sample training data for testing.
    """
    return [
        {
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "What is the capital of France?"},
                {"role": "assistant", "content": "The capital of France is Paris."}
            ]
        },
        {
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "How do I bake a chocolate cake?"},
                {"role": "assistant", "content": "Here's a simple recipe for a chocolate cake..."}
            ]
        },
        {
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "What is 2+2?"},
                {"role": "assistant", "content": "2+2 equals 4."}
            ]
        }
    ]


@pytest.fixture
def sample_jsonl_file(sample_training_data, tmp_path):
    """
    Fixture that creates a sample JSONL file for testing.
    """
    file_path = tmp_path / "test_data.jsonl"
    
    with open(file_path, 'w') as f:
        for item in sample_training_data:
            f.write(json.dumps(item) + '\n')
    
    return str(file_path)


@pytest.fixture
def empty_file(tmp_path):
    """
    Fixture that creates an empty file for testing.
    """
    file_path = tmp_path / "empty.jsonl"
    file_path.touch()
    return str(file_path)


@pytest.fixture
def invalid_json_file(tmp_path):
    """
    Fixture that creates a file with invalid JSON for testing.
    """
    file_path = tmp_path / "invalid.jsonl"
    with open(file_path, 'w') as f:
        f.write("This is not valid JSON\n")
        f.write("{partial: json}\n")
    return str(file_path)