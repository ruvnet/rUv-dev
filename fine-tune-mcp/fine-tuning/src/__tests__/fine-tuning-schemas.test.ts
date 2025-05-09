/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import {
  graderSchema,
  hyperparametersSchema,
  startJobSchema,
  jobIdSchema,
  getJobStatusSchema,
  listCheckpointsSchema,
  pauseJobSchema,
  resumeJobSchema
} from '../schemas/fine-tuning';
import config from '../config';

// Add explicit Jest imports to fix TypeScript errors
import { describe, it, expect } from '@jest/globals';

describe('Fine-tuning Schema Validations', () => {
  
  // Helper function to validate schema with valid and invalid data
  function testSchemaValidation<T extends z.ZodType>(
    schema: T,
    validData: z.infer<T>,
    invalidData: Record<string, any>[],
    expectedErrors: string[][]
  ) {
    // Test valid data
    expect(() => schema.parse(validData)).not.toThrow();
    
    // Test each invalid case
    invalidData.forEach((data, index) => {
      try {
        schema.parse(data);
        // Use expect.fail instead of fail function
        expect(true).toBe(false); // Force test to fail
        expect(`Validation should have failed for ${JSON.stringify(data)}`).toBe('');
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errorMessages = error.errors.map(e => e.message);
          
          // Check each expected error phrase for this test case
          let anyErrorMatched = false;
          
          expectedErrors[index].forEach(expectedError => {
            // Test if any error message contains the expected string (case insensitive)
            const hasMatchingError = errorMessages.some(msg => 
              msg.toLowerCase().includes(expectedError.toLowerCase())
            );
            
            // If we find a match, set flag to true
            if (hasMatchingError) {
              anyErrorMatched = true;
            }
          });
          
          // Expect at least one error message to match our expectations
          expect(anyErrorMatched).toBeTruthy();
        } else {
          // Use expect.fail instead of fail function
          expect(error).toBeInstanceOf(z.ZodError);
          expect(`Expected ZodError but got ${String(error)}`).toBe('');
        }
      }
    });
  }

  describe('graderSchema', () => {
    it('should validate correct grader configurations', () => {
      const validData = { type: 'test-grader', parameter1: 'value1' };
      const invalidData = [
        {},  // Missing type
        { parameter1: 'value1' }  // Missing type
      ];
      const expectedErrors = [
        ['Required'],
        ['Required']
      ];
      
      testSchemaValidation(graderSchema, validData, invalidData, expectedErrors);
    });
  });

  describe('hyperparametersSchema', () => {
    it('should validate correct hyperparameter configurations', () => {
      const validData = {
        batch_size: 4,
        learning_rate_multiplier: 0.5,
        n_epochs: 3
      };

      const validEmpty = undefined; // Optional schema

      const invalidData = [
        { batch_size: -1, learning_rate_multiplier: 0.5, n_epochs: 3 },  // Negative batch_size
        { batch_size: 4, learning_rate_multiplier: 0, n_epochs: 3 },     // Zero learning_rate
        { batch_size: 4, learning_rate_multiplier: 0.5, n_epochs: 0 },   // Zero epochs
        { batch_size: 4.5, learning_rate_multiplier: 0.5, n_epochs: 3 }, // Non-integer batch_size
        { batch_size: 4, learning_rate_multiplier: 0.5, n_epochs: 3.5 }  // Non-integer epochs
      ];
      
      // Using exact error messages from Zod validation
      const expectedErrors = [
        ['greater than 0'],    // Negative batch_size
        ['greater than 0'],    // Zero learning_rate
        ['greater than 0'],    // Zero epochs
        ['Expected integer'],  // Non-integer batch_size
        ['Expected integer']   // Non-integer epochs
      ];
      
      testSchemaValidation(hyperparametersSchema, validData, invalidData, expectedErrors);
      expect(() => hyperparametersSchema.parse(validEmpty)).not.toThrow();
    });
  });

  describe('startJobSchema', () => {
    it('should validate correct start job parameters', () => {
      const validData = {
        training_file: 'file-train-123',
        validation_file: 'file-valid-456',
        grader: { type: 'test-grader' },
        base_model: 'o4-mini-2025-04-16',
      };

      const invalidData = [
        { 
          // Missing training_file
          validation_file: 'file-valid-456',
          grader: { type: 'test-grader' },
          base_model: 'o4-mini-2025-04-16',
        },
        { 
          training_file: 'file-train-123',
          // Missing validation_file
          grader: { type: 'test-grader' },
          base_model: 'o4-mini-2025-04-16',
        },
        {
          training_file: 'file-train-123',
          validation_file: 'file-valid-456',
          // Missing grader
          base_model: 'o4-mini-2025-04-16',
        },
        {
          training_file: 'file-train-123',
          validation_file: 'file-valid-456',
          grader: {}, // Invalid grader (missing type)
          base_model: 'o4-mini-2025-04-16',
        },
        {
          training_file: '', // Empty string
          validation_file: 'file-valid-456',
          grader: { type: 'test-grader' },
          base_model: 'o4-mini-2025-04-16',
        }
      ];
      
      const expectedErrors = [
        ['Required'],
        ['Required'],
        ['Required'],
        ['Required'],
        ['at least 1 character']
      ];
      
      testSchemaValidation(startJobSchema, validData, invalidData, expectedErrors);
    });

    it('should use default base model if not provided', () => {
      const data = {
        training_file: 'file-train-123',
        validation_file: 'file-valid-456',
        grader: { type: 'test-grader' },
        // base_model not provided
      };
      
      const result = startJobSchema.parse(data);
      expect(result.base_model).toBe(config.defaultBaseModel);
    });
  });

  describe('jobIdSchema', () => {
    it('should validate correct job ID parameters', () => {
      const validData = { job_id: 'ft-12345' };
      
      const invalidData = [
        {},                // Missing job_id
        { job_id: '' },    // Empty job_id
        { job_id: null },  // Null job_id
      ];
      
      const expectedErrors = [
        ['Required'],
        ['at least 1 character'],
        ['Expected string']
      ];
      
      testSchemaValidation(jobIdSchema, validData, invalidData, expectedErrors);
    });
  });

  describe('getJobStatusSchema', () => {
    it('should validate job ID for get job status', () => {
      const validData = { job_id: 'ft-12345' };
      const invalidData = [{ job_id: '' }];
      const expectedErrors = [['at least 1 character']];
      
      testSchemaValidation(getJobStatusSchema, validData, invalidData, expectedErrors);
    });

    it('should be identical to jobIdSchema', () => {
      // This test verifies that getJobStatusSchema is the same as jobIdSchema
      expect(getJobStatusSchema).toBe(jobIdSchema);
    });
  });

  describe('listCheckpointsSchema', () => {
    it('should validate job ID for list checkpoints', () => {
      const validData = { job_id: 'ft-12345' };
      const invalidData = [{ job_id: '' }];
      const expectedErrors = [['at least 1 character']];
      
      testSchemaValidation(listCheckpointsSchema, validData, invalidData, expectedErrors);
    });

    it('should be identical to jobIdSchema', () => {
      expect(listCheckpointsSchema).toBe(jobIdSchema);
    });
  });

  describe('pauseJobSchema', () => {
    it('should validate job ID for pause job', () => {
      const validData = { job_id: 'ft-12345' };
      const invalidData = [{ job_id: '' }];
      const expectedErrors = [['at least 1 character']];
      
      testSchemaValidation(pauseJobSchema, validData, invalidData, expectedErrors);
    });

    it('should be identical to jobIdSchema', () => {
      expect(pauseJobSchema).toBe(jobIdSchema);
    });
  });

  describe('resumeJobSchema', () => {
    it('should validate job ID for resume job', () => {
      const validData = { job_id: 'ft-12345' };
      const invalidData = [{ job_id: '' }];
      const expectedErrors = [['at least 1 character']];
      
      testSchemaValidation(resumeJobSchema, validData, invalidData, expectedErrors);
    });

    it('should be identical to jobIdSchema', () => {
      expect(resumeJobSchema).toBe(jobIdSchema);
    });
  });
});