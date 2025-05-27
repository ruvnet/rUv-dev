/**
 * Cold Start Optimization Utilities
 * 
 * Techniques to minimize cold start impact in serverless environments.
 * Includes connection pooling, lazy loading, and resource caching.
 */

import { getEnvironment } from '../config/environment.js';

// Track optimization state to avoid redundant initialization
let optimizationComplete = false;

// Resource pooling for database connections, HTTP clients, etc.
const connectionPools: Record<string, any> = {
  db: null,
  http: null,
  redis: null
};

/**
 * Setup all cold start optimizations
 * This function is called at the beginning of each handler
 * but executes its setup only once per container instance
 */
export async function setupOptimizations(): Promise<void> {
  // Skip if already optimized (container reuse)
  if (optimizationComplete) {
    console.log('Optimizations already applied (warm container)');
    return;
  }
  
  console.log('Setting up cold start optimizations');
  
  // Run optimizations in parallel
  await Promise.all([
    preconnectDatabases(),
    warmupDependencies(),
    precalculateCommonValues(),
    preloadResources()
  ]);
  
  // Mark optimization as complete
  optimizationComplete = true;
  console.log('Cold start optimizations complete');
}

/**
 * Initialize database connection pools
 * Creates minimal connections that will be reused
 */
async function preconnectDatabases(): Promise<void> {
  try {
    const config = await getEnvironment();
    
    // Check if we're in an environment where DB connections make sense
    const isDatabaseEnabled = config.NODE_ENV !== 'test';
    
    if (isDatabaseEnabled) {
      console.log('Initializing database connection pool');
      
      // In a real implementation, this would create actual database connections
      // using configuration values from environment
      
      // Simulate database connection
      connectionPools.db = {
        isConnected: true,
        poolSize: 5
      };
    }
    
    // Check if Redis should be enabled
    const isRedisEnabled = config.NODE_ENV === 'production' || config.NODE_ENV === 'staging';
    
    if (isRedisEnabled) {
      console.log('Initializing Redis client');
      
      // In a real implementation, this would create actual Redis client
      // using configuration values from environment
      
      // Simulate Redis client
      connectionPools.redis = {
        isConnected: true
      };
    }
  } catch (error) {
    console.error('Error initializing database connections:', error);
    // Don't throw - we want to continue even if connections fail
    // The handlers will handle connection errors when they try to use them
  }
}

/**
 * Warmup commonly used dependencies to avoid cold imports
 */
async function warmupDependencies(): Promise<void> {
  try {
    // Pre-import common dependencies
    // This ensures they're loaded at startup rather than first use
    await Promise.all([
      // Simulated dynamic imports
      // In a real implementation, these would be:
      // import('crypto'),
      // import('jsonwebtoken')
      Promise.resolve(),
      Promise.resolve()
    ]);
  } catch (error) {
    console.error('Error warming up dependencies:', error);
  }
}

/**
 * Precalculate common values used across requests
 */
async function precalculateCommonValues(): Promise<void> {
  try {
    const config = await getEnvironment();
    
    // Initialize any shared data structures
    // For example, caching frequently accessed reference data
    
    // Set up global cache
    global.mcpCache = global.mcpCache || {
      serverStartTime: new Date().toISOString(),
      environment: config.NODE_ENV,
      version: config.SERVER_VERSION,
      commonConfigs: {}
    };
  } catch (error) {
    console.error('Error precalculating common values:', error);
  }
}

/**
 * Preload static resources
 */
async function preloadResources(): Promise<void> {
  try {
    // Load any static resources into memory
    // For example, preloading prompts, templates, or other static assets
    
    // Simulated resource loading
    // In a real implementation, this would load actual resources
    global.mcpResources = global.mcpResources || {
      prompts: {},
      templates: {},
      schemas: {}
    };
  } catch (error) {
    console.error('Error preloading resources:', error);
  }
}

/**
 * Get a connection from the pool
 */
export function getConnection(type: 'db' | 'http' | 'redis'): any {
  return connectionPools[type];
}

/**
 * Check if optimizations are complete
 */
export function checkOptimizationStatus(): boolean {
  return optimizationComplete;
}

// Add declaration merging for global variable
declare global {
  var mcpCache: {
    serverStartTime: string;
    environment: string;
    version: string;
    commonConfigs: Record<string, any>;
  } | undefined;
  
  var mcpResources: {
    prompts: Record<string, any>;
    templates: Record<string, any>;
    schemas: Record<string, any>;
  } | undefined;
}