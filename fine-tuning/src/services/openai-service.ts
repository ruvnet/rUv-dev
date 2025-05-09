import OpenAI from 'openai';
import config from '../config';
import { StartJobParams, JobIdParams } from '../schemas/fine-tuning';

// Create OpenAI client instance with API key from config
const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

/**
 * Service for interacting with OpenAI's fine-tuning API
 */
export class OpenAIService {
  /**
   * Start a new reinforcement fine-tuning job
   */
  async startJob(params: StartJobParams) {
    try {
      // Use type assertion to bypass type checking for OpenAI API
      // OpenAI's SDK types may not match the actual API requirements
      const config = {
        training_file: params.training_file,
        validation_file: params.validation_file,
        model: params.base_model,
        method: {
          type: 'reinforcement',
          reinforcement: {
            grader: params.grader,
            response_format: params.response_schema,
            hyperparameters: params.hyperparameters,
          },
        },
      } as any;
      
      const job = await openai.fineTuning.jobs.create(config);
      return job;
    } catch (error) {
      console.error('Error starting fine-tuning job:', error);
      throw error;
    }
  }

  /**
   * Get the status and events of a fine-tuning job
   */
  async getJobStatus({ job_id }: JobIdParams) {
    try {
      const events = await openai.fineTuning.jobs.listEvents(job_id);
      return events;
    } catch (error) {
      console.error('Error getting job status:', error);
      throw error;
    }
  }

  /**
   * List checkpoints for a fine-tuning job
   */
  async listCheckpoints({ job_id }: JobIdParams) {
    try {
      // Using the correct API path as per OpenAI SDK
      const checkpoints = await openai.fineTuning.jobs.checkpoints.list(job_id);
      return checkpoints;
    } catch (error) {
      console.error('Error listing checkpoints:', error);
      throw error;
    }
  }

  /**
   * Pause a fine-tuning job
   */
  async pauseJob({ job_id }: JobIdParams) {
    try {
      const result = await openai.fineTuning.jobs.pause(job_id);
      return result;
    } catch (error) {
      console.error('Error pausing job:', error);
      throw error;
    }
  }

  /**
   * Resume a paused fine-tuning job
   */
  async resumeJob({ job_id }: JobIdParams) {
    try {
      const result = await openai.fineTuning.jobs.resume(job_id);
      return result;
    } catch (error) {
      console.error('Error resuming job:', error);
      throw error;
    }
  }
}

export default new OpenAIService();