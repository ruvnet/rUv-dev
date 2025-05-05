# React Guidelines

## Component Structure

- Use functional components with hooks instead of class components
- Keep components small and focused on a single responsibility
- Use React.memo for performance optimization when appropriate
- Implement proper prop validation with PropTypes or TypeScript
- Follow the container/presentational component pattern

## State Management

- Use React Context for global state when appropriate
- Consider Redux for complex state management
- Keep component state minimal and focused
- Use the useState hook for simple state
- Use the useReducer hook for complex state logic

## Performance

- Use the React DevTools profiler to identify performance issues
- Implement virtualization for long lists
- Memoize expensive calculations with useMemo
- Optimize event handlers with useCallback
- Use React.lazy and Suspense for code splitting

## Testing

- Write unit tests for components with Jest and React Testing Library
- Test component behavior, not implementation details
- Use snapshot testing judiciously
- Test user interactions and state changes
- Mock external dependencies appropriately
