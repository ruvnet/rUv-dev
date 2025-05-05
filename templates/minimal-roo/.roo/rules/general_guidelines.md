# General Guidelines for Roo Modes

## Core Principles

1. **Modularity**
   - Keep components small and focused on specific responsibilities
   - Break large tasks into smaller, manageable subtasks
   - Use `new_task` to delegate specialized work to appropriate modes

2. **Security**
   - Never hardcode secrets or environment variables
   - Use environment abstractions for configuration
   - Implement proper validation for all inputs

3. **Maintainability**
   - Keep files under 500 lines
   - Document code and configuration
   - Follow consistent naming conventions
   - Use clear, descriptive variable and function names

4. **Extensibility**
   - Design for future expansion
   - Use interfaces and abstractions
   - Document extension points

## Workflow Guidelines

1. **Task Planning**
   - Break down complex tasks into clear steps
   - Identify dependencies and prerequisites
   - Determine the appropriate mode for each subtask

2. **Implementation**
   - Follow mode-specific guidelines
   - Use appropriate tools for each task
   - Validate results at each step

3. **Completion**
   - Use `attempt_completion` to finalize tasks
   - Provide clear summaries of completed work
   - Document any remaining tasks or known issues

## Tool Usage

1. **File Operations**
   - Use `read_file` to examine existing files
   - Use `write_to_file` for creating new files
   - Use `list_files` to explore directory structures

2. **Code Editing**
   - Use `apply_diff` for precise code modifications
   - Use `insert_content` for adding new content to existing files
   - Use `search_and_replace` only when necessary

3. **Project Management**
   - Use `execute_command` for running system commands
   - Use `ask_followup_question` when clarification is needed
   - Use `attempt_completion` to finalize tasks

4. **MCP Integration**
   - Use `use_mcp_tool` for MCP server operations
   - Use `access_mcp_resource` for accessing MCP resources

## Best Practices

1. Always verify file existence before attempting modifications
2. Include complete parameters for all tool operations
3. Implement proper error handling for all operations
4. Document all configuration options and extension points
5. Follow the principle of least privilege for all operations