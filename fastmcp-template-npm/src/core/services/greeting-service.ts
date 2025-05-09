/**
 * A simple service for generating greetings
 */
export class GreetingService {
  /**
   * Generate a greeting message
   * @param name The name to greet
   * @returns A greeting message
   */
  public static generateGreeting(name: string): string {
    return `Hello, ${name}! Welcome to the MCP Server.`;
  }

  /**
   * Generate a farewell message
   * @param name The name to bid farewell to
   * @returns A farewell message
   */
  public static generateFarewell(name: string): string {
    return `Goodbye, ${name}! Thank you for using the MCP Server.`;
  }
} 