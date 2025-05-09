"""
Integration tests for the fine-tuning workflow.

These tests verify the complete fine-tuning workflow from data preparation to model usage,
ensuring that all components work together correctly.
"""

import os
import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from pathlib import Path
import tempfile

from fine_tune_mcp.openai_integration import OpenAIClient
from fine_tune_mcp.tools.fine_tuning_tools import (
    prepare_training_data,
    upload_training_file,
    start_fine_tuning_job,
    get_fine_tuning_job_status,
    list_fine_tuning_jobs,
    cancel_fine_tuning_job,
    list_fine_tuned_models,
    delete_fine_tuned_model
)


class TestFineTuningWorkflow:
    """
    Integration tests for the complete fine-tuning workflow.
    
    These tests mock the OpenAI API responses but test the interaction between
    the different components of the fine-tuning workflow.
    """
    
    @pytest.mark.asyncio
    async def test_complete_workflow_success(self, mock_context, sample_training_data, tmp_path):
        """
        Test the complete fine-tuning workflow with successful outcomes.
        
        This test verifies the entire process from preparing training data to using
        the resulting model, ensuring all components work together correctly.
        
        Steps:
        1. Prepare and save training data
        2. Upload training file
        3. Start fine-tuning job
        4. Monitor job status
        5. List fine-tuned models
        6. Clean up (delete model)
        """
        # Setup test environment
        training_file_path = tmp_path / "training_data.jsonl"
        
        # Step 1: Prepare training data
        # Patch validate_file_path to bypass file existence check in tests
        with patch('fine_tune_mcp.tools.fine_tuning_tools.validate_file_path', return_value={}), \
             patch('fine_tune_mcp.tools.fine_tuning_tools.OpenAIClient') as MockClient:
            mock_client = MockClient.return_value
            mock_client.format_training_data.return_value = "formatted data"
            mock_client.save_training_data.return_value = str(training_file_path)
            mock_client.validate_training_data.return_value = {
                "valid": True,
                "line_count": 3,
                "format_errors": 0
            }
            
            prepare_result = await prepare_training_data(
                examples=sample_training_data,
                format_type="chat",
                output_file=str(training_file_path),
                ctx=mock_context
            )
            
            assert prepare_result["file_path"] == str(training_file_path)
            assert prepare_result["validation"]["valid"] is True
            assert prepare_result["example_count"] == len(sample_training_data)
        
        # Step 2: Upload training file
        with patch('fine_tune_mcp.tools.fine_tuning_tools.validate_file_path', return_value={}), \
             patch('fine_tune_mcp.tools.fine_tuning_tools.OpenAIClient') as MockClient:
            mock_client = MockClient.return_value
            mock_client.validate_training_data.return_value = {"valid": True}
            mock_client.upload_file = AsyncMock(return_value={
                "id": "file-123456",
                "filename": "training_data.jsonl",
                "bytes": 1024,
                "status": "uploaded"
            })
            
            upload_result = await upload_training_file(
                file_path=str(training_file_path),
                purpose="fine-tune",
                ctx=mock_context
            )
            
            assert upload_result["file_id"] == "file-123456"
            assert upload_result["status"] == "uploaded"
            
            # Save file_id for next step
            file_id = upload_result["file_id"]
        
        # Step 3: Start fine-tuning job
        with patch('fine_tune_mcp.tools.fine_tuning_tools.OpenAIClient') as MockClient:
            mock_client = MockClient.return_value
            mock_client.create_fine_tuning_job = AsyncMock(return_value={
                "id": "ft-job-123456",
                "status": "created",
                "model": "o4-mini-2025-04-16",
                "created_at": 1620000000
            })
            
            job_result = await start_fine_tuning_job(
                training_file_id=file_id,
                model="o4-mini-2025-04-16",
                ctx=mock_context
            )
            
            assert job_result["job_id"] == "ft-job-123456"
            assert job_result["status"] == "created"
            
            # Save job_id for next step
            job_id = job_result["job_id"]
        
        # Step 4: Monitor job status
        with patch('fine_tune_mcp.tools.fine_tuning_tools.OpenAIClient') as MockClient:
            mock_client = MockClient.return_value
            
            # Initial status: running
            mock_client.get_fine_tuning_job = AsyncMock(return_value={
                "id": job_id,
                "status": "running",
                "model": "o4-mini-2025-04-16",
                "created_at": 1620000000,
                "fine_tuned_model": None  # Not ready yet
            })
            mock_client.list_fine_tuning_events = AsyncMock(return_value=[
                {"type": "message", "message": "Job started"}
            ])
            
            status_result = await get_fine_tuning_job_status(
                job_id=job_id,
                ctx=mock_context
            )
            
            assert status_result["job_id"] == job_id
            assert status_result["status"] == "running"
            assert status_result["fine_tuned_model"] is None
            
            # Update status to completed
            mock_client.get_fine_tuning_job = AsyncMock(return_value={
                "id": job_id,
                "status": "completed",
                "model": "o4-mini-2025-04-16",
                "created_at": 1620000000,
                "finished_at": 1620001000,
                "fine_tuned_model": "ft-model-123456"
            })
            mock_client.list_fine_tuning_events = AsyncMock(return_value=[
                {"type": "message", "message": "Job started"},
                {"type": "message", "message": "Training completed successfully"}
            ])
            
            status_result = await get_fine_tuning_job_status(
                job_id=job_id,
                ctx=mock_context
            )
            
            assert status_result["job_id"] == job_id
            assert status_result["status"] == "completed"
            assert status_result["fine_tuned_model"] == "ft-model-123456"
            
            # Save fine_tuned_model for next step
            fine_tuned_model = status_result["fine_tuned_model"]
        
        # Step 5: List fine-tuned models
        with patch('fine_tune_mcp.tools.fine_tuning_tools.OpenAIClient') as MockClient:
            mock_client = MockClient.return_value
            mock_client.list_models = AsyncMock(return_value=[
                {"id": "o4-mini-2025-04-16", "owned_by": "openai"},
                {"id": fine_tuned_model, "owned_by": "organization-owner"},
                {"id": "other-model", "owned_by": "openai"}
            ])
            
            models_result = await list_fine_tuned_models(ctx=mock_context)
            
            assert models_result["count"] == 1
            assert models_result["models"][0]["id"] == fine_tuned_model
        
        # Step 6: Clean up - delete model
        with patch('fine_tune_mcp.tools.fine_tuning_tools.OpenAIClient') as MockClient:
            mock_client = MockClient.return_value
            mock_client.delete_model = AsyncMock(return_value={
                "id": fine_tuned_model,
                "deleted": True
            })
            
            delete_result = await delete_fine_tuned_model(
                model_id=fine_tuned_model,
                ctx=mock_context
            )
            
            assert delete_result["model_id"] == fine_tuned_model
            assert delete_result["deleted"] is True

    @pytest.mark.asyncio
    async def test_workflow_with_error_handling(self, mock_context, sample_training_data, tmp_path):
        """
        Test the fine-tuning workflow with error conditions.
        
        This test verifies how the workflow handles various error conditions:
        1. Invalid training data
        2. File upload failure
        3. Fine-tuning job failure
        4. Cancelling a job
        """
        # Setup test environment
        training_file_path = tmp_path / "invalid_training_data.jsonl"
        
        # Step 1: Prepare training data with validation errors
        with patch('fine_tune_mcp.tools.fine_tuning_tools.validate_file_path', return_value={}), \
             patch('fine_tune_mcp.tools.fine_tuning_tools.OpenAIClient') as MockClient:
            mock_client = MockClient.return_value
            mock_client.format_training_data.return_value = "formatted data with errors"
            mock_client.save_training_data.return_value = str(training_file_path)
            mock_client.validate_training_data.return_value = {
                "valid": False,
                "line_count": 3,
                "format_errors": 2,
                "issues": ["Line 1: Missing 'role' field", "Line 3: Invalid message format"]
            }
            
            prepare_result = await prepare_training_data(
                examples=sample_training_data,
                format_type="chat",
                output_file=str(training_file_path),
                ctx=mock_context
            )
            
            assert prepare_result["file_path"] == str(training_file_path)
            assert prepare_result["validation"]["valid"] is False
            assert prepare_result["validation"]["format_errors"] == 2
            assert len(prepare_result["validation"]["issues"]) == 2
        
        # Step 2: Upload file with API error
        with patch('fine_tune_mcp.tools.fine_tuning_tools.validate_file_path', return_value={}), \
             patch('fine_tune_mcp.tools.fine_tuning_tools.OpenAIClient') as MockClient:
            mock_client = MockClient.return_value
            mock_client.validate_training_data.return_value = {"valid": True}  # Assume validation passes
            mock_client.upload_file = AsyncMock(side_effect=Exception("API connection error"))
            
            upload_result = await upload_training_file(
                file_path=str(training_file_path),
                purpose="fine-tune",
                ctx=mock_context
            )
            
            assert "error" in upload_result
            assert "Upload failed: API connection error" in upload_result["error"]
            
            # Mock successful upload for next steps
            mock_client.upload_file = AsyncMock(return_value={
                "id": "file-123456",
                "filename": "training_data.jsonl",
                "status": "uploaded"
            })
            
            upload_result = await upload_training_file(
                file_path=str(training_file_path),
                purpose="fine-tune",
                ctx=mock_context
            )
            
            file_id = upload_result["file_id"]
        
        # Step 3: Start fine-tuning job with invalid hyperparameters
        job_result = await start_fine_tuning_job(
            training_file_id=file_id,
            model="o4-mini-2025-04-16",
            hyperparameters={"n_epochs": 100},  # Invalid value
            ctx=mock_context
        )
        
        assert "error" in job_result
        assert "Hyperparameter validation failed" in job_result["error"]
        
        # Start job successfully for next steps
        with patch('fine_tune_mcp.tools.fine_tuning_tools.OpenAIClient') as MockClient:
            mock_client = MockClient.return_value
            mock_client.create_fine_tuning_job = AsyncMock(return_value={
                "id": "ft-job-123456",
                "status": "created",
                "model": "o4-mini-2025-04-16",
                "created_at": 1620000000
            })
            
            job_result = await start_fine_tuning_job(
                training_file_id=file_id,
                model="o4-mini-2025-04-16",
                ctx=mock_context
            )
            
            job_id = job_result["job_id"]
        
        # Step 4: Job fails during training
        with patch('fine_tune_mcp.tools.fine_tuning_tools.OpenAIClient') as MockClient:
            mock_client = MockClient.return_value
            mock_client.get_fine_tuning_job = AsyncMock(return_value={
                "id": job_id,
                "status": "failed",
                "model": "o4-mini-2025-04-16",
                "created_at": 1620000000,
                "finished_at": 1620001000,
                "fine_tuned_model": None,
                "error": {"message": "Training error occurred", "code": "training_error"}
            })
            mock_client.list_fine_tuning_events = AsyncMock(return_value=[
                {"type": "message", "message": "Job started"},
                {"type": "error", "message": "Training error: insufficient examples"}
            ])
            
            status_result = await get_fine_tuning_job_status(
                job_id=job_id,
                ctx=mock_context
            )
            
            assert status_result["job_id"] == job_id
            assert status_result["status"] == "failed"
            assert status_result["fine_tuned_model"] is None
            assert len(status_result["events"]) == 2
            assert "Training error" in status_result["events"][1]["message"]
        
        # Step 5: Start a new job and then cancel it
        with patch('fine_tune_mcp.tools.fine_tuning_tools.OpenAIClient') as MockClient:
            mock_client = MockClient.return_value
            mock_client.create_fine_tuning_job = AsyncMock(return_value={
                "id": "ft-job-7890",
                "status": "created",
                "model": "o4-mini-2025-04-16",
                "created_at": 1620002000
            })
            
            job_result = await start_fine_tuning_job(
                training_file_id=file_id,
                model="o4-mini-2025-04-16",
                ctx=mock_context
            )
            
            new_job_id = job_result["job_id"]
        
        # Step 6: Cancel the job
        with patch('fine_tune_mcp.tools.fine_tuning_tools.OpenAIClient') as MockClient:
            mock_client = MockClient.return_value
            # Setup for checking job status
            mock_client.get_fine_tuning_job = AsyncMock(return_value={
                "id": new_job_id,
                "status": "running"
            })
            
            # Setup for cancellation
            mock_client.cancel_fine_tuning_job = AsyncMock(return_value={
                "id": new_job_id,
                "status": "cancelled"
            })
            
            # Mock the app context to use our mocked client
            mock_context.app.openai_client = mock_client
            
            cancel_result = await cancel_fine_tuning_job(
                job_id=new_job_id,
                ctx=mock_context
            )
            
            assert cancel_result["job_id"] == new_job_id
            assert cancel_result["status"] == "cancelled"
            assert cancel_result["cancelled"] is True

    @pytest.mark.asyncio
    async def test_end_to_end_mocked_integration(self, mock_context, sample_training_data, tmp_path):
        """
        Test an end-to-end fine-tuning workflow with a single mocked OpenAI client.
        
        This test verifies the entire process using a consistent client mock,
        ensuring proper integration between the workflow components and maintaining
        state throughout the process.
        """
        # Setup a single mocked OpenAI client for the entire workflow
        with patch('fine_tune_mcp.tools.fine_tuning_tools.validate_file_path', return_value={}), \
             patch('fine_tune_mcp.tools.fine_tuning_tools.OpenAIClient') as MockClient:
            mock_client = MockClient.return_value
            
            # Common test variables
            training_file_path = tmp_path / "training_data.jsonl"
            file_id = "file-12345"
            job_id = "ft-job-12345"
            model_id = "ft-model-12345"
            
            # 1. Setup mock for prepare_training_data
            mock_client.format_training_data.return_value = json.dumps({"messages": []})
            mock_client.save_training_data.return_value = str(training_file_path)
            mock_client.validate_training_data.return_value = {
                "valid": True,
                "line_count": len(sample_training_data),
                "format_errors": 0
            }
            
            # 2. Setup mock for upload_training_file
            mock_client.upload_file = AsyncMock(return_value={
                "id": file_id,
                "filename": training_file_path.name,
                "bytes": 1024,
                "status": "uploaded"
            })
            
            # 3. Setup mock for start_fine_tuning_job
            mock_client.create_fine_tuning_job = AsyncMock(return_value={
                "id": job_id,
                "status": "created",
                "model": "o4-mini-2025-04-16",
                "created_at": 1620000000
            })
            
            # 4. Setup mock for job status checks (multiple states)
            status_responses = [
                # First call - running
                {
                    "id": job_id,
                    "status": "running",
                    "model": "o4-mini-2025-04-16",
                    "created_at": 1620000000,
                    "fine_tuned_model": None
                },
                # Second call - completed
                {
                    "id": job_id,
                    "status": "completed",
                    "model": "o4-mini-2025-04-16",
                    "created_at": 1620000000,
                    "finished_at": 1620010000,
                    "fine_tuned_model": model_id
                }
            ]
            mock_client.get_fine_tuning_job = AsyncMock(side_effect=status_responses)
            
            mock_client.list_fine_tuning_events = AsyncMock(return_value=[
                {"type": "message", "message": "Job started"},
                {"type": "message", "message": "Epoch 1/3"}
            ])
            
            # 5. Setup mock for listing models
            mock_client.list_models = AsyncMock(return_value=[
                {"id": "o4-mini-2025-04-16", "owned_by": "openai"},
                {"id": model_id, "owned_by": "organization-owner"}
            ])
            
            # 6. Setup mock for deleting model
            mock_client.delete_model = AsyncMock(return_value={
                "id": model_id,
                "deleted": True
            })
            
            # Execute workflow
            
            # Step 1: Prepare training data
            prepare_result = await prepare_training_data(
                examples=sample_training_data,
                format_type="chat",
                output_file=str(training_file_path),
                ctx=mock_context
            )
            assert prepare_result["validation"]["valid"] is True
            
            # Step 2: Upload training file
            upload_result = await upload_training_file(
                file_path=str(training_file_path),
                purpose="fine-tune",
                ctx=mock_context
            )
            assert upload_result["file_id"] == file_id
            
            # Step 3: Start fine-tuning job
            job_result = await start_fine_tuning_job(
                training_file_id=file_id,
                model="o4-mini-2025-04-16",
                ctx=mock_context
            )
            assert job_result["job_id"] == job_id
            
            # Step 4: Check job status (first time - running)
            status_result = await get_fine_tuning_job_status(
                job_id=job_id,
                ctx=mock_context
            )
            assert status_result["status"] == "running"
            
            # Step 5: Check job status again (second time - completed)
            status_result = await get_fine_tuning_job_status(
                job_id=job_id,
                ctx=mock_context
            )
            assert status_result["status"] == "completed"
            assert status_result["fine_tuned_model"] == model_id
            
            # Step 6: List fine-tuned models
            models_result = await list_fine_tuned_models(ctx=mock_context)
            assert len(models_result["models"]) == 1
            assert models_result["models"][0]["id"] == model_id
            
            # Step 7: Delete the model
            delete_result = await delete_fine_tuned_model(
                model_id=model_id,
                ctx=mock_context
            )
            assert delete_result["deleted"] is True
            
            # Verify that the client was used consistently throughout the workflow
            mock_client.format_training_data.assert_called_once()
            mock_client.upload_file.assert_called_once()
            mock_client.create_fine_tuning_job.assert_called_once()
            assert mock_client.get_fine_tuning_job.call_count == 2
            mock_client.list_models.assert_called_once()
            mock_client.delete_model.assert_called_once()