"""
OpenAI provider implementation.

This module implements the FineTuningProvider interface for the OpenAI API.
"""

import os
import logging
from typing import Dict, Any, List, Optional

from .base import FineTuningProvider, ProviderRegistry
from ..openai_integration import OpenAIClient

logger = logging.getLogger(__name__)


@ProviderRegistry.register
class OpenAIProvider(FineTuningProvider):
    """
    OpenAI provider for fine-tuning.
    
    This provider uses the OpenAI API to perform fine-tuning operations.
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the OpenAI provider.
        
        Args:
            api_key: OpenAI API key. If not provided, will try to read from environment.
        """
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        if not self.api_key:
            logger.warning("No OpenAI API key provided or found in environment")
            
        self.client = OpenAIClient(api_key=self.api_key)
            
    @property
    def name(self) -> str:
        """
        Returns the name of the provider.
        
        Returns:
            str: The provider name
        """
        return "openai"
    
    async def prepare_data(self, examples: List[Dict[str, Any]], format_type: str = "chat", 
                     output_file: Optional[str] = None) -> Dict[str, Any]:
        """
        Prepare training data for fine-tuning.
        
        Args:
            examples: List of training examples
            format_type: Format type ('chat' or 'completion')
            output_file: Optional path to save the formatted data
            
        Returns:
            Dict[str, Any]: Validation results and file information if saved
        """
        try:
            # Format the training data
            formatted_data = self.client.format_training_data(examples, format_type)
            
            # Save to file if output_file is provided
            if output_file:
                file_path = self.client.save_training_data(formatted_data, output_file)
                
                # Validate the saved file
                validation_result = self.client.validate_training_data(file_path, format_type)
                
                return {
                    "file_path": file_path,
                    "validation": validation_result,
                    "example_count": len(examples)
                }
            else:
                # Return the formatted data if no output file
                return {
                    "formatted_data": formatted_data,
                    "example_count": len(examples)
                }
                
        except ValueError as e:
            logger.error(f"Error formatting training data: {str(e)}")
            return {"error": str(e)}
        except Exception as e:
            logger.error(f"Unexpected error preparing training data: {str(e)}")
            return {"error": str(e)}
    
    async def upload_file(self, file_path: str, purpose: str = "fine-tune") -> Dict[str, Any]:
        """
        Upload a training file to OpenAI.
        
        Args:
            file_path: Path to the file to upload
            purpose: Purpose of the file ('fine-tune')
            
        Returns:
            Dict[str, Any]: File metadata including ID for use in fine-tuning
        """
        try:
            response = await self.client.upload_file(file_path, purpose)
            
            return {
                "file_id": response.get("id"),
                "filename": response.get("filename"),
                "bytes": response.get("bytes"),
                "created_at": response.get("created_at"),
                "status": response.get("status")
            }
            
        except Exception as e:
            logger.error(f"Error uploading file: {str(e)}")
            return {"error": str(e)}
    
    async def start_fine_tuning(self, training_file_id: str, 
                          model: str,
                          validation_file_id: Optional[str] = None,
                          hyperparameters: Optional[Dict[str, Any]] = None,
                          suffix: Optional[str] = None) -> Dict[str, Any]:
        """
        Start a fine-tuning job.
        
        Args:
            training_file_id: The ID of the training data file
            model: The base model to fine-tune
            validation_file_id: Optional ID of the validation data file
            hyperparameters: Optional hyperparameters for fine-tuning
            suffix: Optional suffix for the fine-tuned model name
            
        Returns:
            Dict[str, Any]: Fine-tuning job details
        """
        try:
            job = await self.client.create_fine_tuning_job(
                training_file_id=training_file_id,
                model=model,
                validation_file_id=validation_file_id,
                hyperparameters=hyperparameters,
                suffix=suffix
            )
            
            return {
                "job_id": job.get("id"),
                "model": job.get("model"),
                "created_at": job.get("created_at"),
                "status": job.get("status"),
                "fine_tuned_model": job.get("fine_tuned_model")
            }
            
        except Exception as e:
            logger.error(f"Error starting fine-tuning job: {str(e)}")
            return {"error": str(e)}
    
    async def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """
        Get the status of a fine-tuning job.
        
        Args:
            job_id: The ID of the fine-tuning job
            
        Returns:
            Dict[str, Any]: Fine-tuning job details
        """
        try:
            job = await self.client.get_fine_tuning_job(job_id)
            
            # Get recent events
            events = await self.client.list_fine_tuning_events(job_id, limit=10)
            
            return {
                "job_id": job.get("id"),
                "model": job.get("model"),
                "created_at": job.get("created_at"),
                "finished_at": job.get("finished_at"),
                "status": job.get("status"),
                "fine_tuned_model": job.get("fine_tuned_model"),
                "events": events
            }
            
        except Exception as e:
            logger.error(f"Error fetching job status: {str(e)}")
            return {"error": str(e)}
    
    async def list_models(self) -> Dict[str, Any]:
        """
        List available fine-tuned models.
        
        Returns:
            Dict[str, Any]: List of fine-tuned models
        """
        try:
            all_models = await self.client.list_models()
            
            # Filter for fine-tuned models (typically have ft- prefix)
            fine_tuned_models = [
                model for model in all_models
                if model.get("id", "").startswith("ft-") or ":ft-" in model.get("id", "")
            ]
            
            return {
                "models": fine_tuned_models,
                "count": len(fine_tuned_models),
                "total_models": len(all_models)
            }
            
        except Exception as e:
            logger.error(f"Error listing fine-tuned models: {str(e)}")
            return {"error": str(e)}
    
    async def cancel_job(self, job_id: str) -> Dict[str, Any]:
        """
        Cancel a fine-tuning job.
        
        Args:
            job_id: The ID of the fine-tuning job to cancel
            
        Returns:
            Dict[str, Any]: Cancellation confirmation
        """
        try:
            result = await self.client.cancel_fine_tuning_job(job_id)
            
            return {
                "job_id": result.get("id"),
                "status": result.get("status"),
                "cancelled": True
            }
            
        except Exception as e:
            logger.error(f"Error cancelling fine-tuning job: {str(e)}")
            return {"error": str(e)}
    
    async def delete_model(self, model_id: str) -> Dict[str, Any]:
        """
        Delete a fine-tuned model.
        
        Args:
            model_id: The ID of the fine-tuned model to delete
            
        Returns:
            Dict[str, Any]: Deletion confirmation
        """
        try:
            result = await self.client.delete_model(model_id)
            
            return {
                "model_id": model_id,
                "deleted": result.get("deleted", False)
            }
            
        except Exception as e:
            logger.error(f"Error deleting fine-tuned model: {str(e)}")
            return {"error": str(e)}