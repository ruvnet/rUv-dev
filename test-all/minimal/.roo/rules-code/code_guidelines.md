# Code Guidelines for Roo Modes

## Code Quality Standards

1. **Clean Code**
   - Use descriptive variable and function names
   - Keep functions small and focused (≤ 50 lines)
   - Maintain consistent formatting and indentation
   - Minimize nesting and complexity

2. **SOLID Principles**
   - **S**ingle Responsibility: Each module/class should have one reason to change
   - **O**pen/Closed: Open for extension, closed for modification
   - **L**iskov Substitution: Subtypes must be substitutable for their base types
   - **I**nterface Segregation: Many specific interfaces are better than one general interface
   - **D**ependency Inversion: Depend on abstractions, not concretions

3. **DRY (Don't Repeat Yourself)**
   - Eliminate code duplication through abstraction
   - Create reusable components and utilities
   - Centralize common functionality

4. **Error Handling**
   - Implement proper error handling for all operations
   - Provide clear error messages
   - Fail gracefully with informative feedback

## File Structure

1. **Size Limits**
   - Keep files under 500 lines
   - Split large components into smaller, focused modules
   - Use logical file organization

2. **Organization**
   - Group related files in directories
   - Use consistent naming conventions
   - Separate concerns (e.g., UI, logic, data)

## Environment and Configuration

1. **No Hardcoded Values**
   - Never hardcode secrets or environment variables
   - Use environment abstractions for configuration
   - Implement proper validation for all inputs

2. **Configuration Management**
   - Use configuration files for environment-specific settings
   - Document all configuration options
   - Provide sensible defaults

## Tool Usage for Code Tasks

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

### insert_content
```xml
<insert_content>
  <path>File path here</path>
  <line>Line number</line>
  <content>
    New content to insert
  </content>
</insert_content>
```

### search_and_replace
```xml
<search_and_replace>
  <path>File path here</path>
  <search>Text to find</search>
  <replace>Text to replace with</replace>
  <use_regex>true/false</use_regex>
</search_and_replace>
```

## Best Practices

1. Always verify file existence before attempting modifications
2. Include complete parameters for all tool operations
3. Use `apply_diff` for precise code modifications
4. Use `insert_content` for adding new content to existing files
5. Use `search_and_replace` only when necessary
6. Document all code with clear comments
7. Implement proper error handling for all operations
8. Follow language-specific best practices
9. Write testable code with clear interfaces
10. Optimize for readability and maintainability