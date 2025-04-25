/**
 * Registry Error
 * 
 * Custom error class for Registry Client errors with additional context.
 */

class RegistryError extends Error {
  /**
   * Create a new RegistryError
   * 
   * @param {string} message - Error message
   * @param {string} code - Error code (e.g., 'AUTH_001', 'RES_001')
   * @param {number} statusCode - HTTP status code (if applicable)
   * @param {Object} details - Additional error details
   */
  constructor(message, code, statusCode, details = {}) {
    super(message);
    this.name = 'RegistryError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RegistryError);
    }
  }

  /**
   * Create an authentication error
   * 
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @returns {RegistryError} - New RegistryError instance
   */
  static authError(message = 'Authentication failed', code = 'AUTH_001') {
    return new RegistryError(message, code, 401);
  }

  /**
   * Create a not found error
   * 
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @returns {RegistryError} - New RegistryError instance
   */
  static notFoundError(message = 'Resource not found', code = 'RES_001') {
    return new RegistryError(message, code, 404);
  }

  /**
   * Create a validation error
   * 
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {Object} details - Validation error details
   * @returns {RegistryError} - New RegistryError instance
   */
  static validationError(message = 'Validation failed', code = 'VAL_001', details = {}) {
    return new RegistryError(message, code, 400, details);
  }

  /**
   * Create a rate limit error
   * 
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {number} retryAfter - Seconds to wait before retrying
   * @returns {RegistryError} - New RegistryError instance
   */
  static rateLimitError(message = 'Rate limit exceeded', code = 'RATE_001', retryAfter = 60) {
    return new RegistryError(message, code, 429, { retryAfter });
  }

  /**
   * Create a server error
   * 
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {string} requestId - Request ID for troubleshooting
   * @returns {RegistryError} - New RegistryError instance
   */
  static serverError(message = 'Server error', code = 'SRV_001', requestId = '') {
    return new RegistryError(message, code, 500, { requestId });
  }

  /**
   * Create a network error
   * 
   * @param {string} message - Error message
   * @param {Error} originalError - Original error that caused the network issue
   * @returns {RegistryError} - New RegistryError instance
   */
  static networkError(message = 'Network error', originalError = null) {
    const error = new RegistryError(message, 'NET_001', 0);
    if (originalError) {
      error.details.originalError = originalError.message;
      error.details.originalStack = originalError.stack;
    }
    return error;
  }
}

module.exports = RegistryError;