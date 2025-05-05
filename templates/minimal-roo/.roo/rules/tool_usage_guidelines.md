# Tool Usage Guidelines

This document provides detailed guidelines for using the various tools available in Roo modes.

## File Operations

### read_file
```xml
<read_file>
  <path>File path here</path>
</read_file>
```

- **Purpose**: Read the contents of a file
- **Required Parameters**:
  - `path`: The path to the file to read
- **Best Practices**:
  - Always check if a file exists before attempting to modify it
  - Use `read_file` before `apply_diff` or `search_and_replace` to verify content

### write_to_file
```xml
<write_to_file>
  <path>File path here</path>
  <content>
    Your file content here

### list_files
```xml
<list_files>
  <path>Directory path here</path>
  <recursive>true/false</recursive>
</list_files>
```

- **Purpose**: List files in a directory
- **Required Parameters**:
  - `path`: The path to the directory to list
- **Optional Parameters**:
  - `recursive`: Whether to list files recursively (true/false)
- **Best Practices**:
  - Use to explore directory structures
  - Set recursive to true for complete directory listings

## Code Editing

### apply_diff
```xml
<apply_diff>
  <path>File path here</path>
  <diff>
    <<<<<<< SEARCH
    Original code
    =======
    Updated code
    >>>>>>> REPLACE
  </diff>
</apply_diff>
```

- **Purpose**: Make precise modifications to existing files
- **Required Parameters**:
  - `path`: The path to the file to modify
  - `diff`: The search and replace content
- **Best Practices**:
  - Use for precise code modifications
  - Always include complete SEARCH and REPLACE blocks
  - Verify the search text exists in the file first

### insert_content
```xml
<insert_content>
  <path>File path here</path>
  <line>Line number</line>
  <content>
    New content to insert

- Implement appropriate validation for all inputs and outputs
  - Document all integration points and dependencies

### access_mcp_resource
```xml
<access_mcp_resource>
  <server_name>Server name here</server_name>
  <uri>resource://path/to/resource</uri>
</access_mcp_resource>
```

- **Purpose**: Access a resource provided by an MCP server
- **Required Parameters**:
  - `server_name`: The name of the MCP server
  - `uri`: The URI of the resource to access
- **Best Practices**:
  - Use proper error handling for all resource access
  - Implement appropriate validation for all inputs and outputs
  - Document all resource dependencies

## Project Management

### execute_command
```xml
<execute_command>
  <command>Command to execute</command>
</execute_command>
```

- **Purpose**: Execute a command on the system
- **Required Parameters**:
  - `command`: The command to execute
- **Best Practices**:
  - Use for system operations and testing
  - Provide clear explanations of what commands do
  - Handle command output appropriately

### attempt_completion
```xml
<attempt_completion>
  <result>
    Description of completed work
  </result>
  <command>Optional command to demonstrate result</command>
</attempt_completion>
```

- **Purpose**: Finalize tasks and present results
- **Required Parameters**:
  - `result`: Description of the completed work
- **Optional Parameters**:
  - `command`: Command to demonstrate the result
- **Best Practices**:
  - Use to finalize tasks
  - Provide clear summaries of completed work
  - Include demonstration commands when appropriate
