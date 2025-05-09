// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
import OpenAI from 'openai';
import { StartJobParams } from '../schemas/fine-tuning';
import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';

// Mock implementations for the API methods
const mockCreate = jest.fn();
const mockListEvents = jest.fn();
const mockListCheckpoints = jest.fn();
const mockPause = jest.fn();
const mockResume = jest.fn();

// Mock the OpenAI constructor
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    fineTuning: {
      jobs: {
        create: mockCreate,
        listEvents: mockListEvents,
        checkpoints: {
          list: mockListCheckpoints,
        },
        pause: mockPause,
        resume: mockResume,
      }
    }
  }));
});

// Import the service after mocking OpenAI
const openAIService = require('../services/openai-service').default;

describe('OpenAIService', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset console.error to not pollute test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('startJob', () => {
    it('should create a new fine-tuning job with the provided parameters', async () => {
      // Arrange
      const params = {
        training_file: 'file-1234',
        validation_file: 'file-5678',
        grader: { type: 'test-grader' },
        base_model: 'test-model',
      };
      
      const mockJobResponse = {
        id: 'ft-job-1234',
        status: 'pending',
      };
      
      mockCreate.mockResolvedValue(mockJobResponse);
      
      // Act
      const result = await openAIService.startJob(params);
      
      // Assert
      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        training_file: params.training_file,
        validation_file: params.validation_file,
        model: params.base_model,
      }));
      expect(result).toEqual(mockJobResponse);
    });
    
    it('should handle errors when creating a fine-tuning job', async () => {
      // Arrange
      const params = {
        training_file: 'file-1234',
        validation_file: 'file-5678',
        grader: { type: 'test-grader' },
        base_model: 'test-model',
      };
      
      const mockError = new Error('OpenAI API error');
      mockCreate.mockRejectedValue(mockError);
      
      // Act & Assert
      await expect(openAIService.startJob(params)).rejects.toThrow(mockError);
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('getJobStatus', () => {
    it('should retrieve job status events', async () => {
      // Arrange
      const mockEventsResponse = {
        data: [
          { type: 'event', created_at: 123456789 }
        ]
      };
      
      mockListEvents.mockResolvedValue(mockEventsResponse);
      
      // Act
      const result = await openAIService.getJobStatus({ job_id: 'ft-job-1234' });
      
      // Assert
      expect(mockListEvents).toHaveBeenCalledTimes(1);
      expect(mockListEvents).toHaveBeenCalledWith('ft-job-1234');
      expect(result).toEqual(mockEventsResponse);
    });
    
    it('should handle errors when retrieving job status', async () => {
      // Arrange
      const mockError = new Error('OpenAI API error');
      mockListEvents.mockRejectedValue(mockError);
      
      // Act & Assert
      await expect(openAIService.getJobStatus({ job_id: 'ft-job-1234' })).rejects.toThrow(mockError);
      expect(mockListEvents).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('listCheckpoints', () => {
    it('should retrieve job checkpoints', async () => {
      // Arrange
      const mockCheckpointsResponse = {
        data: [
          { id: 'checkpoint-1', step: 100 }
        ]
      };
      
      mockListCheckpoints.mockResolvedValue(mockCheckpointsResponse);
      
      // Act
      const result = await openAIService.listCheckpoints({ job_id: 'ft-job-1234' });
      
      // Assert
      expect(mockListCheckpoints).toHaveBeenCalledTimes(1);
      expect(mockListCheckpoints).toHaveBeenCalledWith('ft-job-1234');
      expect(result).toEqual(mockCheckpointsResponse);
    });
    
    it('should handle errors when retrieving checkpoints', async () => {
      // Arrange
      const mockError = new Error('OpenAI API error');
      mockListCheckpoints.mockRejectedValue(mockError);
      
      // Act & Assert
      await expect(openAIService.listCheckpoints({ job_id: 'ft-job-1234' })).rejects.toThrow(mockError);
      expect(mockListCheckpoints).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('pauseJob', () => {
    it('should pause a fine-tuning job', async () => {
      // Arrange
      const mockPauseResponse = {
        id: 'ft-job-1234',
        status: 'paused',
      };
      
      mockPause.mockResolvedValue(mockPauseResponse);
      
      // Act
      const result = await openAIService.pauseJob({ job_id: 'ft-job-1234' });
      
      // Assert
      expect(mockPause).toHaveBeenCalledTimes(1);
      expect(mockPause).toHaveBeenCalledWith('ft-job-1234');
      expect(result).toEqual(mockPauseResponse);
    });
    
    it('should handle errors when pausing a job', async () => {
      // Arrange
      const mockError = new Error('OpenAI API error');
      mockPause.mockRejectedValue(mockError);
      
      // Act & Assert
      await expect(openAIService.pauseJob({ job_id: 'ft-job-1234' })).rejects.toThrow(mockError);
      expect(mockPause).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('resumeJob', () => {
    it('should resume a fine-tuning job', async () => {
      // Arrange
      const mockResumeResponse = {
        id: 'ft-job-1234',
        status: 'running',
      };
      
      mockResume.mockResolvedValue(mockResumeResponse);
      
      // Act
      const result = await openAIService.resumeJob({ job_id: 'ft-job-1234' });
      
      // Assert
      expect(mockResume).toHaveBeenCalledTimes(1);
      expect(mockResume).toHaveBeenCalledWith('ft-job-1234');
      expect(result).toEqual(mockResumeResponse);
    });
    
    it('should handle errors when resuming a job', async () => {
      // Arrange
      const mockError = new Error('OpenAI API error');
      mockResume.mockRejectedValue(mockError);
      
      // Act & Assert
      await expect(openAIService.resumeJob({ job_id: 'ft-job-1234' })).rejects.toThrow(mockError);
      expect(mockResume).toHaveBeenCalledTimes(1);
    });
  });
});