import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';

/**
 * Load environment variables from .env file
 * Looks for .env file in the project root directory
 */
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

// Log successful loading of environment variables when in development
if (process.env.NODE_ENV !== 'production' && fs.existsSync(envPath)) {
  console.error(`Loaded environment variables from ${envPath}`);
}

/**
 * Define configuration schema using Zod for validation
 * This ensures all required configuration values are present
 * and properly typed
 */
const configSchema = z.object({
  // Required configuration
  openaiApiKey: z.string({
    required_error: 'OPENAI_API_KEY is required in your .env file',
  }),
  
  // Optional configuration with defaults
  serverName: z.string().default('MCP Server'),
  // Version must follow semver format x.y.z
  serverVersion: z.string()
    .regex(/^\d+\.\d+\.\d+$/, "Version must follow semantic versioning format (x.y.z)")
    .default('1.0.0'),
  
  // Server configuration
  port: z.coerce.number().default(3001),
  host: z.string().default('localhost'),
  
  // Logging configuration
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  
  // Fine-tuning specific configuration
  defaultBaseModel: z.string().default('o4-mini-2025-04-16'),
  
  // Server mode (we keep the enum for future compatibility)
  transportType: z.enum(['stdio', 'http']).default('stdio'),
  
  // Narrower type specifically for FastMCP.start() which only supports 'stdio'
  startTransportType: z.literal('stdio').default('stdio'),
});

/**
 * Configuration type definition extracted from Zod schema
 */
export type Config = z.infer<typeof configSchema>;

/**
 * Parsed and validated configuration object
 * This will throw an error if validation fails (e.g., missing required API key)
 */
export const config: Config = configSchema.parse({
  openaiApiKey: process.env.OPENAI_API_KEY,
  serverName: process.env.SERVER_NAME,
  serverVersion: process.env.SERVER_VERSION,
  port: process.env.PORT,
  host: process.env.HOST,
  logLevel: process.env.LOG_LEVEL,
  defaultBaseModel: process.env.DEFAULT_BASE_MODEL,
  transportType: process.env.TRANSPORT_TYPE,
  startTransportType: 'stdio', // This is always stdio for FastMCP server
});

/**
 * Export configuration as default export for easier importing
 */
export default config;