"""
Unit tests for the OpenAI integration module.
"""

import os
import json
import pytest
from unittest.mock import AsyncMock, Mock, patch, MagicMock
from pathlib import Path

import httpx
from fine_tune_mcp.openai_integration import OpenAIClient


class TestOpenAIClient:
    """Tests for the OpenAIClient class."""
    
    # --- Client Initialization Tests ---
    
    def test_init_with_api_key(self):
        """Test initializing the client with an API key."""
        client = OpenAIClient(api_key="test-key")
        assert client.api_key == "test-key"
        assert client.headers["Authorization"] == "Bearer test-key"
        assert client.headers["Content-Type"] == "application/json"
    
    @patch.dict(os.environ, {"OPENAI_API_KEY": "env-test-key"})
    def test_init_with_env_api_key(self):
        """Test initializing the client with an API key from the environment."""
        client = OpenAIClient()
        assert client.api_key == "env-test-key"
        assert client.headers["Authorization"] == "Bearer env-test-key"
    
    def test_init_without_api_key(self):
        """Test that initializing without an API key raises an error."""
        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(ValueError) as excinfo:
                OpenAIClient()
            assert "OpenAI API key is required but not provided" in str(excinfo.value)
    
    # --- API Request Function Tests ---
    
    @pytest.mark.asyncio
    async def test_request_success(self):
        """Test a successful request to the OpenAI API."""
        with patch("httpx.AsyncClient") as mock_client:
            # Setup mock response
            mock_response = MagicMock()
            mock_response.json.return_value = {"data": [{"id": "test-id"}]}
            mock_response.raise_for_status = AsyncMock()
            
            # Setup mock client
            mock_client_instance = MagicMock()
            mock_client_instance.request = AsyncMock(return_value=mock_response)
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            # Make the request
            client = OpenAIClient(api_key="test-key")
            result = await client._request("GET", "endpoint")
            
            # Verify
            assert result == {"data": [{"id": "test-id"}]}
            mock_client_instance.request.assert_called_once_with(
                method="GET",
                url="https://api.openai.com/v1/endpoint",
                json=None,
                params=None,
                headers=client.headers
            )
    
    @pytest.mark.asyncio
    async def test_request_with_params_and_data(self):
        """Test a request with query parameters and request body."""
        with patch("httpx.AsyncClient") as mock_client:
            # Setup mock response
            mock_response = MagicMock()
            mock_response.json.return_value = {"result": "success"}
            mock_response.raise_for_status = AsyncMock()
            
            # Setup mock client
            mock_client_instance = MagicMock()
            mock_client_instance.request = AsyncMock(return_value=mock_response)
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            # Test data and params
            data = {"input": "test"}
            params = {"limit": 10}
            
            # Make the request
            client = OpenAIClient(api_key="test-key")
            result = await client._request("POST", "endpoint", data=data, params=params)
            
            # Verify
            assert result == {"result": "success"}
            mock_client_instance.request.assert_called_once_with(
                method="POST",
                url="https://api.openai.com/v1/endpoint",
                json=data,
                params=params,
                headers=client.headers
            )
    
    @pytest.mark.asyncio
    async def test_request_http_error(self):
        """Test handling an HTTP error from the OpenAI API."""
        with patch("httpx.AsyncClient") as mock_client:
            # Setup mock response and error
            mock_response = MagicMock()
            mock_response.json.return_value = {"error": {"message": "API error"}}
            mock_response.content = b'{"error": {"message": "API error"}}'
            
            http_error = httpx.HTTPStatusError(
                "API error",
                request=MagicMock(),
                response=mock_response
            )
            
            # Setup mock client
            mock_client_instance = MagicMock()
            mock_client_instance.request = AsyncMock(side_effect=http_error)
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            # Test the request
            client = OpenAIClient(api_key="test-key")
            with pytest.raises(httpx.HTTPStatusError):
                await client._request("GET", "endpoint")
    
    @pytest.mark.asyncio
    async def test_request_with_other_exceptions(self):
        """Test handling various exceptions during API requests."""
        with patch("httpx.AsyncClient") as mock_client:
            # Setup mock client to raise an exception
            mock_client_instance = MagicMock()
            mock_client_instance.request = AsyncMock(side_effect=Exception("General error"))
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            # Test the request
            client = OpenAIClient(api_key="test-key")
            with pytest.raises(Exception) as excinfo:
                await client._request("GET", "endpoint")
            assert "General error" in str(excinfo.value)
    
    @pytest.mark.asyncio
    @pytest.mark.asyncio
    async def test_request_streaming_response(self):
        """Test handling a streaming response from the API."""
        with patch("httpx.AsyncClient") as mock_client:
            # Setup mock response for streaming
            mock_response = MagicMock()
            
            # Create an async generator for mock response
            async def mock_aiter_lines():
                yield 'data: {"chunk": 1}'
                yield 'data: {"chunk": 2}'
                yield 'data: [DONE]'
            
            mock_response.aiter_lines = mock_aiter_lines
            mock_response.raise_for_status = AsyncMock()
            
            # Setup mock client
            mock_client_instance = MagicMock()
            mock_client_instance.request = AsyncMock(return_value=mock_response)
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            # Make the streaming request
            client = OpenAIClient(api_key="test-key")
            stream_gen = await client._request("GET", "endpoint", stream=True)
            
            # Collect streamed results
            results = []
            async for chunk in stream_gen:
                results.append(chunk)
            
            # Verify
            assert len(results) == 2
            assert results[0] == {"chunk": 1}
            assert results[1] == {"chunk": 2}
            
            # Verify the request was made with stream=True
            mock_client_instance.request.assert_called_once_with(
                method="GET",
                url="https://api.openai.com/v1/endpoint",
                json=None,
                params=None,
                headers=client.headers,
                stream=True
            )
    # --- File Operations Tests ---
    
    @pytest.mark.asyncio
    async def test_list_files(self):
        """Test listing files from the OpenAI API."""
        with patch.object(OpenAIClient, "_request") as mock_request:
            # Setup mock response
            mock_request.return_value = {
                "data": [
                    {"id": "file-1", "filename": "train.jsonl"},
                    {"id": "file-2", "filename": "valid.jsonl"}
                ]
            }
            
            # List files
            client = OpenAIClient(api_key="test-key")
            result = await client.list_files()
            
            # Verify
            assert len(result) == 2
            assert result[0]["id"] == "file-1"
            assert result[1]["filename"] == "valid.jsonl"
            mock_request.assert_called_once_with(
                method="GET",
                endpoint="files"
            )
    
    @pytest.mark.asyncio
    async def test_get_file(self):
        """Test getting a specific file's information."""
        with patch.object(OpenAIClient, "_request") as mock_request:
            # Setup mock response
            mock_request.return_value = {
                "id": "file-123",
                "filename": "test.jsonl",
                "bytes": 1234,
                "created_at": 1620000000,
                "status": "processed"
            }
            
            # Get file
            client = OpenAIClient(api_key="test-key")
            result = await client.get_file("file-123")
            
            # Verify
            assert result["id"] == "file-123"
            assert result["status"] == "processed"
            mock_request.assert_called_once_with(
                method="GET",
                endpoint="files/file-123"
            )
    
    @pytest.mark.asyncio
    async def test_delete_file(self):
        """Test deleting a file."""
        with patch.object(OpenAIClient, "_request") as mock_request:
            # Setup mock response
            mock_request.return_value = {
                "id": "file-123",
                "deleted": True
            }
            
            # Delete file
            client = OpenAIClient(api_key="test-key")
            result = await client.delete_file("file-123")
            
            # Verify
            assert result["id"] == "file-123"
            assert result["deleted"] is True
            mock_request.assert_called_once_with(
                method="DELETE",
                endpoint="files/file-123"
            )
    
    @pytest.mark.asyncio
    async def test_upload_file(self, tmp_path):
        """Test uploading a file to the OpenAI API."""
        # Create a test file
        file_path = tmp_path / "test.jsonl"
        file_path.write_text('{"test": "data"}')
        
        # Mock the HTTP client
        with patch("httpx.AsyncClient") as mock_client:
            # Setup mock response
            mock_response = MagicMock()
            mock_response.json.return_value = {
                "id": "file-123",
                "filename": "test.jsonl",
                "status": "uploaded"
            }
            mock_response.raise_for_status = AsyncMock()
            
            # Setup mock client
            mock_client_instance = MagicMock()
            mock_client_instance.post = AsyncMock(return_value=mock_response)
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            # Upload the file
            client = OpenAIClient(api_key="test-key")
            result = await client.upload_file(str(file_path), "fine-tune")
            
            # Verify
            assert result["id"] == "file-123"
            assert result["filename"] == "test.jsonl"
            mock_client_instance.post.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_upload_file_not_found(self):
        """Test error handling when the file to upload doesn't exist."""
        client = OpenAIClient(api_key="test-key")
        with pytest.raises(FileNotFoundError):
            await client.upload_file("/nonexistent/path.jsonl", "fine-tune")
    
    # --- Fine-tuning Operation Tests ---
    
    @pytest.mark.asyncio
    async def test_create_fine_tuning_job(self):
        """Test creating a fine-tuning job."""
        with patch.object(OpenAIClient, "_request") as mock_request:
            # Setup mock response
            mock_request.return_value = {
                "id": "ft-12345",
                "status": "created",
                "model": "o4-mini-2025-04-16",
                "created_at": 1620000000
            }
            
            # Create fine-tuning job
            client = OpenAIClient(api_key="test-key")
            result = await client.create_fine_tuning_job(
                training_file_id="file-123",
                model="o4-mini-2025-04-16",
                validation_file_id="file-456",
                hyperparameters={"n_epochs": 3},
                suffix="my-model"
            )
            
            # Verify
            assert result["id"] == "ft-12345"
            assert result["status"] == "created"
            mock_request.assert_called_once_with(
                method="POST",
                endpoint="fine_tuning/jobs",
                data={
                    "training_file": "file-123",
                    "model": "o4-mini-2025-04-16",
                    "validation_file": "file-456",
                    "hyperparameters": {"n_epochs": 3},
                    "suffix": "my-model"
                }
            )
    
    @pytest.mark.asyncio
    async def test_create_fine_tuning_job_minimal(self):
        """Test creating a fine-tuning job with minimal parameters."""
        with patch.object(OpenAIClient, "_request") as mock_request:
            # Setup mock response
            mock_request.return_value = {
                "id": "ft-12345",
                "status": "created",
                "model": "o4-mini-2025-04-16",
                "created_at": 1620000000
            }
            
            # Create fine-tuning job with only required parameters
            client = OpenAIClient(api_key="test-key")
            result = await client.create_fine_tuning_job(
                training_file_id="file-123"
            )
            
            # Verify
            assert result["id"] == "ft-12345"
            mock_request.assert_called_once_with(
                method="POST",
                endpoint="fine_tuning/jobs",
                data={
                    "training_file": "file-123",
                    "model": "gpt-3.5-turbo"  # Default model
                }
            )
    
    @pytest.mark.asyncio
    async def test_list_fine_tuning_jobs(self):
        """Test listing fine-tuning jobs."""
        with patch.object(OpenAIClient, "_request") as mock_request:
            # Setup mock response
            mock_request.return_value = {
                "data": [
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
                ]
            }
            
            # List fine-tuning jobs
            client = OpenAIClient(api_key="test-key")
            result = await client.list_fine_tuning_jobs(limit=2, after="ft-00000")
            
            # Verify
            assert len(result) == 2
            assert result[0]["id"] == "ft-12345"
            assert result[1]["status"] == "completed"
            mock_request.assert_called_once_with(
                method="GET",
                endpoint="fine_tuning/jobs",
                params={"limit": 2, "after": "ft-00000"}
            )
    
    @pytest.mark.asyncio
    async def test_get_fine_tuning_job(self):
        """Test getting a specific fine-tuning job's information."""
        with patch.object(OpenAIClient, "_request") as mock_request:
            # Setup mock response
            mock_request.return_value = {
                "id": "ft-12345",
                "status": "running",
                "model": "o4-mini-2025-04-16",
                "created_at": 1620000000,
                "updated_at": 1620001000
            }
            
            # Get fine-tuning job
            client = OpenAIClient(api_key="test-key")
            result = await client.get_fine_tuning_job("ft-12345")
            
            # Verify
            assert result["id"] == "ft-12345"
            assert result["status"] == "running"
            mock_request.assert_called_once_with(
                method="GET",
                endpoint="fine_tuning/jobs/ft-12345"
            )
    
    @pytest.mark.asyncio
    async def test_cancel_fine_tuning_job(self):
        """Test cancelling a fine-tuning job."""
        with patch.object(OpenAIClient, "_request") as mock_request:
            # Setup mock response
            mock_request.return_value = {
                "id": "ft-12345",
                "status": "cancelled",
                "model": "o4-mini-2025-04-16"
            }
            
            # Cancel fine-tuning job
            client = OpenAIClient(api_key="test-key")
            result = await client.cancel_fine_tuning_job("ft-12345")
            
            # Verify
            assert result["id"] == "ft-12345"
            assert result["status"] == "cancelled"
            mock_request.assert_called_once_with(
                method="POST",
                endpoint="fine_tuning/jobs/ft-12345/cancel"
            )
    
    @pytest.mark.asyncio
    async def test_list_fine_tuning_events(self):
        """Test listing events from a fine-tuning job."""
        with patch.object(OpenAIClient, "_request") as mock_request:
            # Setup mock response
            mock_request.return_value = {
                "data": [
                    {"object": "fine_tuning.job.event", "message": "Job started"},
                    {"object": "fine_tuning.job.event", "message": "Epoch 1/3"}
                ]
            }
            
            # List fine-tuning events
            client = OpenAIClient(api_key="test-key")
            result = await client.list_fine_tuning_events("ft-12345", limit=10)
            
            # Verify
            assert len(result) == 2
            assert result[0]["message"] == "Job started"
            assert result[1]["message"] == "Epoch 1/3"
            mock_request.assert_called_once_with(
                method="GET",
                endpoint="fine_tuning/jobs/ft-12345/events",
                params={"limit": 10}
            )
    
    @pytest.mark.asyncio
    async def test_list_fine_tuning_events_streaming(self):
        """Test streaming events from a fine-tuning job."""
        with patch.object(OpenAIClient, "_request") as mock_request:
            # Setup mock streaming response
            mock_generator = AsyncMock()
            mock_request.return_value = mock_generator
            
            # List fine-tuning events with streaming
            client = OpenAIClient(api_key="test-key")
            result = await client.list_fine_tuning_events("ft-12345", limit=10, stream=True)
            
            # Verify
            assert result == mock_generator
            mock_request.assert_called_once_with(
                method="GET",
                endpoint="fine_tuning/jobs/ft-12345/events",
                params={"limit": 10},
                stream=True
            )
    
    @pytest.mark.asyncio
    async def test_list_models(self):
        """Test listing available models."""
        with patch.object(OpenAIClient, "_request") as mock_request:
            # Setup mock response
            mock_request.return_value = {
                "data": [
                    {"id": "o4-mini-2025-04-16", "owned_by": "openai"},
                    {"id": "ft-model-123", "owned_by": "organization-owner"}
                ]
            }
            
            # List models
            client = OpenAIClient(api_key="test-key")
            result = await client.list_models()
            
            # Verify
            assert len(result) == 2
            assert result[0]["id"] == "o4-mini-2025-04-16"
            assert result[1]["owned_by"] == "organization-owner"
            mock_request.assert_called_once_with(
                method="GET",
                endpoint="models"
            )
    
    @pytest.mark.asyncio
    async def test_get_model(self):
        """Test getting information about a specific model."""
        with patch.object(OpenAIClient, "_request") as mock_request:
            # Setup mock response
            mock_request.return_value = {
                "id": "ft-model-123",
                "owned_by": "organization-owner",
                "created_at": 1620000000
            }
            
            # Get model
            client = OpenAIClient(api_key="test-key")
            result = await client.get_model("ft-model-123")
            
            # Verify
            assert result["id"] == "ft-model-123"
            mock_request.assert_called_once_with(
                method="GET",
                endpoint="models/ft-model-123"
            )
    
    @pytest.mark.asyncio
    async def test_delete_model(self):
        """Test deleting a fine-tuned model."""
        with patch.object(OpenAIClient, "_request") as mock_request:
            # Setup mock response
            mock_request.return_value = {
                "id": "ft-model-123",
                "deleted": True
            }
            
            # Delete model
            client = OpenAIClient(api_key="test-key")
            result = await client.delete_model("ft-model-123")
            
            # Verify
            assert result["id"] == "ft-model-123"
            assert result["deleted"] is True
            mock_request.assert_called_once_with(
                method="DELETE",
                endpoint="models/ft-model-123"
            )
    
    # --- Data Preparation Tests ---
    
    @pytest.mark.asyncio
    async def test_format_and_validate_training_data_chat(self):
        """Test formatting and validating chat training data."""
        client = OpenAIClient(api_key="test-key")
        
        # Test data
        data = [
            {
                "messages": [
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": "Hello"},
                    {"role": "assistant", "content": "Hi there!"}
                ]
            }
        ]
        
        # Test formatting
        formatted = client.format_training_data(data, "chat")
        assert formatted
        assert len(formatted.split("\n")) == 1
        
        # Verify the formatted content
        parsed = json.loads(formatted)
        assert "messages" in parsed
        assert len(parsed["messages"]) == 3
    
    @pytest.mark.asyncio
    async def test_format_and_validate_training_data_completion(self):
        """Test formatting and validating completion training data."""
        client = OpenAIClient(api_key="test-key")
        
        # Test data
        data = [
            {
                "prompt": "Hello",
                "completion": "Hi there!"
            }
        ]
        
        # Test formatting
        formatted = client.format_training_data(data, "completion")
        assert formatted
        assert len(formatted.split("\n")) == 1
        
        # Verify the formatted content
        parsed = json.loads(formatted)
        assert "prompt" in parsed
        assert "completion" in parsed
    
    def test_format_training_data_invalid_chat_format(self):
        """Test that invalid chat format raises an error."""
        client = OpenAIClient(api_key="test-key")
        
        # Invalid data - missing 'messages' field
        invalid_data = [{"text": "This is not valid chat format"}]
        
        with pytest.raises(ValueError) as excinfo:
            client.format_training_data(invalid_data, "chat")
        assert "Chat format requires 'messages' in each example" in str(excinfo.value)
    
    def test_format_training_data_invalid_completion_format(self):
        """Test that invalid completion format raises an error."""
        client = OpenAIClient(api_key="test-key")
        
        # Invalid data - missing 'completion' field
        invalid_data = [{"prompt": "Hello"}]
        
        with pytest.raises(ValueError) as excinfo:
            client.format_training_data(invalid_data, "completion")
        assert "Completion format requires 'prompt' and 'completion'" in str(excinfo.value)
    
    @pytest.mark.asyncio
    async def test_format_invalid_format_type(self):
        """Test that an invalid format type raises an error."""
        client = OpenAIClient(api_key="test-key")
        with pytest.raises(ValueError) as excinfo:
            client.format_training_data([], "invalid_format")
        assert "Unsupported format type: invalid_format" in str(excinfo.value)
    
    def test_save_training_data(self, tmp_path):
        """Test saving formatted training data to a file."""
        client = OpenAIClient(api_key="test-key")
        
        # Create test data
        data = '{"messages": [{"role": "user", "content": "Hello"}]}'
        
        # Save to file
        file_path = str(tmp_path / "test_output.jsonl")
        result = client.save_training_data(data, file_path)
        
        # Verify
        assert result == file_path
        assert Path(file_path).exists()
        with open(file_path, "r") as f:
            assert f.read() == data
    
    def test_validate_training_data_valid_chat(self, sample_jsonl_file):
        """Test validating valid chat training data."""
        client = OpenAIClient(api_key="test-key")
        
        # Validate the file
        result = client.validate_training_data(sample_jsonl_file, "chat")
        
        # Verify
        assert result["valid"] is True
        assert result["file_path"] == sample_jsonl_file
        assert result["line_count"] == 3  # Three examples in the sample data
        assert result["format_errors"] == 0
        assert not result.get("issues")
    
    def test_validate_training_data_empty_file(self, empty_file):
        """Test validating an empty file."""
        client = OpenAIClient(api_key="test-key")
        
        # Validate the file
        result = client.validate_training_data(empty_file, "chat")
        
        # Verify - an empty file is technically valid, just has 0 lines
        assert result["valid"] is True
        assert result["file_path"] == empty_file
        assert result["line_count"] == 0
        assert result["format_errors"] == 0
    
    def test_validate_training_data_invalid_json(self, invalid_json_file):
        """Test validating a file with invalid JSON."""
        client = OpenAIClient(api_key="test-key")
        
        # Validate the file
        result = client.validate_training_data(invalid_json_file, "chat")
        
        # Verify
        assert result["valid"] is False
        assert result["file_path"] == invalid_json_file
        assert result["format_errors"] > 0
        assert len(result["issues"]) > 0
        assert "Invalid JSON" in result["issues"][0]
    
    def test_validate_training_data_nonexistent_file(self):
        """Test validating a non-existent file."""
        client = OpenAIClient(api_key="test-key")
        
        # Validate a non-existent file
        result = client.validate_training_data("/nonexistent/path.jsonl", "chat")
        
        # Verify
        assert result["valid"] is False
        assert "File not found" in result["error"]