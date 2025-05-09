import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Define config schema using Zod
const configSchema = z.object({
  openaiApiKey: z.string({
    required_error: 'OPENAI_API_KEY is required',
  }),
  defaultBaseModel: z.string().default('o4-mini-2025-04-16'),
  port: z.coerce.number().default(3001),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

// Extract config values from environment variables
export type Config = z.infer<typeof configSchema>;

export const config: Config = configSchema.parse({
  openaiApiKey: process.env.OPENAI_API_KEY,
  defaultBaseModel: process.env.DEFAULT_BASE_MODEL || 'o4-mini-2025-04-16',
  port: process.env.PORT || 3001,
  logLevel: process.env.LOG_LEVEL || 'info',
});

export default config;