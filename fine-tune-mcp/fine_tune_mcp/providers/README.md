# Fine-Tuning Providers

This directory contains the provider interface and implementations for different fine-tuning services.

## Provider Interface

The abstract `FineTuningProvider` class defines the interface that all provider implementations must follow. This ensures a consistent API for fine-tuning operations regardless of which service is being used.

## Adding a New Provider

To add a new fine-tuning provider:

1. Create a new Python file for your provider (e.g., `your_provider.py`)
2. Implement the `FineTuningProvider` abstract class
3. Register your provider using the `ProviderRegistry.register` decorator

Example:

```python
from .base import FineTuningProvider, ProviderRegistry

@ProviderRegistry.register
class YourProvider(FineTuningProvider):
    @property
    def name(self) -> str:
        return "your-provider-name"
    
    async def prepare_data(self, examples, format_type="chat", output_file=None):
        # Implementation goes here
        pass
    
    async def upload_file(self, file_path, purpose="fine-tune"):
        # Implementation goes here
        pass
    
    async def start_fine_tuning(self, training_file_id, model, 
                           validation_file_id=None, hyperparameters=None, suffix=None):
        # Implementation goes here
        pass
    
    async def get_job_status(self, job_id):
        # Implementation goes here
        pass
    
    async def list_models(self):
        # Implementation goes here
        pass
    
    async def cancel_job(self, job_id):
        # Implementation goes here
        pass
    
    async def delete_model(self, model_id):
        # Implementation goes here
        pass
```

## Using Providers

Providers can be accessed and instantiated through the `ProviderRegistry`:

```python
from fine_tune_mcp.providers import ProviderRegistry

# Get a list of available providers
providers = ProviderRegistry.list_providers()

# Create a provider instance by name
provider = ProviderRegistry.create_provider("your-provider-name")

# Use the provider
result = await provider.prepare_data(examples)
```

## Available Providers

The following providers are currently available:

- [In progress] OpenAI Provider for OpenAI API fine-tuning