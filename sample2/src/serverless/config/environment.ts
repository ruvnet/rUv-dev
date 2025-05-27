/**
 * Environment Configuration
 * 
 * Loads and validates environment variables for serverless functions.
 * Supports different environment profiles and caching for efficiency.
 */

// Define the shape of our environment configuration
export interface EnvironmentConfig {
  // Core server settings
  SERVER_NAME: string;
  SERVER_VERSION: string;
  NODE_ENV: 'development' | 'test' | 'staging' | 'production';
  
  // Logging configuration
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  
  // API settings
  PORT: number;
  HOST: string;
  BASE_URL: string;
  
  // Cache settings
  CACHE_TTL: number;
  
  // Timeouts
  REQUEST_TIMEOUT: number;
  
  // API Keys and authentication
  OPENAI_API_KEY: string;
  API_KEYS?: string; // Comma-separated list of valid API keys
  
  // Optional settings
  DEBUG_MODE?: boolean;
}

// Cache the environment configuration to avoid re-parsing on every request
let cachedConfig: EnvironmentConfig | null = null;

/**
 * Get the environment configuration
 * 
 * Loads environment variables, validates them, and returns a typed configuration object.
 * Caches the result for subsequent calls for better performance.
 */
export async function getEnvironment(): Promise<EnvironmentConfig> {
  // Return cached config if available
  if (cachedConfig) {
    return cachedConfig;
  }
  
  try {
    // Assemble the config object from environment variables
    const config: EnvironmentConfig = {
      // Core server settings (with defaults for local development)
      SERVER_NAME: process.env.SERVER_NAME || 'logitech-mcp-server',
      SERVER_VERSION: process.env.SERVER_VERSION || '1.0.0',
      NODE_ENV: (process.env.NODE_ENV as EnvironmentConfig['NODE_ENV']) || 'development',
      
      // Logging configuration
      LOG_LEVEL: (process.env.LOG_LEVEL as EnvironmentConfig['LOG_LEVEL']) || 'info',
      
      // API settings
      PORT: parseInt(process.env.PORT || '3001', 10),
      HOST: process.env.HOST || '0.0.0.0',
      BASE_URL: process.env.BASE_URL || 'http://localhost:3001',
      
      // Cache settings
      CACHE_TTL: parseInt(process.env.CACHE_TTL || '300', 10), // 5 minutes default
      
      // Timeouts
      REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10), // 30 seconds default
      
      // API Keys (required)
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    };
    
    // Add optional settings
    if (process.env.API_KEYS) {
      config.API_KEYS = process.env.API_KEYS;
    }
    
    if (process.env.DEBUG_MODE) {
      config.DEBUG_MODE = process.env.DEBUG_MODE.toLowerCase() === 'true';
    }
    
    // Validate required configuration
    validateConfig(config);
    
    // Cache the config for future use
    cachedConfig = config;
    
    return config;
  } catch (error) {
    console.error('Failed to load environment configuration:', error);
    throw error;
  }
}

/**
 * Validate the environment configuration
 * 
 * Ensures all required variables are set and have valid values.
 * Throws an error if any required configuration is missing or invalid.
 */
function validateConfig(config: EnvironmentConfig): void {
  const errors: string[] = [];
  
  // Required for production environments
  if (config.NODE_ENV === 'production' || config.NODE_ENV === 'staging') {
    // API key validation
    if (!config.OPENAI_API_KEY) {
      errors.push('OPENAI_API_KEY is required in production and staging environments');
    }
    
    // API Keys for authentication
    if (!config.API_KEYS) {
      errors.push('API_KEYS is required in production and staging environments');
    }
  }
  
  // Check for numeric values
  if (isNaN(config.PORT) || config.PORT <= 0) {
    errors.push('PORT must be a positive number');
  }
  
  if (isNaN(config.CACHE_TTL) || config.CACHE_TTL < 0) {
    errors.push('CACHE_TTL must be a non-negative number');
  }
  
  if (isNaN(config.REQUEST_TIMEOUT) || config.REQUEST_TIMEOUT <= 0) {
    errors.push('REQUEST_TIMEOUT must be a positive number');
  }
  
  // Throw combined error if validation fails
  if (errors.length > 0) {
    throw new Error(`Environment configuration validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Reset the environment cache
 * 
 * Useful for testing or when configuration might have changed at runtime.
 */
export function resetEnvironmentCache(): void {
  cachedConfig = null;
}

/**
 * Helper function to get all environment variables
 * 
 * Useful for debugging.
 */
export function getAllEnvironmentVariables(): Record<string, string | undefined> {
  return process.env as Record<string, string | undefined>;
}