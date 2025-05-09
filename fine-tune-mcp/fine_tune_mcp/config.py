"""
Configuration management for the MCP server.
Handles loading configuration from environment variables and/or config files.
"""

import os
import json
from pathlib import Path
from typing import Dict, Any, Optional


def load_config(config_path: Optional[str] = None) -> Dict[str, Any]:
    """
    Load configuration from environment variables and/or config file.
    
    Environment variables with the prefix MCP_ are automatically included
    in the configuration (with the prefix removed and name lowercased).
    
    Args:
        config_path: Optional path to a JSON config file
        
    Returns:
        A dictionary containing configuration values
    """
    # Start with empty config
    config = {
        "server": {
            "name": "fine-tune-mcp",
            "version": "0.1.0"
        }
    }
    
    # Load from file if provided
    if config_path:
        config_file = Path(config_path)
        if config_file.exists():
            try:
                with open(config_file, 'r') as f:
                    file_config = json.load(f)
                    # Deep merge configs
                    _deep_merge(config, file_config)
            except Exception as e:
                print(f"Warning: Failed to load config file: {e}")
    
    # Also check for config file path from environment
    env_config_path = os.environ.get("MCP_CONFIG_FILE")
    if env_config_path and env_config_path != config_path:
        try:
            with open(env_config_path, 'r') as f:
                file_config = json.load(f)
                # Deep merge configs
                _deep_merge(config, file_config)
        except Exception as e:
            print(f"Warning: Failed to load config file from environment: {e}")
    
    # Override with environment variables (convert MCP_* to config entries)
    env_config = {}
    for key, value in os.environ.items():
        if key.startswith('MCP_') and key != "MCP_CONFIG_FILE":
            # Remove MCP_ prefix, convert to lowercase, and split by double underscore
            config_key_parts = key[4:].lower().split('__')
            
            # Convert to nested dictionaries
            current = env_config
            for part in config_key_parts[:-1]:
                if part not in current:
                    current[part] = {}
                current = current[part]
            
            # Try to convert value to appropriate type
            value = _convert_value(value)
            
            # Set the value
            current[config_key_parts[-1]] = value
    
    # Merge environment config
    _deep_merge(config, env_config)
    
    return config


def _convert_value(value: str) -> Any:
    """
    Try to convert a string value to an appropriate type.
    
    Args:
        value: The string value to convert
        
    Returns:
        The converted value
    """
    # Handle booleans
    if value.lower() in ('true', 'yes', '1'):
        return True
    if value.lower() in ('false', 'no', '0'):
        return False
    
    # Handle null
    if value.lower() in ('null', 'none'):
        return None
    
    # Handle numbers
    try:
        # Try as int
        return int(value)
    except ValueError:
        try:
            # Try as float
            return float(value)
        except ValueError:
            # Keep as string
            return value


def _deep_merge(target: Dict[str, Any], source: Dict[str, Any]) -> None:
    """
    Deep merge two dictionaries.
    
    Args:
        target: The target dictionary to merge into
        source: The source dictionary to merge from
    """
    for key, value in source.items():
        if key in target and isinstance(target[key], dict) and isinstance(value, dict):
            # Recursively merge dictionaries
            _deep_merge(target[key], value)
        else:
            # Otherwise, simply overwrite the value
            target[key] = value