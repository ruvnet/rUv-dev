"""
Sample MCP resources implementation.
This file contains example resource implementations to demonstrate different patterns.
"""

from .. import server
from ..server import mcp
import json
import datetime


@mcp.resource("static://example")
def static_resource() -> str:
    """
    An example static resource.
    
    This demonstrates a basic static resource that always returns the same content.
    
    Returns:
        The static content
    """
    return """
    # Example Static Resource
    
    This is an example of a static resource that returns the same content every time.
    
    * It can contain Markdown
    * With lists
    * And other formatting
    
    ```python
    # Even code blocks
    def hello():
        return "world"
    ```
    """


@mcp.resource("dynamic://{parameter}")
def dynamic_resource(parameter: str) -> str:
    """
    An example dynamic resource with a parameter.
    
    This demonstrates how to create a parameterized resource with a dynamic URI.
    
    Args:
        parameter: A parameter extracted from the URI
        
    Returns:
        Content based on the parameter
    """
    return f"""
    # Dynamic Resource: {parameter}
    
    This resource was generated with the parameter: **{parameter}**
    
    Current time: {datetime.datetime.now().isoformat()}
    """


@mcp.resource("config://{section}")
def config_resource(section: str) -> str:
    """
    An example resource that uses the app context.
    
    This demonstrates how to access the app context in a resource.
    
    Args:
        section: The configuration section to return
        
    Returns:
        The configuration section content
    """
    # Access the app context
    ctx = mcp.get_request_context()
    config = ctx.lifespan_context.config
    
    # Check if the section exists
    if section in config:
        return f"""
        # Configuration: {section}
        
        ```json
        {json.dumps(config[section], indent=2)}
        ```
        """
    else:
        return f"""
        # Configuration: {section}
        
        Section not found. Available sections:
        
        {', '.join(config.keys()) if config else 'No configuration sections available'}
        """


@mcp.resource("file://{path}.md")
def file_resource(path: str) -> str:
    """
    An example resource that reads from the filesystem.
    
    This demonstrates how to create a resource that reads from the filesystem.
    Note: In production, you should validate the path and restrict access.
    
    Args:
        path: The file path
        
    Returns:
        The file content
    """
    import os
    from pathlib import Path
    
    # For security, restrict to a subdirectory
    base_dir = os.environ.get("RESOURCE_DIR", "resources")
    file_path = Path(base_dir) / f"{path}.md"
    
    # Validate the path (prevent directory traversal)
    if not file_path.is_file() or ".." in path:
        return f"File not found: {path}.md"
    
    # Read and return the file content
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        return f"Error reading file: {str(e)}"