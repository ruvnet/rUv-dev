# Vue Guidelines

## Component Structure

- Use Single File Components (SFC)
- Keep components small and focused
- Use props for component communication
- Emit events for child-to-parent communication
- Use slots for component composition

## State Management

- Use Vuex for global state management
- Keep component state minimal
- Use computed properties for derived state
- Use watchers for side effects
- Consider Pinia for simpler state management

## Performance

- Use v-show instead of v-if for frequently toggled elements
- Implement lazy loading for routes
- Use keep-alive for expensive components
- Optimize v-for loops with key attributes
- Use functional components for stateless rendering

## Testing

- Write unit tests with Jest and Vue Test Utils
- Test component behavior and rendering
- Mock Vuex store when testing components
- Test component events and props
- Use snapshot testing for UI components
