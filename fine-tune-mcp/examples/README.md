# Fine-Tuning MCP Examples

This directory contains example scripts demonstrating how to use the Fine-Tuning MCP library.

## Provider Example

The `provider_example.py` script demonstrates how to use the provider interface for fine-tuning models:

```bash
# Set your OpenAI API key
export OPENAI_API_KEY=your_api_key_here

# Run the example
cd fine-tune-mcp
python -m examples.provider_example
```

This example demonstrates:

1. Creating providers using different methods
2. Using the provider registry to find and create provider instances 
3. A simulated fine-tuning workflow (data preparation, upload, etc.)

## Setting a Custom Provider

You can specify a custom provider using the `FINE_TUNE_PROVIDER` environment variable:

```bash
export FINE_TUNE_PROVIDER=openai
python -m examples.provider_example
```

## Available Providers

Currently implemented providers:

- `openai`: OpenAI API fine-tuning

## Adding Your Own Provider

To add your own provider, implement the `FineTuningProvider` abstract class and register it with the `ProviderRegistry`. See the [providers README](../fine_tune_mcp/providers/README.md) for more details.