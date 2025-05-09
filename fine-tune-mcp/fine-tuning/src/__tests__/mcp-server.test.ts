// @ts-nocheck
import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { startJobSchema, jobIdSchema } from '../schemas/fine-tuning';
import config from '../config';

// Mock implementations for OpenAI service
const mockStartJob = jest.fn();
const mockGetJobStatus = jest.fn();
const mockListCheckpoints = jest.fn();
const mockPauseJob = jest.fn();
const mockResumeJob = jest.fn();

// Mock the OpenAI service
jest.mock('../services/openai-service', () => ({
  __esModule: true,
  default: {
    startJob: mockStartJob,
    getJobStatus: mockGetJobStatus,
    listCheckpoints: mockListCheckpoints,
    pauseJob: mockPauseJob,
    resumeJob: mockResumeJob
  }
}));

// Set up mock registry to track tool registrations
const mockToolRegistry = new Map();
const mockConnectFn = jest.fn();
const mockToolFn = jest.fn((name, schema, handler) => {
  mockToolRegistry.set(name, { schema, handler });
  return mockServerInstance;
});

// Create mock server instance
const mockServerInstance = {
  tool: mockToolFn,
  connect: mockConnectFn
};

// Mock the MCP SDK server modules
jest.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: jest.fn().mockImplementation(() => mockServerInstance)
}), { virtual: true });

jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: jest.fn()
}), { virtual: true });

jest.mock('@modelcontextprotocol/sdk/server/http.js', () => ({
  HttpServerTransport: jest.fn()
}), { virtual: true });

// Import the MCP server implementation after mocking dependencies
import { FineTuningMcpServer } from '../server/mcp-server';

describe('FineTuningMcpServer', () => {
  let mcpServer;
  
  // Mock console.log to keep test output clean
  const originalConsoleLog = console.log;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockToolRegistry.clear();
    
    // Replace console.log with mock
    console.log = jest.fn();
    
    // Create a new server instance for each test
    mcpServer = new FineTuningMcpServer();
  });
  
  afterEach(() => {
    console.log = originalConsoleLog;
  });
  
  describe('Server initialization', () => {
    it('should initialize McpServer with correct configuration', () => {
      // Get the constructor from the import
      const McpServerConstructor = require('@modelcontextprotocol/sdk/server/mcp.js').McpServer;
      
      // Assert that the constructor was called with correct params
      expect(McpServerConstructor).toHaveBeenCalledWith({
        name: 'reinforcement_fine_tuning',
        version: '0.1.0',
        description: 'Launch and manage OpenAI reinforcement fine-tuning (RFT) jobs',
      });
    });
    
    it('should register all required tools', () => {
      // Assert that all tools were registered
      expect(mockToolRegistry.has('start_job')).toBeTruthy();
      expect(mockToolRegistry.has('get_job_status')).toBeTruthy();
      expect(mockToolRegistry.has('list_checkpoints')).toBeTruthy();
      expect(mockToolRegistry.has('pause_job')).toBeTruthy();
      expect(mockToolRegistry.has('resume_job')).toBeTruthy();
      
      // Verify schemas
      expect(mockToolRegistry.get('start_job').schema).toBe(startJobSchema);
      expect(mockToolRegistry.get('get_job_status').schema).toBe(jobIdSchema);
      expect(mockToolRegistry.get('list_checkpoints').schema).toBe(jobIdSchema);
      expect(mockToolRegistry.get('pause_job').schema).toBe(jobIdSchema);
      expect(mockToolRegistry.get('resume_job').schema).toBe(jobIdSchema);
    });
  });
  
  describe('Tool handlers', () => {
    describe('start_job', () => {
      it('should call openAIService.startJob with provided arguments', async () => {
        // Arrange
        const args = {
          training_file: 'file-1234',
          validation_file: 'file-5678',
          grader: { type: 'test-grader' },
          base_model: 'test-model',
        };
        
        const jobResponse = {
          id: 'ft-job-1234',
          status: 'pending',
        };
        
        mockStartJob.mockResolvedValue(jobResponse);
        
        // Act
        const handler = mockToolRegistry.get('start_job').handler;
        const result = await handler(args);
        
        // Assert
        expect(mockStartJob).toHaveBeenCalledTimes(1);
        expect(mockStartJob).toHaveBeenCalledWith(args);
        expect(result).toEqual({
          content: [
            {
              type: 'json',
              json: jobResponse,
            },
          ],
        });
      });
      
      it('should handle errors from openAIService.startJob', async () => {
        // Arrange
        const args = {
          training_file: 'file-1234',
          validation_file: 'file-5678',
          grader: { type: 'test-grader' },
          base_model: 'test-model',
        };
        
        const error = new Error('Failed to start job');
        mockStartJob.mockRejectedValue(error);
        
        // Act & Assert
        const handler = mockToolRegistry.get('start_job').handler;
        await expect(handler(args)).rejects.toThrow(error);
      });
    });
    
    describe('get_job_status', () => {
      it('should call openAIService.getJobStatus with provided arguments', async () => {
        // Arrange
        const args = { job_id: 'ft-job-1234' };
        
        const eventsResponse = {
          data: [
            { type: 'event', created_at: 123456789 }
          ]
        };
        
        mockGetJobStatus.mockResolvedValue(eventsResponse);
        
        // Act
        const handler = mockToolRegistry.get('get_job_status').handler;
        const result = await handler(args);
        
        // Assert
        expect(mockGetJobStatus).toHaveBeenCalledTimes(1);
        expect(mockGetJobStatus).toHaveBeenCalledWith(args);
        expect(result).toEqual({
          content: [
            {
              type: 'json',
              json: eventsResponse,
            },
          ],
        });
      });
      
      it('should handle errors from openAIService.getJobStatus', async () => {
        // Arrange
        const args = { job_id: 'ft-job-1234' };
        
        const error = new Error('Failed to get job status');
        mockGetJobStatus.mockRejectedValue(error);
        
        // Act & Assert
        const handler = mockToolRegistry.get('get_job_status').handler;
        await expect(handler(args)).rejects.toThrow(error);
      });
    });
    
    describe('list_checkpoints', () => {
      it('should call openAIService.listCheckpoints with provided arguments', async () => {
        // Arrange
        const args = { job_id: 'ft-job-1234' };
        
        const checkpointsResponse = {
          data: [
            { id: 'checkpoint-1', step: 100 }
          ]
        };
        
        mockListCheckpoints.mockResolvedValue(checkpointsResponse);
        
        // Act
        const handler = mockToolRegistry.get('list_checkpoints').handler;
        const result = await handler(args);
        
        // Assert
        expect(mockListCheckpoints).toHaveBeenCalledTimes(1);
        expect(mockListCheckpoints).toHaveBeenCalledWith(args);
        expect(result).toEqual({
          content: [
            {
              type: 'json',
              json: checkpointsResponse,
            },
          ],
        });
      });
      
      it('should handle errors from openAIService.listCheckpoints', async () => {
        // Arrange
        const args = { job_id: 'ft-job-1234' };
        
        const error = new Error('Failed to list checkpoints');
        mockListCheckpoints.mockRejectedValue(error);
        
        // Act & Assert
        const handler = mockToolRegistry.get('list_checkpoints').handler;
        await expect(handler(args)).rejects.toThrow(error);
      });
    });
    
    describe('pause_job', () => {
      it('should call openAIService.pauseJob with provided arguments', async () => {
        // Arrange
        const args = { job_id: 'ft-job-1234' };
        
        const pauseResponse = {
          id: 'ft-job-1234',
          status: 'paused',
        };
        
        mockPauseJob.mockResolvedValue(pauseResponse);
        
        // Act
        const handler = mockToolRegistry.get('pause_job').handler;
        const result = await handler(args);
        
        // Assert
        expect(mockPauseJob).toHaveBeenCalledTimes(1);
        expect(mockPauseJob).toHaveBeenCalledWith(args);
        expect(result).toEqual({
          content: [
            {
              type: 'json',
              json: pauseResponse,
            },
          ],
        });
      });
      
      it('should handle errors from openAIService.pauseJob', async () => {
        // Arrange
        const args = { job_id: 'ft-job-1234' };
        
        const error = new Error('Failed to pause job');
        mockPauseJob.mockRejectedValue(error);
        
        // Act & Assert
        const handler = mockToolRegistry.get('pause_job').handler;
        await expect(handler(args)).rejects.toThrow(error);
      });
    });
    
    describe('resume_job', () => {
      it('should call openAIService.resumeJob with provided arguments', async () => {
        // Arrange
        const args = { job_id: 'ft-job-1234' };
        
        const resumeResponse = {
          id: 'ft-job-1234',
          status: 'running',
        };
        
        mockResumeJob.mockResolvedValue(resumeResponse);
        
        // Act
        const handler = mockToolRegistry.get('resume_job').handler;
        const result = await handler(args);
        
        // Assert
        expect(mockResumeJob).toHaveBeenCalledTimes(1);
        expect(mockResumeJob).toHaveBeenCalledWith(args);
        expect(result).toEqual({
          content: [
            {
              type: 'json',
              json: resumeResponse,
            },
          ],
        });
      });
      
      it('should handle errors from openAIService.resumeJob', async () => {
        // Arrange
        const args = { job_id: 'ft-job-1234' };
        
        const error = new Error('Failed to resume job');
        mockResumeJob.mockRejectedValue(error);
        
        // Act & Assert
        const handler = mockToolRegistry.get('resume_job').handler;
        await expect(handler(args)).rejects.toThrow(error);
      });
    });
  });
  
  describe('Server connection methods', () => {
    describe('startWithStdio', () => {
      it('should connect with StdioServerTransport', async () => {
        // Arrange
        const mockStdioTransport = {};
        const StdioTransport = require('@modelcontextprotocol/sdk/server/stdio.js').StdioServerTransport;
        StdioTransport.mockImplementationOnce(() => mockStdioTransport);
        
        // Act
        await mcpServer.startWithStdio();
        
        // Assert
        expect(StdioTransport).toHaveBeenCalledTimes(1);
        expect(mockConnectFn).toHaveBeenCalledTimes(1);
        expect(mockConnectFn).toHaveBeenCalledWith(mockStdioTransport);
        expect(console.log).toHaveBeenCalledWith('MCP server started with stdio transport');
      });
      
      it('should propagate errors from connect', async () => {
        // Arrange
        const mockStdioTransport = {};
        const StdioTransport = require('@modelcontextprotocol/sdk/server/stdio.js').StdioServerTransport;
        StdioTransport.mockImplementationOnce(() => mockStdioTransport);
        
        const error = new Error('Failed to connect');
        mockConnectFn.mockRejectedValueOnce(error);
        
        // Act & Assert
        await expect(mcpServer.startWithStdio()).rejects.toThrow(error);
      });
    });
    
    describe('startWithHttp', () => {
      it('should connect with HttpServerTransport using default port', async () => {
        // Arrange
        const mockHttpTransport = {};
        const HttpTransport = require('@modelcontextprotocol/sdk/server/http.js').HttpServerTransport;
        HttpTransport.mockImplementationOnce(() => mockHttpTransport);
        
        // Act
        await mcpServer.startWithHttp();
        
        // Assert
        expect(HttpTransport).toHaveBeenCalledTimes(1);
        expect(HttpTransport).toHaveBeenCalledWith({
          port: config.port,
          host: '0.0.0.0',
        });
        expect(mockConnectFn).toHaveBeenCalledTimes(1);
        expect(mockConnectFn).toHaveBeenCalledWith(mockHttpTransport);
        expect(console.log).toHaveBeenCalledWith(`MCP server started with HTTP transport on port ${config.port}`);
      });
      
      it('should connect with HttpServerTransport using custom port', async () => {
        // Arrange
        const customPort = 4000;
        const mockHttpTransport = {};
        const HttpTransport = require('@modelcontextprotocol/sdk/server/http.js').HttpServerTransport;
        HttpTransport.mockImplementationOnce(() => mockHttpTransport);
        
        // Act
        await mcpServer.startWithHttp(customPort);
        
        // Assert
        expect(HttpTransport).toHaveBeenCalledTimes(1);
        expect(HttpTransport).toHaveBeenCalledWith({
          port: customPort,
          host: '0.0.0.0',
        });
        expect(mockConnectFn).toHaveBeenCalledTimes(1);
        expect(mockConnectFn).toHaveBeenCalledWith(mockHttpTransport);
        expect(console.log).toHaveBeenCalledWith(`MCP server started with HTTP transport on port ${customPort}`);
      });
      
      it('should propagate errors from connect', async () => {
        // Arrange
        const mockHttpTransport = {};
        const HttpTransport = require('@modelcontextprotocol/sdk/server/http.js').HttpServerTransport;
        HttpTransport.mockImplementationOnce(() => mockHttpTransport);
        
        const error = new Error('Failed to connect');
        mockConnectFn.mockRejectedValueOnce(error);
        
        // Act & Assert
        await expect(mcpServer.startWithHttp()).rejects.toThrow(error);
      });
    });
  });
});