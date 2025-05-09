"""
Sample MCP prompts implementation.
This file contains example prompt templates to demonstrate different patterns.
"""

from .. import server
from ..server import mcp
from mcp.server.fastmcp.prompts import base


@mcp.prompt()
def simple_prompt(query: str) -> str:
    """
    A simple text prompt.
    
    This demonstrates the simplest form of prompt that returns a string template.
    
    Args:
        query: The user's query or input
        
    Returns:
        A formatted prompt string
    """
    return f"""
    Please provide a detailed answer to the following question:
    
    {query}
    
    Take your time to think step by step and provide a comprehensive response.
    """


@mcp.prompt()
def structured_prompt(code: str, language: str = "python") -> list[base.Message]:
    """
    A more structured prompt using Message objects.
    
    This demonstrates how to create a structured conversation prompt with
    multiple messages in a sequence.
    
    Args:
        code: The code to review
        language: The programming language of the code
        
    Returns:
        A list of prompt messages
    """
    return [
        base.UserMessage(f"I need help reviewing this {language} code:"),
        base.UserMessage(f"```{language}\n{code}\n```"),
        base.AssistantMessage("I'll analyze this code for you. What specific aspects would you like me to focus on?"),
        base.UserMessage("Please focus on code quality, potential bugs, and performance issues.")
    ]


@mcp.prompt()
def data_analysis_prompt(data: str, objective: str) -> list[base.Message]:
    """
    A prompt for data analysis tasks.
    
    This demonstrates a more complex prompt for data analysis.
    
    Args:
        data: The data to analyze
        objective: The analysis objective
        
    Returns:
        A list of prompt messages
    """
    return [
        base.UserMessage("I need help analyzing some data."),
        base.UserMessage(f"Objective: {objective}"),
        base.UserMessage("Here's the data:"),
        base.UserMessage(data),
        base.UserMessage("Please analyze this data and provide insights that address my objective.")
    ]


@mcp.prompt()
def image_analysis_prompt(image_description: str, analysis_type: str = "general") -> str:
    """
    A prompt for image analysis.
    
    This demonstrates a prompt that could be used with image data.
    
    Args:
        image_description: A description of the image
        analysis_type: The type of analysis to perform
        
    Returns:
        A formatted prompt string
    """
    analysis_instructions = {
        "general": "Provide a general description and analysis of what you see in the image.",
        "technical": "Provide a technical analysis of the image, focusing on composition, lighting, and techniques used.",
        "content": "Analyze the content of the image, identifying objects, people, and activities.",
        "sentiment": "Analyze the mood and emotional impact of the image."
    }
    
    instruction = analysis_instructions.get(
        analysis_type, 
        analysis_instructions["general"]
    )
    
    return f"""
    I'm showing you an image with the following description:
    
    {image_description}
    
    {instruction}
    """