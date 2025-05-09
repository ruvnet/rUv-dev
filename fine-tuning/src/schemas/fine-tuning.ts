import { z } from 'zod';
import config from '../config';

/**
 * Schema for the grader in reinforcement fine-tuning
 * This validates the basic structure of the grader configuration used for RFT
 * Intentionally flexible to accommodate different grader types
 */
export const graderSchema = z.object({
  type: z.string().describe('The type of grader to use'),
}).and(
  z.record(z.any())
).describe('Grader configuration for reinforcement learning');

/**
 * Schema for hyperparameters used in fine-tuning
 */
export const hyperparametersSchema = z.object({
  batch_size: z.number().int().positive().optional().describe('Number of samples processed per batch'),
  learning_rate_multiplier: z.number().positive().optional().describe('Learning rate multiplier'),
  n_epochs: z.number().int().positive().optional().describe('Number of training epochs'),
}).optional();

/**
 * Schema for the start_job method parameters
 * Used to validate input when creating a new reinforcement fine-tuning job
 */
export const startJobSchema = z.object({
  training_file: z.string()
    .min(1)
    .describe('OpenAI file ID for the training data'),
  
  validation_file: z.string()
    .min(1)
    .describe('OpenAI file ID for the validation data'),
  
  grader: graderSchema
    .describe('Multi-grader configuration for reinforcement learning'),
  
  base_model: z.string()
    .default(config.defaultBaseModel)
    .describe('Base model to fine-tune from'),
  
  response_schema: z.record(z.any())
    .optional()
    .describe('JSON schema for structured outputs'),
  
  hyperparameters: hyperparametersSchema
    .describe('Fine-tuning hyperparameters'),
});

/**
 * Schema for job ID-based operations
 * Used to validate input for get_job_status, list_checkpoints, pause_job, and resume_job
 */
export const jobIdSchema = z.object({
  job_id: z.string()
    .min(1)
    .describe('OpenAI fine-tuning job ID'),
});

/**
 * Schema specifically for the get_job_status operation
 * Currently identical to jobIdSchema but separated for potential future enhancements
 */
export const getJobStatusSchema = jobIdSchema;

/**
 * Schema specifically for the list_checkpoints operation
 * Currently identical to jobIdSchema but separated for potential future enhancements
 */
export const listCheckpointsSchema = jobIdSchema;

/**
 * Schema specifically for the pause_job operation
 * Currently identical to jobIdSchema but separated for potential future enhancements
 */
export const pauseJobSchema = jobIdSchema;

/**
 * Schema specifically for the resume_job operation
 * Currently identical to jobIdSchema but separated for potential future enhancements
 */
export const resumeJobSchema = jobIdSchema;

// Type definitions derived from schemas
export type StartJobParams = z.infer<typeof startJobSchema>;
export type JobIdParams = z.infer<typeof jobIdSchema>;
export type GetJobStatusParams = z.infer<typeof getJobStatusSchema>;
export type ListCheckpointsParams = z.infer<typeof listCheckpointsSchema>;
export type PauseJobParams = z.infer<typeof pauseJobSchema>;
export type ResumeJobParams = z.infer<typeof resumeJobSchema>;
export type GraderConfig = z.infer<typeof graderSchema>;
export type Hyperparameters = z.infer<typeof hyperparametersSchema>;