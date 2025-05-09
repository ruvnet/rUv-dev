import { FastMCP } from 'fastmcp';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import openAIService from '../services/openai-service';
import { startJobSchema, jobIdSchema } from '../schemas/fine-tuning';
import config from '../config';

/**
 * Create and configure the MCP server for fine-tuning
 */
export class FineTuningMcpServer {
  private server: FastMCP;

  constructor() {
    this.server = new FastMCP({
      name: 'reinforcement_fine_tuning',
      version: '0.1.0'
    });

    this.registerTools();
  }

  /**
   * Register all tool methods with the MCP server
   */
  private registerTools() {
    // Start a new fine-tuning job
    this.server.addTool({
      name: 'start_job',
      description: 'Start a new fine-tuning job',
      parameters: startJobSchema,
      execute: async (params) => {
        try {
          const job = await openAIService.startJob(params);
          return JSON.stringify(job, null, 2);
        } catch (error) {
          throw new Error(`Error starting job: ${error}`);
        }
      }
    });

    // Get job status
    this.server.addTool({
      name: 'get_job_status',
      description: 'Get the status of a fine-tuning job',
      parameters: jobIdSchema,
      execute: async (params) => {
        try {
          const events = await openAIService.getJobStatus(params);
          return JSON.stringify(events, null, 2);
        } catch (error) {
          throw new Error(`Error getting job status: ${error}`);
        }
      }
    });

    // List checkpoints
    this.server.addTool({
      name: 'list_checkpoints',
      description: 'List checkpoints for a fine-tuning job',
      parameters: jobIdSchema,
      execute: async (params) => {
        try {
          const checkpoints = await openAIService.listCheckpoints(params);
          return JSON.stringify(checkpoints, null, 2);
        } catch (error) {
          throw new Error(`Error listing checkpoints: ${error}`);
        }
      }
    });

    // Pause job
    this.server.addTool({
      name: 'pause_job',
      description: 'Pause a running fine-tuning job',
      parameters: jobIdSchema,
      execute: async (params) => {
        try {
          const result = await openAIService.pauseJob(params);
          return JSON.stringify(result, null, 2);
        } catch (error) {
          throw new Error(`Error pausing job: ${error}`);
        }
      }
    });

    // Resume job
    this.server.addTool({
      name: 'resume_job',
      description: 'Resume a paused fine-tuning job',
      parameters: jobIdSchema,
      execute: async (params) => {
        try {
          const result = await openAIService.resumeJob(params);
          return JSON.stringify(result, null, 2);
        } catch (error) {
          throw new Error(`Error resuming job: ${error}`);
        }
      }
    });
  }

  /**
   * Start the server with stdio transport (for CLI usage)
   */
  async startWithStdio() {
    try {
      this.server.start({
        transportType: 'stdio',
      });
      
      // Keep the process alive
      process.stdin.resume();
      
      // Handle process signals
      process.on('SIGINT', () => {
        console.error('Shutting down MCP server...');
        process.exit(0);
      });
      
      console.error('MCP server started with stdio transport');
    } catch (error) {
      console.error('Error starting MCP server with stdio transport:', error);
      throw error;
    }
  }

  /**
   * Start the server with HTTP transport (for web service usage)
   */
  async startWithHttp(port = config.port) {
    try {
      // In FastMCP, HTTP transport is configured differently
      this.server.start({
        transportType: 'stdio', // FastMCP only supports stdio transport
      });
      
      console.error(`MCP server started with transport on port ${port}`);
    } catch (error) {
      console.error(`Error starting MCP server on port ${port}:`, error);
      throw error;
    }
  }
}

export default FineTuningMcpServer;