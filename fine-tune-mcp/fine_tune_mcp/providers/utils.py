"""
Utility functions for working with fine-tuning providers.
"""

import os
import logging
from typing import Optional

from .base import FineTuningProvider, ProviderRegistry

logger = logging.getLogger(__name__)


def get_default_provider() -> Optional[FineTuningProvider]:
    """
    Get the default fine-tuning provider based on environment configuration.
    
    This function will attempt to create a provider instance based on the
    FINE_TUNE_PROVIDER environment variable. If not set, it defaults to 'openai'.
    
    Returns:
        A provider instance, or None if the provider could not be created
    """
    provider_name = os.environ.get("FINE_TUNE_PROVIDER", "openai")
    
    try:
        provider = ProviderRegistry.create_provider(provider_name)
        if not provider:
            logger.warning(f"Provider '{provider_name}' not found, falling back to 'openai'")
            provider = ProviderRegistry.create_provider("openai")
            
        return provider
    except Exception as e:
        logger.error(f"Error creating provider '{provider_name}': {str(e)}")
        return None