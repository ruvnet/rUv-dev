"""
Sample MCP tools implementation.
This file contains example tool implementations to demonstrate different patterns.
"""

from .. import server
from ..server import mcp, Context
import asyncio


@mcp.tool()
def echo(message: str) -> str:
    """
    Echo a message back.
    
    This is a simple example tool that echoes a message back to the caller.
    
    Args:
        message: The message to echo back
        
    Returns:
        The same message that was provided
    """
    return f"Echo: {message}"


@mcp.tool()
async def calculate(a: float, b: float, operation: str = "add") -> float:
    """
    Perform a calculation on two numbers.
    
    This is an example of a tool that performs calculations with multiple parameters
    and a default value.
    
    Args:
        a: First number
        b: Second number
        operation: The operation to perform (add, subtract, multiply, divide)
        
    Returns:
        The result of the calculation
    """
    if operation == "add":
        return a + b
    elif operation == "subtract":
        return a - b
    elif operation == "multiply":
        return a * b
    elif operation == "divide":
        if b == 0:
            raise ValueError("Cannot divide by zero")
        return a / b
    else:
        raise ValueError(f"Unknown operation: {operation}")


@mcp.tool()
async def long_task(iterations: int, ctx: Context) -> str:
    """
    A long-running task that reports progress.
    
    This example demonstrates how to use the Context object to report progress
    during a long-running operation.
    
    Args:
        iterations: Number of iterations to perform
        ctx: The Context object (automatically injected)
        
    Returns:
        A completion message
    """
    # Log the start of the operation
    ctx.info(f"Starting long task with {iterations} iterations")
    
    for i in range(iterations):
        # Log progress for debugging
        ctx.debug(f"Processing iteration {i+1}/{iterations}")
        
        # Report progress to the client
        await ctx.report_progress(
            i,
            iterations,
            message=f"Processing iteration {i+1}/{iterations}"
        )
        
        # Simulate work
        await asyncio.sleep(0.1)
    
    # Log completion
    ctx.info("Long task completed")
    
    return f"Completed {iterations} iterations"


@mcp.tool()
async def fetch_data(url: str, ctx: Context) -> str:
    """
    Fetch data from a URL.
    
    This example demonstrates how to make HTTP requests and handle errors.
    
    Args:
        url: The URL to fetch data from
        ctx: The Context object (automatically injected)
        
    Returns:
        The fetched data or an error message
    """
    import httpx
    
    try:
        # Log the request
        ctx.info(f"Fetching data from {url}")
        
        # Make the HTTP request
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            response.raise_for_status()
            
            # Return the response text
            return response.text
    except httpx.RequestError as e:
        # Handle connection errors
        error_msg = f"Connection error: {str(e)}"
        ctx.error(error_msg)
        return error_msg
    except httpx.HTTPStatusError as e:
        # Handle HTTP errors
        error_msg = f"HTTP error {e.response.status_code}: {e.response.reason_phrase}"
        ctx.error(error_msg)
        return error_msg
    except Exception as e:
        # Handle unexpected errors
        error_msg = f"Unexpected error: {str(e)}"
        ctx.error(error_msg)
        return error_msg