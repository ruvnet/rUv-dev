# Provider Interface Implementation

This document describes the implementation of the provider interface for fine-tuning models.

## Overview

The provider interface abstracts the fine-tuning process, allowing different fine-tuning services to be used interchangeably with a consistent API. This makes it easier to:

1. Switch between different fine-tuning providers
2. Support multiple fine-tuning providers in the same application
3. Test and experiment with different fine-tuning services

## Core Components

### 1. `FineTuningProvider` Abstract Base Class

The `FineTuningProvider` class defines the interface that all providers must implement. It includes methods for:

- Preparing training data
- Uploading files
- Starting fine-tuning jobs
- Checking job status
- Listing models
- Cancelling jobs
- Deleting models

### 2. `ProviderRegistry` Class

The `ProviderRegistry` manages provider classes, providing methods to:

- Register provider classes
- Look up providers by name
- Create provider instances
- List available providers

### 3. Provider Implementations

Each provider implementation extends the `FineTuningProvider` class and implements the required methods. Currently implemented providers:

- `OpenAIProvider`: Uses the OpenAI API for fine-tuning

### 4. Utility Functions

The `utils.py` module provides helper functions for working with providers:

- `get_default_provider()`: Returns a provider instance based on configuration

## Usage

### Basic Usage

```python
from fine_tune_mcp.providers import get_default_provider

# Get the default provider
provider = get_default_provider()

# Use the provider
result = await provider.prepare_data(examples, format_type="chat")
```

### Using a Specific Provider

```python
from fine_tune_mcp.providers import ProviderRegistry

# Create a provider by name
provider = ProviderRegistry.create_provider("openai")

# Use the provider
result = await provider.prepare_data(examples, format_type="chat")
```

### Implementing a New Provider

To add a new provider:

1. Create a new file in the `providers` directory
2. Implement the `FineTuningProvider` abstract class
3. Register the provider using the `ProviderRegistry.register` decorator

Example:

```python
from fine_tune_mcp.providers.base import FineTuningProvider, ProviderRegistry

@ProviderRegistry.register
class MyProvider(FineTuningProvider):
    @property
    def name(self) -> str:
        return "my-provider"
        
    # Implement the required methods...
```

## Configuration

The provider system can be configured through environment variables:

- `FINE_TUNE_PROVIDER`: The name of the default provider to use (defaults to "openai")
- Provider-specific variables (e.g., `OPENAI_API_KEY` for the OpenAI provider)

## Testing

The provider interface includes unit tests that verify:

1. Provider registration
2. Provider creation
3. The registration decorator

Run the tests with:

```bash
python -m pytest tests/unit/test_provider_interface.py
```

## Example

See the `examples/provider_example.py` file for a complete example of using the provider interface.