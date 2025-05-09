"""
Unit tests for the fine-tuning tools module.
"""

import os
import json
import pytest
from unittest.mock import AsyncMock, Mock, patch, MagicMock
from pathlib import Path

from fine_tune_mcp.tools.fine_tuning_tools import (
    prepare_training_data,
    upload_training_file,
    start_fine_tuning_job,
    get_fine_tuning_job_status,
    list_fine_tuning_jobs,
    cancel_fine_tuning_job,
    list_fine_tuned_models,
    delete_fine_tuned_model,
    validate_model,
    validate_hyperparameters,
    validate_file_path,
    SUPPORTED_BASE_MODELS,
    SUPPORTED_HYPERPARAMETERS
)


class TestValidationFunctions:
    """Tests for the validation utility functions."""
    
    def test_validate_model(self):
        """Test validating model names."""
        # Test valid model
        assert validate_model("o4-mini-2025-04-16") is True
        
        # Test invalid model
        assert validate_model("invalid-model") is False
    
    def test_validate_hyperparameters(self):
        """Test validating hyperparameters."""
        # Test valid hyperparameters
        valid_params = {
            "n_epochs": 10,
            "batch_size": 64,
            "learning_rate_multiplier": 0.5
        }
        assert validate_hyperparameters(valid_params) == {}
        
        # Test invalid hyperparameter values
        invalid_values = {
            "n_epochs": 100,  # Too high
            "batch_size": 0,   # Too low
            "learning_rate_multiplier": 5.0  # Too high
        }
        errors = validate_hyperparameters(invalid_values)
        assert len(errors) == 3
        
        # Test unsupported hyperparameters
        unsupported = {
            "n_epochs": 10,
            "invalid_param": "value"
        }
        errors = validate_hyperparameters(unsupported)
        assert "unsupported_params" in errors
    
    def test_validate_file_path(self, tmp_path):
        """Test validating file paths."""
        # Test with non-existent file
        non_existent = tmp_path / "non_existent.txt"
        errors = validate_file_path(str(non_existent))
        assert "not_found" in errors
        
        # Test with existing file
        existing = tmp_path / "existing.txt"
        existing.write_text("test content")
        errors = validate_file_path(str(existing))
        assert errors == {}
        
        # Test with directory instead of file
        dir_path = tmp_path / "test_dir"
        dir_path.mkdir()
        errors = validate_file_path(str(dir_path))
        assert "not_file" in errors


class TestPrepareTrainingData:
    """Tests for the prepare_training_data tool."""
    
    @pytest.mark.asyncio
    async def test_prepare_training_data_completion_format(self, mock_context):
        """Test preparing training data with completion format."""
        completion_data = [
            {"prompt": "What is the capital of France?", "completion": "Paris"},
            {"prompt": "What is 2+2?", "completion": "4"}
        ]
        
        with patch('fine_tune_mcp.tools.fine_tuning_tools.OpenAIClient') as MockClient:
            # Setup mock client
            mock_client_instance = MockClient.return_value
            mock_client_instance.format_training_data.return_value = "formatted completion data"
            
            # Call the function
            result = await prepare_training_data(
                examples=completion_data,
                format_type="completion",
                ctx=mock_context
            )
            
            # Verify
            assert "formatted_data" in result
            assert result["formatted_data"] == "formatted completion data"
            assert result["example_count"] == len(completion_data)
            mock_client_instance.format_training_data.assert_called_once_with(
                completion_data, "completion"
            )
    
    @pytest.mark.asyncio
    async def test_prepare_training_data_chat_format(self, mock_context, sample_training_data):
        """Test preparing chat format training data."""
        with patch('fine_tune_mcp.tools.fine_tuning_tools.OpenAIClient') as MockClient:
            # Setup mock client
            mock_client_instance = MockClient.return_value
            mock_client_instance.format_training_data.return_value = "formatted data"
            mock_client_instance.validate_training_data.return_value = {"valid": True}
            
            # Call the function
            result = await prepare_training_data(
                examples=sample_training_data,
                format_type="chat",
                ctx=mock_context
            )
            
            # Verify
            assert "formatted_data" in result
            assert result["formatted_data"] == "formatted data"
            assert result["example_count"] == len(sample_training_data)
            mock_client_instance.format_training_data.assert_called_once_with(
                sample_training_data, "chat"
            )
    
    @pytest.mark.asyncio
    async def test_prepare_training_data_with_output_file(self, mock_context, sample_training_data, tmp_path):
        """Test preparing training data and saving to a file."""
        output_file = str(tmp_path / "output.jsonl")
        
        with patch('fine_tune_mcp.tools.fine_tuning_tools.OpenAIClient') as MockClient:
            # Setup mock client
            mock_client_instance = MockClient.return_value
            mock_client_instance.format_training_data.return_value = "formatted data"
            mock_client_instance.save_training_data.return_value = output_file
            mock_client_instance.validate_training_data.return_value = {
                "valid": True,
                "line_count": 3
            }
            
            # Call the function
            result = await prepare_training_data(
                examples=sample_training_data,
                format_type="chat",
                output_file=output_file,
                ctx=mock_context
            )
            
            # Verify
            assert "file_path" in result
            assert result["file_path"] == output_file
            assert "validation" in result
            assert result["validation"]["valid"] is True
            mock_client_instance.save_training_data.assert_called_once_with(
                "formatted data", output_file
            )
    
    @pytest.mark.asyncio
    async def test_prepare_training_data_invalid_format(self, mock_context, sample_training_data):
        """Test preparing training data with invalid format type."""
        result = await prepare_training_data(
            examples=sample_training_data,
            format_type="invalid",
            ctx=mock_context
        )
        
        assert "error" in result
        assert "Invalid format_type" in result["error"]
        mock_context.error.assert_called_once()


class TestUploadTrainingFile:
    """Tests for the upload_training_file tool."""
    
    @pytest.mark.asyncio
    async def test_upload_training_file_success(self, mock_context, sample_jsonl_file):
        """Test successfully uploading a training file."""
        with patch('fine_tune_mcp.tools.fine_tuning_tools.OpenAIClient') as MockClient:
            # Setup mock client
            mock_client_instance = MockClient.return_value
            mock_client_instance.validate_training_data.return_value = {"valid": True}
            mock_client_instance.upload_file = AsyncMock(return_value={
                "id": "file-123",
                "filename": "test.jsonl",
                "bytes": 1024,
                "created_at": 1620000000,
                "status": "uploaded"
            })
            
            # Call the function
            result = await upload_training_file(
                file_path=sample_jsonl_file,
                purpose="fine-tune",
                ctx=mock_context
            )
            
            # Verify
            assert "file_id" in result
            assert result["file_id"] == "file-123"
            assert result["status"] == "uploaded"
            mock_client_instance.upload_file.assert_called_once_with(
                sample_jsonl_file, "fine-tune"
            )
    
    @pytest.mark.asyncio
    async def test_upload_training_file_invalid_purpose(self, mock_context, sample_jsonl_file):
        """Test uploading a file with invalid purpose."""
        result = await upload_training_file(
            file_path=sample_jsonl_file,
            purpose="invalid",
            ctx=mock_context
        )
        
        assert "error" in result
        assert "Invalid purpose" in result["error"]
        mock_context.error.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_upload_training_file_nonexistent_file(self, mock_context):
        """Test uploading a non-existent file."""
        result = await upload_training_file(
            file_path="nonexistent.jsonl",
            purpose="fine-tune",
            ctx=mock_context
        )
        
        assert "error" in result
        assert "File validation failed" in result["error"]
        mock_context.error.assert_called_once()


class TestFineTuningJobs:
    """Tests for the fine-tuning job tools."""
    
    @pytest.mark.asyncio
    async def test_start_fine_tuning_job_success(self, mock_context, mock_openai_client):
        """Test successfully starting a fine-tuning job."""
        with patch('fine_tune_mcp.tools.fine_tuning_tools.OpenAIClient', return_value=mock_openai_client):
            # Call the function
            result = await start_fine_tuning_job(
                training_file_id="file-123",
                model="o4-mini-2025-04-16",
                ctx=mock_context
            )
            
            # Verify
            assert "job_id" in result
            assert result["job_id"] == "ft-12345"
            assert result["status"] == "created"
            mock_openai_client.create_fine_tuning_job.assert_called_once_with(
                training_file_id="file-123",
                model="o4-mini-2025-04-16",
                validation_file_id=None,
                hyperparameters=None,
                suffix=None
            )
    
    @pytest.mark.asyncio
    async def test_start_fine_tuning_job_invalid_model(self, mock_context):
        """Test starting a job with an invalid model."""
        result = await start_fine_tuning_job(
            training_file_id="file-123",
            model="invalid-model",
            ctx=mock_context
        )
        
        assert "error" in result
        assert "Unsupported model" in result["error"]
        mock_context.error.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_start_fine_tuning_job_invalid_hyperparameters(self, mock_context, mock_openai_client):
        """Test starting a job with invalid hyperparameters."""
        invalid_hyperparameters = {
            "n_epochs": 100,  # Too high (valid range is 1-50)
            "batch_size": 0,  # Too low (valid range is 1-256)
            "unknown_param": "value"  # Unsupported parameter
        }
        
        result = await start_fine_tuning_job(
            training_file_id="file-123",
            model="o4-mini-2025-04-16",
            hyperparameters=invalid_hyperparameters,
            ctx=mock_context
        )
        
        assert "error" in result
        assert "Hyperparameter validation failed" in result["error"]
        mock_context.error.assert_called_once()
        
    @pytest.mark.asyncio
    async def test_start_fine_tuning_job_empty_training_file_id(self, mock_context):
        """Test starting a job with empty training file ID."""
        result = await start_fine_tuning_job(
            training_file_id="",
            model="o4-mini-2025-04-16",
            ctx=mock_context
        )
        
        assert "error" in result
        assert "Training file ID is required" in result["error"]
        mock_context.error.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_fine_tuning_job_status_success(self, mock_context):
        """Test getting the status of a fine-tuning job."""
        with patch('fine_tune_mcp.tools.fine_tuning_tools.OpenAIClient') as MockClient:
            # Setup mock client
            mock_client_instance = MockClient.return_value
            mock_client_instance.get_fine_tuning_job = AsyncMock(return_value={
                "id": "ft-12345",
                "status": "running",
                "model": "o4-mini-2025-04-16",
                "created_at": 1620000000
            })
            mock_client_instance.list_fine_tuning_events = AsyncMock(return_value=[
                {"type": "message", "message": "Job started"}
            ])
            
            # Call the function
            result = await get_fine_tuning_job_status(
                job_id="ft-12345",
                ctx=mock_context
            )
            
            # Verify
            assert "job_id" in result
            assert result["job_id"] == "ft-12345"
            assert result["status"] == "running"
            mock_client_instance.get_fine_tuning_job.assert_called_once_with("ft-12345")
    
    @pytest.mark.asyncio
    async def test_get_fine_tuning_job_status_empty_job_id(self, mock_context):
        """Test getting the status with an empty job ID."""
        result = await get_fine_tuning_job_status(
            job_id="",
            ctx=mock_context
        )
        
        assert "error" in result
        assert "Job ID is required" in result["error"]
        mock_context.error.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_fine_tuning_job_status_job_not_found(self, mock_context):
        """Test getting the status of a non-existent job."""
        with patch('fine_tune_mcp.tools.fine_tuning_tools.OpenAIClient') as MockClient:
            mock_client_instance = MockClient.return_value
            mock_client_instance.get_fine_tuning_job = AsyncMock(return_value=None)
            
            result = await get_fine_tuning_job_status(
                job_id="ft-nonexistent",
                ctx=mock_context
            )
            
            assert "error" in result
            assert "No job found" in result["error"]
    
    @pytest.mark.asyncio
    async def test_list_fine_tuning_jobs_success(self, mock_context, mock_openai_client):
        """Test listing fine-tuning jobs."""
        with patch('fine_tune_mcp.tools.fine_tuning_tools.OpenAIClient', return_value=mock_openai_client):
            # Call the function
            result = await list_fine_tuning_jobs(
                limit=5,
                ctx=mock_context
            )
            
            # Verify
            assert "jobs" in result
            assert len(result["jobs"]) == 2
            assert result["count"] == 2
            mock_openai_client.list_fine_tuning_jobs.assert_called_once_with(limit=5)
    
    @pytest.mark.asyncio
    async def test_list_fine_tuning_jobs_invalid_limit(self, mock_context):
        """Test listing fine-tuning jobs with invalid limit."""
        # Test with non-integer limit
        result = await list_fine_tuning_jobs(
            limit="invalid",
            ctx=mock_context
        )
        
        assert "error" in result
        assert "Limit must be an integer" in result["error"]
        
        # Reset mock
        mock_context.reset_mock()
        
        # Test with out-of-range limit
        result = await list_fine_tuning_jobs(
            limit=101,  # Over the max of 100
            ctx=mock_context
        )
        
        assert "error" in result
        assert "Limit must be between 1 and 100" in result["error"]
        
    @pytest.mark.asyncio
    async def test_list_fine_tuning_jobs_api_error(self, mock_context):
        """Test handling API errors when listing fine-tuning jobs."""
        with patch('fine_tune_mcp.tools.fine_tuning_tools.OpenAIClient') as MockClient:
            # Setup mock client to raise an exception
            mock_client_instance = MockClient.return_value
            mock_client_instance.list_fine_tuning_jobs = AsyncMock(
                side_effect=Exception("API connection error")
            )
            
            # Call the function
            result = await list_fine_tuning_jobs(
                limit=10,
                ctx=mock_context
            )
            
            # Verify error handling
            assert "error" in result
            assert "Job listing failed" in result["error"]
            mock_context.error.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_cancel_fine_tuning_job_success(self, mock_context):
        """Test cancelling a fine-tuning job."""
        # Setup app context with mock OpenAI client
        mock_context.app.openai_client = AsyncMock()
        mock_context.app.openai_client.get_fine_tuning_job = AsyncMock(return_value={
            "id": "ft-12345",
            "status": "running"
        })
        mock_context.app.openai_client.cancel_fine_tuning_job = AsyncMock(return_value={
            "id": "ft-12345",
            "status": "cancelled"
        })
        
        # Call the function
        result = await cancel_fine_tuning_job(
            job_id="ft-12345",
            ctx=mock_context
        )
        
        # Verify
        assert "job_id" in result
        assert result["job_id"] == "ft-12345"
        assert result["status"] == "cancelled"
        assert result["cancelled"] is True
        mock_context.app.openai_client.cancel_fine_tuning_job.assert_called_once_with("ft-12345")
    
    @pytest.mark.asyncio
    async def test_cancel_fine_tuning_job_empty_job_id(self, mock_context):
        """Test cancelling a job with empty job ID."""
        result = await cancel_fine_tuning_job(
            job_id="",
            ctx=mock_context
        )
        
        assert "error" in result
        assert "Job ID is required" in result["error"]
        mock_context.error.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_cancel_fine_tuning_job_already_completed(self, mock_context):
        """Test cancelling a job that is already completed."""
        # Setup app context with mock OpenAI client
        mock_context.app.openai_client = AsyncMock()
        mock_context.app.openai_client.get_fine_tuning_job = AsyncMock(return_value={
            "id": "ft-12345",
            "status": "completed"  # Job is already completed
        })
        
        # Call the function
        result = await cancel_fine_tuning_job(
            job_id="ft-12345",
            ctx=mock_context
        )
        
        # Verify
        assert "error" in result
        assert "cannot be cancelled" in result["error"]
        mock_context.warning.assert_called_once()


class TestModelManagement:
    """Tests for the model management tools."""
    
    @pytest.mark.asyncio
    async def test_list_fine_tuned_models_no_models(self, mock_context):
        """Test listing fine-tuned models when none are available."""
        with patch('fine_tune_mcp.tools.fine_tuning_tools.OpenAIClient') as MockClient:
            mock_client_instance = MockClient.return_value
            # Return only base models, no fine-tuned ones
            mock_client_instance.list_models = AsyncMock(return_value=[
                {"id": "base-model-1", "owned_by": "openai"},
                {"id": "base-model-2", "owned_by": "openai"}
            ])
            
            # Call the function
            result = await list_fine_tuned_models(ctx=mock_context)
            
            # Verify
            assert "models" in result
            assert len(result["models"]) == 0  # No fine-tuned models
            assert result["count"] == 0
            assert result["total_models"] == 2
    
    @pytest.mark.asyncio
    async def test_list_fine_tuned_models_success(self, mock_context, mock_openai_client):
        """Test listing fine-tuned models."""
        with patch('fine_tune_mcp.tools.fine_tuning_tools.OpenAIClient', return_value=mock_openai_client):
            # Modify the mock to have a fine-tuned model
            mock_openai_client.list_models.return_value = [
                {"id": "ft-model-123", "owned_by": "organization-owner"},
                {"id": "base-model-456", "owned_by": "openai"},
                {"id": "model:ft-custom", "owned_by": "organization-owner"}
            ]
            
            # Call the function
            result = await list_fine_tuned_models(ctx=mock_context)
            
            # Verify
            assert "models" in result
            assert len(result["models"]) == 2  # Should find 2 fine-tuned models
            assert result["count"] == 2
            assert result["total_models"] == 3
            mock_openai_client.list_models.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_delete_fine_tuned_model_success(self, mock_context, mock_openai_client):
        """Test deleting a fine-tuned model."""
        with patch('fine_tune_mcp.tools.fine_tuning_tools.OpenAIClient', return_value=mock_openai_client):
            # Call the function
            result = await delete_fine_tuned_model(
                model_id="ft-model-123",
                ctx=mock_context
            )
            
            # Verify
            assert "model_id" in result
            assert result["model_id"] == "ft-model-123"
            assert result["deleted"] is True
            mock_openai_client.delete_model.assert_called_once_with("ft-model-123")
    
    @pytest.mark.asyncio
    async def test_delete_fine_tuned_model_empty_id(self, mock_context):
        """Test deleting a model with empty model ID."""
        result = await delete_fine_tuned_model(
            model_id="",
            ctx=mock_context
        )
        
        assert "error" in result
        assert "Model ID is required" in result["error"]
        mock_context.error.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_delete_fine_tuned_model_warning(self, mock_context, mock_openai_client):
        """Test deleting a model with non-standard fine-tuned ID pattern."""
        with patch('fine_tune_mcp.tools.fine_tuning_tools.OpenAIClient', return_value=mock_openai_client):
            # Call the function
            result = await delete_fine_tuned_model(
                model_id="not-ft-model",
                ctx=mock_context
            )
            
            # Verify warning was issued
            mock_context.warning.assert_called_once()
            assert "model_id" in result
            assert result["model_id"] == "not-ft-model"