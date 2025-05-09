"""
Tests for the provider interface.
"""

import pytest
import asyncio
from typing import Dict, Any, List, Optional
from unittest.mock import MagicMock

from fine_tune_mcp.providers.base import FineTuningProvider, ProviderRegistry


class TestProviderRegistry:
    """Tests for the ProviderRegistry class."""

    def test_register_provider(self):
        """Test registering a provider."""
        # Create a mock provider class
        mock_provider = MagicMock(spec=FineTuningProvider)
        mock_provider.name = "test-provider"
        
        # Initially, our test provider should not be registered
        assert "test-provider" not in ProviderRegistry.list_providers()
        
        # Save the original providers to restore later
        original_providers = ProviderRegistry._providers.copy()
        
        try:
            # Register a provider class
            ProviderRegistry._providers["test-provider"] = mock_provider
            
            # Verify it was registered
            assert "test-provider" in ProviderRegistry.list_providers()
            assert ProviderRegistry.get_provider("test-provider") == mock_provider
        finally:
            # Restore original providers
            ProviderRegistry._providers = original_providers

    def test_create_provider(self):
        """Test creating a provider instance."""
        # Save the original providers to restore later
        original_providers = ProviderRegistry._providers.copy()
        
        # Define a test provider class
        class TestProvider(FineTuningProvider):
            def __init__(self, config=None):
                self.config = config or {}

            @property
            def name(self) -> str:
                return "test-provider"
                
            async def prepare_data(self, examples, format_type="chat", output_file=None):
                return {"result": "prepared"}
                
            async def upload_file(self, file_path, purpose="fine-tune"):
                return {"result": "uploaded"}
                
            async def start_fine_tuning(self, training_file_id, model, 
                                   validation_file_id=None, hyperparameters=None, suffix=None):
                return {"result": "started"}
                
            async def get_job_status(self, job_id):
                return {"result": "status"}
                
            async def list_models(self):
                return {"result": "models"}
                
            async def cancel_job(self, job_id):
                return {"result": "cancelled"}
                
            async def delete_model(self, model_id):
                return {"result": "deleted"}
        
        try:
            # Register the test provider
            ProviderRegistry._providers["test-provider"] = TestProvider
            
            # Create an instance with custom config
            provider = ProviderRegistry.create_provider("test-provider", config={"key": "value"})
            
            # Verify instance was created with the config
            assert provider is not None
            assert isinstance(provider, TestProvider)
            assert provider.config == {"key": "value"}
            
            # Test that an unknown provider returns None
            assert ProviderRegistry.create_provider("unknown-provider") is None
            
        finally:
            # Restore original providers
            ProviderRegistry._providers = original_providers


class TestProviderInterface:
    """Tests for the FineTuningProvider interface."""
    
    def test_provider_registration_decorator(self):
        """Test the provider registration decorator."""
        # Save the original providers to restore later
        original_providers = ProviderRegistry._providers.copy()
        
        try:
            # Define a test provider using the decorator
            @ProviderRegistry.register
            class DecoratedProvider(FineTuningProvider):
                @property
                def name(self) -> str:
                    return "decorated-provider"
                    
                async def prepare_data(self, examples, format_type="chat", output_file=None):
                    return {"result": "prepared"}
                    
                async def upload_file(self, file_path, purpose="fine-tune"):
                    return {"result": "uploaded"}
                    
                async def start_fine_tuning(self, training_file_id, model, 
                                       validation_file_id=None, hyperparameters=None, suffix=None):
                    return {"result": "started"}
                    
                async def get_job_status(self, job_id):
                    return {"result": "status"}
                    
                async def list_models(self):
                    return {"result": "models"}
                    
                async def cancel_job(self, job_id):
                    return {"result": "cancelled"}
                    
                async def delete_model(self, model_id):
                    return {"result": "deleted"}
            
            # Verify it was registered
            assert "decorated-provider" in ProviderRegistry.list_providers()
            assert ProviderRegistry.get_provider("decorated-provider") == DecoratedProvider
            
        finally:
            # Restore original providers
            ProviderRegistry._providers = original_providers