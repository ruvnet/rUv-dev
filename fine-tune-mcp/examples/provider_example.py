"""
Example demonstrating how to use the fine-tuning provider interface.
"""

import os
import asyncio
import logging
from typing import Dict, Any, List

from fine_tune_mcp.providers import (
    FineTuningProvider,
    ProviderRegistry,
    OpenAIProvider,
    get_default_provider
)

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


async def demonstrate_provider_usage():
    """
    Demonstrate how to use a fine-tuning provider.
    
    This example shows:
    1. Getting a provider by name
    2. Getting the default provider
    3. Using provider methods
    """
    # Example 1: Creating a provider directly
    openai_provider = OpenAIProvider()
    logger.info(f"Created provider: {openai_provider.name}")
    
    # Example 2: Getting a provider by name
    provider_by_name = ProviderRegistry.create_provider("openai")
    logger.info(f"Got provider by name: {provider_by_name.name if provider_by_name else 'None'}")
    
    # Example 3: Getting the default provider
    default_provider = get_default_provider()
    logger.info(f"Default provider: {default_provider.name if default_provider else 'None'}")
    
    # Example 4: Listing available providers
    providers = ProviderRegistry.list_providers()
    logger.info(f"Available providers: {providers}")


async def perform_fine_tuning_workflow(provider: FineTuningProvider):
    """
    Demonstrate a complete fine-tuning workflow.
    
    Args:
        provider: The fine-tuning provider to use
    """
    # This is a simulated workflow - in a real application,
    # you would use actual data and wait for jobs to complete
    
    # 1. Prepare training data
    examples = [
        {
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Hello, how are you?"},
                {"role": "assistant", "content": "I'm doing well, thank you for asking! How can I assist you today?"}
            ]
        },
        {
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "What's the weather like?"},
                {"role": "assistant", "content": "I don't have access to real-time weather information. To get accurate weather data, you could check a weather website or app, or tell me your location and I can suggest how you might find that information."}
            ]
        }
    ]
    
    logger.info("Preparing training data...")
    output_file = "examples/training_data.jsonl"
    result = await provider.prepare_data(examples, format_type="chat", output_file=output_file)
    logger.info(f"Data preparation result: {result}")
    
    # In a real application, you would:
    # 2. Upload the file
    # 3. Start fine-tuning
    # 4. Monitor the job status
    # 5. Use the fine-tuned model
    
    # For demonstration, we'll just log what these steps would look like:
    logger.info("In a complete workflow, you would:")
    logger.info("2. Upload the training file")
    logger.info("3. Start a fine-tuning job")
    logger.info("4. Monitor the job status until complete")
    logger.info("5. Use the fine-tuned model in your application")


async def main():
    """Main entry point."""
    logger.info("Starting provider example...")
    
    # Basic provider usage
    await demonstrate_provider_usage()
    
    # Complete workflow example
    default_provider = get_default_provider()
    if default_provider:
        # Only run the workflow if the OPENAI_API_KEY is available
        if os.environ.get("OPENAI_API_KEY"):
            logger.info("\nDemonstrating complete workflow...")
            try:
                await perform_fine_tuning_workflow(default_provider)
            except Exception as e:
                logger.error(f"Error in workflow: {str(e)}")
        else:
            logger.warning("\nSkipping workflow demonstration: OPENAI_API_KEY not set")
    else:
        logger.error("\nCould not get default provider")
    
    logger.info("Example complete")


if __name__ == "__main__":
    # Run the async main function
    asyncio.run(main())