"""
OpenAI API integration module.
Handles communication with the OpenAI API for fine-tuning operations.
"""

import os
import json
import httpx
import logging
from typing import Dict, Any, List, Optional, Union, AsyncGenerator
from pathlib import Path

# Setup logging
logger = logging.getLogger(__name__)


class OpenAIClient:
    """
    Client for OpenAI API operations with a focus on fine-tuning.
    
    This client handles authentication, request formatting, and response parsing
    for OpenAI API interactions, particularly for fine-tuning operations.
    """
    
    BASE_URL = "https://api.openai.com/v1"
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the OpenAI client.
        
        Args:
            api_key: OpenAI API key. If not provided, will try to read from environment.
        """
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key is required but not provided")
            
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
    async def _request(
        self, 
        method: str, 
        endpoint: str, 
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
        stream: bool = False
    ) -> Union[Dict[str, Any], AsyncGenerator[Dict[str, Any], None]]:
        """
        Make a request to the OpenAI API.
        
        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint path
            data: Request body data
            params: Query parameters
            stream: Whether to stream the response
            
        Returns:
            API response as dictionary or async generator for streamed responses
        """
        url = f"{self.BASE_URL}/{endpoint}"
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                if stream:
                    response = await client.request(
                        method=method,
                        url=url,
                        json=data,
                        params=params,
                        headers=self.headers,
                        stream=True
                    )
                    response.raise_for_status()
                    
                    async def response_generator():
                        async for line in response.aiter_lines():
                            line = line.strip()
                            if line and line.startswith("data: "):
                                data_str = line[6:]  # Remove "data: " prefix
                                if data_str != "[DONE]":
                                    try:
                                        yield json.loads(data_str)
                                    except json.JSONDecodeError as e:
                                        logger.error(f"Error parsing streaming response: {e}")
                    
                    return response_generator()
                else:
                    response = await client.request(
                        method=method,
                        url=url,
                        json=data,
                        params=params,
                        headers=self.headers
                    )
                    response.raise_for_status()
                    return response.json()
                    
        except httpx.HTTPStatusError as e:
            error_info = e.response.json() if e.response.content else {"error": str(e)}
            logger.error(f"HTTP error during file upload to OpenAI API: {error_info}")
            raise
        except FileNotFoundError as e:
            logger.error(f"File not found: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error during file upload: {e}")
            raise

    async def list_files(self) -> List[Dict[str, Any]]:
        """
        List all files uploaded to OpenAI.
        
        Returns:
            List of file metadata
        """
        response = await self._request(
            method="GET",
            endpoint="files"
        )
        return response.get("data", [])

    async def get_file(self, file_id: str) -> Dict[str, Any]:
        """
        Get information about a specific file.
        
        Args:
            file_id: The ID of the file
            
        Returns:
            File metadata
        """
        return await self._request(
            method="GET",
            endpoint=f"files/{file_id}"
        )

    async def delete_file(self, file_id: str) -> Dict[str, Any]:
        """
        Delete a file from OpenAI.
        
        Args:
            file_id: The ID of the file to delete
            
        Returns:
            Deletion confirmation
        """
        return await self._request(
            method="DELETE",
            endpoint=f"files/{file_id}"
        )

    # Fine-tuning operations
    async def create_fine_tuning_job(
        self,
        training_file_id: str,
        model: str = "gpt-3.5-turbo",
        validation_file_id: Optional[str] = None,
        hyperparameters: Optional[Dict[str, Any]] = None,
        suffix: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a fine-tuning job.
        
        Args:
            training_file_id: The ID of the training data file
            model: The base model to fine-tune
            validation_file_id: Optional ID of the validation data file
            hyperparameters: Optional hyperparameters for fine-tuning (required for o4-mini-2025-04-16)
            suffix: Optional suffix for the fine-tuned model name
            
        Returns:
            Fine-tuning job details
        """
        data = {
            "training_file": training_file_id,
            "model": model
        }
        
        if validation_file_id:
            data["validation_file"] = validation_file_id
            
        # For o4-mini-2025-04-16, hyperparameters are required (at least one)
        if model == "o4-mini-2025-04-16":
            # If no hyperparameters provided, use reasonable defaults
            if not hyperparameters:
                hyperparameters = {"n_epochs": 3}  # Default to 3 epochs
            data["hyperparameters"] = hyperparameters
        elif hyperparameters:
            data["hyperparameters"] = hyperparameters
            
        if suffix:
            data["suffix"] = suffix
            
        return await self._request(
            method="POST",
            endpoint="fine_tuning/jobs",
            data=data
        )

    async def list_fine_tuning_jobs(
        self,
        limit: int = 10,
        after: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        List fine-tuning jobs.
        
        Args:
            limit: Maximum number of jobs to return
            after: Job ID to start listing after
            
        Returns:
            List of fine-tuning jobs
        """
        params = {"limit": limit}
        if after:
            params["after"] = after
            
        response = await self._request(
            method="GET",
            endpoint="fine_tuning/jobs",
            params=params
        )
        return response.get("data", [])

    async def get_fine_tuning_job(self, job_id: str) -> Dict[str, Any]:
        """
        Get information about a specific fine-tuning job.
        
        Args:
            job_id: The ID of the fine-tuning job
            
        Returns:
            Fine-tuning job details
        """
        return await self._request(
            method="GET",
            endpoint=f"fine_tuning/jobs/{job_id}"
        )

    async def cancel_fine_tuning_job(self, job_id: str) -> Dict[str, Any]:
        """
        Cancel a fine-tuning job.
        
        Args:
            job_id: The ID of the fine-tuning job to cancel
            
        Returns:
            Cancellation confirmation
        """
        return await self._request(
            method="POST",
            endpoint=f"fine_tuning/jobs/{job_id}/cancel"
        )

    async def list_fine_tuning_events(
        self,
        job_id: str,
        limit: int = 10,
        after: Optional[str] = None,
        stream: bool = False
    ) -> Union[List[Dict[str, Any]], AsyncGenerator[Dict[str, Any], None]]:
        """
        List events from a fine-tuning job.
        
        Args:
            job_id: The ID of the fine-tuning job
            limit: Maximum number of events to return
            after: Event ID to start listing after
            stream: Whether to stream the events
            
        Returns:
            List of events or an async generator for streamed events
        """
        params = {"limit": limit}
        if after:
            params["after"] = after
            
        if stream:
            return await self._request(
                method="GET",
                endpoint=f"fine_tuning/jobs/{job_id}/events",
                params=params,
                stream=True
            )
        else:
            response = await self._request(
                method="GET",
                endpoint=f"fine_tuning/jobs/{job_id}/events",
                params=params
            )
            return response.get("data", [])

    async def list_models(self) -> List[Dict[str, Any]]:
        """
        List available models, including fine-tuned models.
        
        Returns:
            List of available models
        """
        response = await self._request(
            method="GET",
            endpoint="models"
        )
        return response.get("data", [])

    async def get_model(self, model_id: str) -> Dict[str, Any]:
        """
        Get information about a specific model.
        
        Args:
            model_id: The ID of the model
            
        Returns:
            Model details
        """
        return await self._request(
            method="GET",
            endpoint=f"models/{model_id}"
        )

    async def delete_model(self, model_id: str) -> Dict[str, Any]:
        """
        Delete a fine-tuned model.
        
        Args:
            model_id: The ID of the fine-tuned model to delete
            
        Returns:
            Deletion confirmation
        """
        return await self._request(
            method="DELETE",
            endpoint=f"models/{model_id}"
        )

    # Data preparation helpers
    @staticmethod
    def format_training_data(data: List[Dict[str, Any]], format_type: str = "chat") -> str:
        """
        Format training data for fine-tuning.
        
        Args:
            data: List of training examples
            format_type: Format type ('chat' or 'completion')
            
        Returns:
            JSONL string of formatted training data
        """
        formatted_data = []
        
        if format_type == "chat":
            for example in data:
                if "messages" not in example:
                    raise ValueError("Chat format requires 'messages' in each example")
                formatted_data.append(json.dumps(example))
        elif format_type == "completion":
            for example in data:
                if "prompt" not in example or "completion" not in example:
                    raise ValueError("Completion format requires 'prompt' and 'completion' in each example")
                formatted_data.append(json.dumps(example))
        else:
            raise ValueError(f"Unsupported format type: {format_type}")
            
        return "\n".join(formatted_data)

    @staticmethod
    def save_training_data(data: str, file_path: str) -> str:
        """
        Save formatted training data to a file.
        
        Args:
            data: Formatted training data string (JSONL)
            file_path: Path to save the file
            
        Returns:
            Path to the saved file
        """
        path = Path(file_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(path, "w", encoding="utf-8") as f:
            f.write(data)
            
        return str(path)

    @staticmethod
    def validate_training_data(file_path: str, format_type: str = "chat") -> Dict[str, Any]:
        """
        Validate training data file for fine-tuning.
        
        Args:
            file_path: Path to the training data file
            format_type: Format type ('chat' or 'completion')
            
        Returns:
            Validation results with details on any issues found
        """
        path = Path(file_path)
        if not path.exists():
            return {"valid": False, "error": f"File not found: {file_path}"}
            
        issues = []
        line_count = 0
        format_errors = 0
        
        try:
            with open(path, "r", encoding="utf-8") as f:
                for i, line in enumerate(f, 1):
                    line_count += 1
                    try:
                        example = json.loads(line.strip())
                        
                        if format_type == "chat":
                            if "messages" not in example:
                                issues.append(f"Line {i}: Missing 'messages' field")
                                format_errors += 1
                            elif not isinstance(example["messages"], list):
                                issues.append(f"Line {i}: 'messages' field is not a list")
                                format_errors += 1
                            elif not all(isinstance(msg, dict) and "role" in msg and "content" in msg for msg in example["messages"]):
                                issues.append(f"Line {i}: Messages missing required 'role' or 'content' fields")
                                format_errors += 1
                                
                        elif format_type == "completion":
                            if "prompt" not in example:
                                issues.append(f"Line {i}: Missing 'prompt' field")
                                format_errors += 1
                            if "completion" not in example:
                                issues.append(f"Line {i}: Missing 'completion' field")
                                format_errors += 1
                                
                    except json.JSONDecodeError:
                        issues.append(f"Line {i}: Invalid JSON")
                        format_errors += 1
                        
            return {
                "valid": format_errors == 0,
                "file_path": str(path),
                "line_count": line_count,
                "format_errors": format_errors,
                "issues": issues
            }
            
        except Exception as e:
            return {"valid": False, "error": str(e)}

    # File operations
    async def upload_file(self, file_path: str, purpose: str) -> Dict[str, Any]:
        """
        Upload a file to OpenAI.
        
        Args:
            file_path: Path to the file to upload
            purpose: Purpose of the file (e.g., 'fine-tune')
            
        Returns:
            API response containing the file ID and other metadata
        """
        try:
            path = Path(file_path)
            if not path.exists():
                raise FileNotFoundError(f"File not found: {file_path}")
                
            # For file uploads, we need to use multipart/form-data
            async with httpx.AsyncClient(timeout=60.0) as client:
                with open(path, "rb") as file:
                    files = {"file": (path.name, file)}
                    data = {"purpose": purpose}
                    
                    headers = {"Authorization": f"Bearer {self.api_key}"}
                    
                    response = await client.post(
                        f"{self.BASE_URL}/files",
                        files=files,
                        data=data,
                        headers=headers
                    )
                    response.raise_for_status()
                    return response.json()
                    
        except httpx.HTTPStatusError as e:
            error_info = e.response.json() if e.response.content else {"error": str(e)}
            logger.error(f"HTTP error during file upload to OpenAI API: {error_info}")
            raise
        except FileNotFoundError as e:
            logger.error(f"File not found: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error during file upload: {e}")
            raise
