"""
Base classes for fine-tuning providers.

This module defines the abstract interface that all fine-tuning providers must implement,
as well as a registry for managing available providers.
"""

import abc
import logging
from typing import Any, Dict, List, Optional, Type, TypeVar, ClassVar

logger = logging.getLogger(__name__)

# Type variable for provider registration
T = TypeVar('T', bound='FineTuningProvider')


class FineTuningProvider(abc.ABC):
    """
    Abstract base class for fine-tuning providers.
    
    All provider implementations must inherit from this class and implement
    all abstract methods and properties.
    """
    
    @property
    @abc.abstractmethod
    def name(self) -> str:
        """
        Returns the name of the provider.
        
        This should be a unique identifier for the provider.
        
        Returns:
            str: The provider name
        """
        pass
    
    @abc.abstractmethod
    async def prepare_data(self, examples: List[Dict[str, Any]], format_type: str = "chat", 
                     output_file: Optional[str] = None) -> Dict[str, Any]:
        """
        Prepare training data for fine-tuning.
        
        Args:
            examples: List of training examples
            format_type: Format type (e.g., 'chat' or 'completion')
            output_file: Optional path to save the formatted data
            
        Returns:
            Dict[str, Any]: Validation results and file information if saved
        """
        pass
    
    @abc.abstractmethod
    async def upload_file(self, file_path: str, purpose: str = "fine-tune") -> Dict[str, Any]:
        """
        Upload a training file to the provider.
        
        Args:
            file_path: Path to the file to upload
            purpose: Purpose of the file (e.g., 'fine-tune')
            
        Returns:
            Dict[str, Any]: File metadata including ID for use in fine-tuning
        """
        pass
    
    @abc.abstractmethod
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
        pass
    
    @abc.abstractmethod
    async def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """
        Get the status of a fine-tuning job.
        
        Args:
            job_id: The ID of the fine-tuning job
            
        Returns:
            Dict[str, Any]: Fine-tuning job details
        """
        pass
    
    @abc.abstractmethod
    async def list_models(self) -> Dict[str, Any]:
        """
        List available fine-tuned models.
        
        Returns:
            Dict[str, Any]: List of fine-tuned models
        """
        pass
    
    @abc.abstractmethod
    async def cancel_job(self, job_id: str) -> Dict[str, Any]:
        """
        Cancel a fine-tuning job.
        
        Args:
            job_id: The ID of the fine-tuning job to cancel
            
        Returns:
            Dict[str, Any]: Cancellation confirmation
        """
        pass
    
    @abc.abstractmethod
    async def delete_model(self, model_id: str) -> Dict[str, Any]:
        """
        Delete a fine-tuned model.
        
        Args:
            model_id: The ID of the fine-tuned model to delete
            
        Returns:
            Dict[str, Any]: Deletion confirmation
        """
        pass


class ProviderRegistry:
    """
    Registry class for fine-tuning providers.
    
    This class provides a central registry for all available fine-tuning providers.
    It handles provider registration, discovery, and instantiation.
    """
    _providers: ClassVar[Dict[str, Type[FineTuningProvider]]] = {}
    
    @classmethod
    def register(cls, provider_class: Type[T]) -> Type[T]:
        """
        Register a provider class.
        
        This method can be used as a decorator for provider classes.
        
        Args:
            provider_class: The provider class to register
            
        Returns:
            The provider class (unchanged)
            
        Example:
            @ProviderRegistry.register
            class OpenAIProvider(FineTuningProvider):
                ...
        """
        provider_instance = provider_class()
        provider_name = provider_instance.name
        cls._providers[provider_name] = provider_class
        logger.info(f"Registered fine-tuning provider: {provider_name}")
        return provider_class
    
    @classmethod
    def get_provider(cls, name: str) -> Optional[Type[FineTuningProvider]]:
        """
        Get a provider class by name.
        
        Args:
            name: The name of the provider
            
        Returns:
            The provider class, or None if not found
        """
        return cls._providers.get(name)
    
    @classmethod
    def create_provider(cls, name: str, **kwargs) -> Optional[FineTuningProvider]:
        """
        Create a provider instance by name.
        
        Args:
            name: The name of the provider
            **kwargs: Additional arguments to pass to the provider constructor
            
        Returns:
            A provider instance, or None if not found
        """
        provider_class = cls.get_provider(name)
        if provider_class:
            return provider_class(**kwargs)
        return None
    
    @classmethod
    def list_providers(cls) -> List[str]:
        """
        List all registered providers.
        
        Returns:
            A list of provider names
        """
        return list(cls._providers.keys())