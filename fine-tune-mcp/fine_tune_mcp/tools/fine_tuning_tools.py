"""
Fine-tuning MCP tools implementation.
Exposes OpenAI fine-tuning functionality as MCP tools.
"""

import os
import json
import asyncio
import logging
from typing import Dict, Any, List, Optional, Union, Set
from pathlib import Path

from .. import server
from ..server import mcp, Context, AppContext
from ..openai_integration import OpenAIClient

# Setup logging
logger = logging.getLogger(__name__)

# Define supported models
SUPPORTED_BASE_MODELS = {
    "o4-mini-2025-04-16"  # Only support this model as specified
}

# Define supported hyperparameters and their valid ranges
SUPPORTED_HYPERPARAMETERS = {
    "n_epochs": (1, 50),          # min, max
    "batch_size": (1, 256),       # min, max
    "learning_rate_multiplier": (0.02, 3.0)  # min, max
}

# Helper validation functions
def validate_model(model: str) -> bool:
    """
    Validate if the provided model is supported for fine-tuning.
    
    Args:
        model: The base model name
        
    Returns:
        True if valid, False otherwise
    """
    return model in SUPPORTED_BASE_MODELS

def validate_hyperparameters(hyperparameters: Dict[str, Any]) -> Dict[str, str]:
    """
    Validate hyperparameters for fine-tuning.
    
    Args:
        hyperparameters: Dictionary of hyperparameters
        
    Returns:
        Dictionary of validation errors, empty if valid
    """
    errors = {}
    
    # Check for unsupported parameters
    unsupported_params = set(hyperparameters.keys()) - set(SUPPORTED_HYPERPARAMETERS.keys())
    if unsupported_params:
        errors["unsupported_params"] = f"Unsupported hyperparameters: {', '.join(unsupported_params)}"
    
    # Validate value ranges for each parameter
    for param, value in hyperparameters.items():
        if param in SUPPORTED_HYPERPARAMETERS:
            min_val, max_val = SUPPORTED_HYPERPARAMETERS[param]
            if not isinstance(value, (int, float)):
                errors[param] = f"{param} must be a number"
            elif value < min_val or value > max_val:
                errors[param] = f"{param} must be between {min_val} and {max_val}"
    
    return errors

def validate_file_path(file_path: str) -> Dict[str, str]:
    """
    Validate if a file exists and is readable.
    
    Args:
        file_path: Path to the file
        
    Returns:
        Dictionary of validation errors, empty if valid
    """
    errors = {}
    path = Path(file_path)
    
    if not path.exists():
        errors["not_found"] = f"File not found: {file_path}"
    elif not path.is_file():
        errors["not_file"] = f"Not a file: {file_path}"
    elif not os.access(path, os.R_OK):
        errors["not_readable"] = f"File is not readable: {file_path}"
    
    return errors


@mcp.tool()
async def prepare_training_data(
    examples: List[Dict[str, Any]],
    format_type: str = "chat",
    output_file: Optional[str] = None,
    ctx: Context = None
) -> Dict[str, Any]:
    """
    Prepare training data for fine-tuning.
    
    This tool formats and validates training data for OpenAI fine-tuning.
    It can either return the formatted data or save it to a file.
    
    Args:
        examples: List of training examples
        format_type: Format type ('chat' or 'completion')
        output_file: Optional path to save the formatted data
        ctx: The Context object (automatically injected)
        
    Returns:
        Validation results and file information if saved
    """
    try:
        # Validate format_type
        if format_type not in ["chat", "completion"]:
            error_msg = f"Invalid format_type: {format_type}. Must be 'chat' or 'completion'."
            ctx.error(error_msg)
            return {"error": error_msg}
        
        # Validate output_file path if provided
        if output_file:
            # Check if directory exists
            output_path = Path(output_file)
            if not output_path.parent.exists():
                ctx.warning(f"Directory {output_path.parent} does not exist. It will be created.")
        
        # Get OpenAI client from context
        # The Context object doesn't have a direct app attribute
        # Instead, we'll create a new client using the environment variable
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            ctx.warning("No OpenAI API key found in environment")
            return {"error": "OpenAI API key not available"}
        
        openai_client = OpenAIClient(api_key=api_key)
        
        # Format the training data
        ctx.info(f"Formatting {len(examples)} examples as {format_type} data")
        
        # Validate examples structure before formatting
        if format_type == "chat":
            for i, example in enumerate(examples):
                if "messages" not in example:
                    error_msg = f"Example {i+1} is missing 'messages' field required for chat format"
                    ctx.error(error_msg)
                    return {"error": error_msg}
        elif format_type == "completion":
            for i, example in enumerate(examples):
                if "prompt" not in example or "completion" not in example:
                    error_msg = f"Example {i+1} is missing 'prompt' or 'completion' field required for completion format"
                    ctx.error(error_msg)
                    return {"error": error_msg}
        
        formatted_data = openai_client.format_training_data(examples, format_type)
        
        # Save to file if output_file is provided
        if output_file:
            file_path = openai_client.save_training_data(formatted_data, output_file)
            ctx.info(f"Saved training data to {file_path}")
            
            # Validate the saved file
            validation_result = openai_client.validate_training_data(file_path, format_type)
            
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
        ctx.error(f"Error formatting training data: {str(e)}")
        return {"error": str(e)}
    except Exception as e:
        ctx.error(f"Unexpected error preparing training data: {str(e)}")
        return {"error": str(e)}


@mcp.tool()
async def upload_training_file(
    file_path: str,
    purpose: str = "fine-tune",
    ctx: Context = None
) -> Dict[str, Any]:
    """
    Upload a training file to OpenAI.
    
    This tool uploads a file to OpenAI for use in fine-tuning.
    
    Args:
        file_path: Path to the file to upload
        purpose: Purpose of the file ('fine-tune')
        ctx: The Context object (automatically injected)
        
    Returns:
        File metadata including ID for use in fine-tuning
    """
    try:
        # Validate purpose
        valid_purposes = ["fine-tune", "assistants"]
        if purpose not in valid_purposes:
            error_msg = f"Invalid purpose: {purpose}. Must be one of: {', '.join(valid_purposes)}"
            ctx.error(error_msg)
            return {"error": error_msg}
        
        # Validate file path exists and is readable
        file_errors = validate_file_path(file_path)
        if file_errors:
            error_details = "; ".join(f"{k}: {v}" for k, v in file_errors.items())
            ctx.error(f"File validation failed: {error_details}")
            return {"error": f"File validation failed: {error_details}"}
        
        # Check file extension
        if not file_path.endswith(".jsonl"):
            ctx.warning(f"File {file_path} does not have a .jsonl extension, which is recommended for fine-tuning")
        
        # Get OpenAI client from context
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            ctx.warning("No OpenAI API key found in environment")
            return {"error": "OpenAI API key not available"}
        
        openai_client = OpenAIClient(api_key=api_key)
        
        # Validate the file content before uploading
        validation_result = openai_client.validate_training_data(file_path)
        if not validation_result.get("valid", False):
            issues = validation_result.get('issues', [])
            issue_str = "\n- " + "\n- ".join(issues) if issues else ""
            ctx.warning(f"File content validation failed:{issue_str}")
            return {
                "error": "File content validation failed",
                "validation_result": validation_result
            }
            
        # Upload the file
        ctx.info(f"Uploading file {file_path} for {purpose}")
        response = await openai_client.upload_file(file_path, purpose)
        
        return {
            "file_id": response.get("id"),
            "filename": response.get("filename"),
            "bytes": response.get("bytes"),
            "created_at": response.get("created_at"),
            "status": response.get("status")
        }
        
    except FileNotFoundError as e:
        ctx.error(f"File not found: {str(e)}")
        return {"error": f"File not found: {str(e)}"}
    except PermissionError as e:
        ctx.error(f"Permission denied when accessing the file: {str(e)}")
        return {"error": f"Permission denied: {str(e)}"}
    except Exception as e:
        ctx.error(f"Error uploading file: {str(e)}")
        return {"error": f"Upload failed: {str(e)}"}

@mcp.tool()
async def start_fine_tuning_job(
    training_file_id: str,
    model: str = "o4-mini-2025-04-16",
    validation_file_id: Optional[str] = None,
    hyperparameters: Optional[Dict[str, Any]] = None,
    suffix: Optional[str] = None,
    ctx: Context = None
) -> Dict[str, Any]:
    """
    Start a fine-tuning job.
    
    This tool creates a new fine-tuning job with the specified parameters.
    
    Args:
        training_file_id: The ID of the training data file
        model: The base model to fine-tune (only o4-mini-2025-04-16 is supported)
        validation_file_id: Optional ID of the validation data file
        hyperparameters: Hyperparameters for fine-tuning - at least one is required for o4-mini-2025-04-16
                         If not provided, defaults to n_epochs=3
        suffix: Optional suffix for the fine-tuned model name
        ctx: The Context object (automatically injected)
        
    Returns:
        Fine-tuning job details
    """
    try:
        # Validate model
        if not validate_model(model):
            supported_models = ", ".join(SUPPORTED_BASE_MODELS)
            error_msg = f"Unsupported model: {model}. Supported models: {supported_models}"
            ctx.error(error_msg)
            return {"error": error_msg}
        
        # Validate training_file_id
        if not training_file_id or not training_file_id.strip():
            error_msg = "Training file ID is required and cannot be empty"
            ctx.error(error_msg)
            return {"error": error_msg}
        
        # Validate hyperparameters if provided
        if hyperparameters:
            hyperparameter_errors = validate_hyperparameters(hyperparameters)
            if hyperparameter_errors:
                error_details = "; ".join(f"{k}: {v}" for k, v in hyperparameter_errors.items())
                ctx.error(f"Hyperparameter validation failed: {error_details}")
                return {"error": f"Hyperparameter validation failed: {error_details}"}
        
        # Validate suffix if provided
        if suffix:
            if not isinstance(suffix, str):
                error_msg = "Suffix must be a string"
                ctx.error(error_msg)
                return {"error": error_msg}
            if len(suffix) > 40:
                error_msg = "Suffix must be 40 characters or less"
                ctx.error(error_msg)
                return {"error": error_msg}
        
        # Get OpenAI client from context
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            ctx.warning("No OpenAI API key found in environment")
            return {"error": "OpenAI API key not available"}
        
        openai_client = OpenAIClient(api_key=api_key)
        
        # Create the fine-tuning job
        ctx.info(f"Starting fine-tuning job with model {model}")
        job = await openai_client.create_fine_tuning_job(
            training_file_id=training_file_id,
            model=model,
            validation_file_id=validation_file_id,
            hyperparameters=hyperparameters,
            suffix=suffix
        )
        
        ctx.info(f"Fine-tuning job created with ID: {job.get('id')}")
        
        return {
            "job_id": job.get("id"),
            "model": job.get("model"),
            "created_at": job.get("created_at"),
            "status": job.get("status"),
            "fine_tuned_model": job.get("fine_tuned_model")
        }
        
    except ValueError as e:
        ctx.error(f"Invalid parameter value: {str(e)}")
        return {"error": f"Invalid parameter: {str(e)}"}
    except Exception as e:
        ctx.error(f"Error starting fine-tuning job: {str(e)}")
        return {"error": f"Job creation failed: {str(e)}"}


@mcp.tool()
async def get_fine_tuning_job_status(
    job_id: str,
    ctx: Context = None
) -> Dict[str, Any]:
    """
    Get the status of a fine-tuning job.
    
    This tool retrieves information about a specific fine-tuning job.
    
    Args:
        job_id: The ID of the fine-tuning job
        ctx: The Context object (automatically injected)
        
    Returns:
        Fine-tuning job details
    """
    try:
        # Validate job_id
        if not job_id or not job_id.strip():
            error_msg = "Job ID is required and cannot be empty"
            ctx.error(error_msg)
            return {"error": error_msg}
        
        # Get OpenAI client from context
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            ctx.warning("No OpenAI API key found in environment")
            return {"error": "OpenAI API key not available"}
        
        openai_client = OpenAIClient(api_key=api_key)
        
        # Get the job details
        ctx.info(f"Fetching status for job {job_id}")
        job = await openai_client.get_fine_tuning_job(job_id)
        
        if not job:
            error_msg = f"No job found with ID: {job_id}"
            ctx.error(error_msg)
            return {"error": error_msg}
        
        # Get recent events
        events = await openai_client.list_fine_tuning_events(job_id, limit=10)
        
        return {
            "job_id": job.get("id"),
            "model": job.get("model"),
            "created_at": job.get("created_at"),
            "finished_at": job.get("finished_at"),
            "status": job.get("status"),
            "fine_tuned_model": job.get("fine_tuned_model"),
            "events": events
        }
        
    except ValueError as e:
        ctx.error(f"Invalid job ID format: {str(e)}")
        return {"error": f"Invalid job ID: {str(e)}"}
    except Exception as e:
        ctx.error(f"Error fetching job status: {str(e)}")
        return {"error": f"Status retrieval failed: {str(e)}"}


@mcp.tool()
async def list_fine_tuning_jobs(
    limit: int = 10,
    ctx: Context = None
) -> Dict[str, Any]:
    """
    List fine-tuning jobs.
    
    This tool lists recent fine-tuning jobs.
    
    Args:
        limit: Maximum number of jobs to return
        ctx: The Context object (automatically injected)
        
    Returns:
        List of fine-tuning jobs
    """
    try:
        # Validate limit
        if not isinstance(limit, int):
            error_msg = f"Limit must be an integer, got {type(limit).__name__}"
            ctx.error(error_msg)
            return {"error": error_msg}
        
        if limit < 1 or limit > 100:
            error_msg = f"Limit must be between 1 and 100, got {limit}"
            ctx.error(error_msg)
            return {"error": error_msg}
        
        # Get OpenAI client from context
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            ctx.warning("No OpenAI API key found in environment")
            return {"error": "OpenAI API key not available"}
        
        openai_client = OpenAIClient(api_key=api_key)
        
        # List the jobs
        ctx.info(f"Listing up to {limit} fine-tuning jobs")
        jobs = await openai_client.list_fine_tuning_jobs(limit=limit)
        
        return {
            "jobs": jobs,
            "count": len(jobs)
        }
        
    except ValueError as e:
        ctx.error(f"Invalid parameter value: {str(e)}")
        return {"error": f"Invalid parameter: {str(e)}"}
    except Exception as e:
        ctx.error(f"Error listing fine-tuning jobs: {str(e)}")
        return {"error": f"Job listing failed: {str(e)}"}


@mcp.tool()
async def cancel_fine_tuning_job(
    job_id: str,
    ctx: Context = None
) -> Dict[str, Any]:
    """
    Cancel a fine-tuning job.
    
    This tool cancels a fine-tuning job that is in progress.
    
    Args:
        job_id: The ID of the fine-tuning job to cancel
        ctx: The Context object (automatically injected)
        
    Returns:
        Cancellation confirmation
    """
    try:
        # Validate job_id
        if not job_id or not job_id.strip():
            error_msg = "Job ID is required and cannot be empty"
            ctx.error(error_msg)
            return {"error": error_msg}
        
        # Get OpenAI client from app context
        if ctx.app.openai_client:
            openai_client = ctx.app.openai_client
        else:
            # Fallback to creating a new client if not in app context
            openai_client = OpenAIClient(api_key=ctx.app.config.get("openai", {}).get("api_key"))
        
        # First check if the job exists and can be cancelled
        try:
            job = await openai_client.get_fine_tuning_job(job_id)
            if job.get("status") not in ["queued", "running", "validating_files"]:
                error_msg = f"Job with ID {job_id} has status '{job.get('status')}' and cannot be cancelled"
                ctx.warning(error_msg)
                return {"error": error_msg, "status": job.get("status")}
        except Exception as e:
            ctx.warning(f"Could not verify job status before cancellation: {str(e)}")
        
        # Cancel the job
        ctx.info(f"Cancelling fine-tuning job {job_id}")
        result = await openai_client.cancel_fine_tuning_job(job_id)
        
        return {
            "job_id": result.get("id"),
            "status": result.get("status"),
            "cancelled": True
        }
        
    except ValueError as e:
        ctx.error(f"Invalid job ID format: {str(e)}")
        return {"error": f"Invalid job ID: {str(e)}"}
    except Exception as e:
        ctx.error(f"Error cancelling fine-tuning job: {str(e)}")
        return {"error": f"Cancellation failed: {str(e)}"}


@mcp.tool()
async def list_fine_tuned_models(
    ctx: Context = None
) -> Dict[str, Any]:
    """
    List available fine-tuned models.
    
    This tool lists all available models, filtering for fine-tuned models.
    
    Args:
        ctx: The Context object (automatically injected)
        
    Returns:
        List of fine-tuned models
    """
    try:
        # Get OpenAI client from context
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            ctx.warning("No OpenAI API key found in environment")
            return {"error": "OpenAI API key not available"}
        
        openai_client = OpenAIClient(api_key=api_key)
        
        # List all models
        ctx.info("Listing all available models")
        all_models = await openai_client.list_models()
        
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
        ctx.error(f"Error listing fine-tuned models: {str(e)}")
        return {"error": f"Model listing failed: {str(e)}"}


@mcp.tool()
async def delete_fine_tuned_model(
    model_id: str,
    ctx: Context = None
) -> Dict[str, Any]:
    """
    Delete a fine-tuned model.
    
    This tool deletes a fine-tuned model.
    
    Args:
        model_id: The ID of the fine-tuned model to delete
        ctx: The Context object (automatically injected)
        
    Returns:
        Deletion confirmation
    """
    try:
        # Validate model_id
        if not model_id or not model_id.strip():
            error_msg = "Model ID is required and cannot be empty"
            ctx.error(error_msg)
            return {"error": error_msg}
        
        # Check if it's actually a fine-tuned model
        if not (model_id.startswith("ft-") or ":ft-" in model_id):
            ctx.warning(f"Model ID {model_id} does not appear to be a fine-tuned model (should start with 'ft-' or contain ':ft-')")
        
        # Get OpenAI client from context
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            ctx.warning("No OpenAI API key found in environment")
            return {"error": "OpenAI API key not available"}
        
        openai_client = OpenAIClient(api_key=api_key)
        
        # Delete the model
        ctx.info(f"Deleting fine-tuned model {model_id}")
        result = await openai_client.delete_model(model_id)
        
        if not result.get("deleted", False):
            ctx.warning(f"Delete operation for model {model_id} returned 'deleted': false")
        
        return {
            "model_id": model_id,
            "deleted": result.get("deleted", False)
        }
        
    except ValueError as e:
        ctx.error(f"Invalid model ID format: {str(e)}")
        return {"error": f"Invalid model ID: {str(e)}"}
    except Exception as e:
        ctx.error(f"Error deleting fine-tuned model: {str(e)}")
        return {"error": f"Model deletion failed: {str(e)}"}