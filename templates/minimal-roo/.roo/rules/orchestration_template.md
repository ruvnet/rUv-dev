# Orchestration Template

This template provides a structure for orchestrating complex workflows using Roo modes.

## Workflow Structure

1. **Task Analysis**
   - Break down the task into smaller, manageable subtasks
   - Identify dependencies between subtasks
   - Determine the appropriate mode for each subtask

2. **Subtask Delegation**
   - Use `new_task` to delegate subtasks to appropriate modes
   - Track progress of each subtask
   - Handle dependencies between subtasks

3. **Integration**
   - Combine the results of subtasks
   - Ensure consistency across components
   - Validate the integrated solution

4. **Completion**
   - Use `attempt_completion` to finalize the task
   - Provide a summary of the completed work
   - Document any remaining tasks or known issues

## Example Workflow

```
Task: Create a web application with user authentication

1. Task Analysis:
   - Frontend UI components (Auto-Coder)
   - Backend API (Auto-Coder)
   - Database schema (Supabase Admin)
   - Authentication flow (Auto-Coder + Supabase Admin)
   - Documentation (Documentation Writer)

2. Subtask Delegation:
   - new_task to Auto-Coder: "Create frontend UI components"
   - new_task to Auto-Coder: "Create backend API"
   - new_task to Supabase Admin: "Design database schema"
   - new_task to Auto-Coder: "Implement authentication flow"
   - new_task to Documentation Writer: "Create user documentation"

3. Integration:
   - Ensure frontend components connect to backend API
   - Verify authentication flow works end-to-end
   - Validate database schema supports all required operations

4. Completion:
   - Summarize completed work
   - Provide instructions for running the application
   - Document any known issues or limitations
```

## Best Practices

1. **Clear Task Boundaries**
   - Define clear responsibilities for each subtask
   - Avoid overlapping responsibilities
   - Establish clear interfaces between components

2. **Progress Tracking**
   - Track the status of each subtask
   - Handle dependencies between subtasks
   - Adjust the plan as needed based on progress

3. **Communication**
   - Provide clear instructions for each subtask
   - Ensure consistent terminology across subtasks
   - Document integration points and dependencies

4. **Quality Assurance**
   - Validate results at each step
   - Ensure consistency across components
   - Test the integrated solution