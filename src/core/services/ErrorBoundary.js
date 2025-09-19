import { ErrorHandler } from './ErrorHandler.js';
import { NotificationService } from './NotificationService.js';

export class ErrorBoundary {
  constructor() {
    this.fallbackUI = null;
    this.errorCount = 0;
    this.maxErrors = 10;
  }

  /**
   * Wraps a function with error handling
   * @param {Function} fn - Function to wrap
   * @param {string} context - Context for error reporting
   * @returns {Function} Wrapped function
   */
  static wrap(fn, context = 'Unknown') {
    return function (...args) {
      try {
        const result = fn.apply(this, args);
        // Handle async functions
        if (result instanceof Promise) {
          return result.catch((error) => {
            ErrorBoundary.handleError(error, context);
            throw error;
          });
        }
        return result;
      } catch (error) {
        ErrorBoundary.handleError(error, context);
        throw error;
      }
    };
  }

  /**
   * Wraps a function with error recovery
   * @param {Function} fn - Function to wrap
   * @param {*} fallbackValue - Value to return on error
   * @param {string} context - Context for error reporting
   * @returns {Function} Wrapped function
   */
  static wrapWithRecovery(fn, fallbackValue = null, context = 'Unknown') {
    return function (...args) {
      try {
        const result = fn.apply(this, args);
        // Handle async functions
        if (result instanceof Promise) {
          return result.catch((error) => {
            ErrorBoundary.handleError(error, context);
            return fallbackValue;
          });
        }
        return result;
      } catch (error) {
        ErrorBoundary.handleError(error, context);
        return fallbackValue;
      }
    };
  }

  /**
   * Central error handling
   * @param {Error} error - The error to handle
   * @param {string} context - Context where error occurred
   */
  static handleError(error, context) {
    console.error(`Error in ${context}:`, error);

    // Log to ErrorHandler service
    ErrorHandler.logError(error, { context });

    // Show user-friendly notification
    if (error.message.includes('localStorage')) {
      NotificationService.error('Storage error: Your browser storage may be full or disabled');
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      NotificationService.error('Network error: Please check your connection');
    } else if (error.message.includes('JSON')) {
      NotificationService.error('Invalid data format');
    } else {
      NotificationService.error(`An error occurred in ${context}. Please try again.`);
    }
  }

  /**
   * Wraps localStorage operations with error handling
   * @param {string} operation - 'getItem', 'setItem', 'removeItem', 'clear'
   * @param {string} key - Storage key
   * @param {*} value - Value for setItem
   * @returns {*} Result or null on error
   */
  static localStorage(operation, key, value = null) {
    try {
      switch (operation) {
        case 'getItem':
          const item = localStorage.getItem(key);
          return item ? JSON.parse(item) : null;
        case 'setItem':
          localStorage.setItem(key, JSON.stringify(value));
          return true;
        case 'removeItem':
          localStorage.removeItem(key);
          return true;
        case 'clear':
          localStorage.clear();
          return true;
        default:
          throw new Error(`Unknown localStorage operation: ${operation}`);
      }
    } catch (error) {
      console.error(`localStorage ${operation} failed:`, error);

      if (error.name === 'QuotaExceededError') {
        NotificationService.error('Storage quota exceeded. Please clear some space.');
      } else if (error.message.includes('JSON')) {
        NotificationService.error('Failed to process stored data');
      } else {
        NotificationService.error('Storage operation failed');
      }

      return operation === 'setItem' ? false : null;
    }
  }

  /**
   * Creates a safe event handler
   * @param {Function} handler - Event handler function
   * @param {string} context - Context for error reporting
   * @returns {Function} Wrapped handler
   */
  static safeEventHandler(handler, context = 'Event Handler') {
    return function (event) {
      try {
        return handler.call(this, event);
      } catch (error) {
        ErrorBoundary.handleError(error, context);
        // Prevent event propagation on error
        if (event && typeof event.stopPropagation === 'function') {
          event.stopPropagation();
        }
      }
    };
  }

  /**
   * Wrap async operations with timeout
   * @param {Promise} promise - Promise to wrap
   * @param {number} timeout - Timeout in milliseconds
   * @param {string} context - Context for error reporting
   * @returns {Promise} Wrapped promise
   */
  static withTimeout(promise, timeout = 5000, context = 'Async Operation') {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timed out in ${context}`)), timeout),
      ),
    ]).catch((error) => {
      ErrorBoundary.handleError(error, context);
      throw error;
    });
  }
}

window.ErrorBoundary = ErrorBoundary;
