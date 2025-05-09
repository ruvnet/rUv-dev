"""
Main MCP server implementation.
This file initializes the FastMCP server and imports all tools, resources, and prompts.
"""

import os
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Optional
from pathlib import Path

# Import dotenv to load environment variables from .env file
from dotenv import load_dotenv

from mcp.server.fastmcp import Context, FastMCP

# Import config management and OpenAI integration
from .config import load_config
from .openai_integration import OpenAIClient


@dataclass
class AppContext:
    """
    Type-safe application context container.
    Store any application-wide state or connections here.
    """
    config: dict
    openai_client: Optional[OpenAIClient] = None


@asynccontextmanager
async def app_lifespan(server: FastMCP) -> AsyncIterator[AppContext]:
    """
    Application lifecycle manager.
    Handles startup and shutdown operations with proper resource management.
    
    Args:
        server: The FastMCP server instance
        
    Yields:
        The application context with initialized resources
    """
    # Load environment variables from .env file
    dotenv_path = Path(__file__).parent.parent / '.env'
    if dotenv_path.exists():
        print(f"📄 Loading environment variables from {dotenv_path}")
        load_dotenv(dotenv_path=dotenv_path)
    else:
        print("⚠️ No .env file found, environment variables may not be set correctly")
    
    # Load configuration
    config = load_config()
    
    # Initialize connections and resources
    print("🚀 Server starting up...")
    
    # Initialize OpenAI client if API key is available
    openai_client = None
    api_key = config.get("openai", {}).get("api_key") or os.environ.get("OPENAI_API_KEY")
    if api_key:
        print("✅ OpenAI API key found, initializing client")
        openai_client = OpenAIClient(api_key=api_key)
    else:
        print("⚠️  No OpenAI API key found, some functionality will be limited")
    
    try:
        # Create and yield the app context
        yield AppContext(config=config, openai_client=openai_client)
    finally:
        # Clean up resources on shutdown
        print("🛑 Server shutting down...")


# Create the MCP server with lifespan support
mcp = FastMCP(
    "fine-tune-mcp",  # Server name
    lifespan=app_lifespan,           # Lifecycle manager
    dependencies=["mcp>=1.0"],       # Required dependencies
)

# Import all tools, resources, and prompts
# These imports must come after the MCP server is initialized
from .tools.sample_tools import *
from .tools.fine_tuning_tools import *
from .resources.sample_resources import *
from .prompts.sample_prompts import *

# Make the server instance accessible to other modules
server = mcp

if __name__ == "__main__":
    # When executed directly, run the server
    mcp.run()