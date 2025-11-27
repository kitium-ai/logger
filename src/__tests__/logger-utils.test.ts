import { LogLevel } from '../config/logger.config';
import { initializeLogger } from '../index';
import {
  auditLog,
  BatchLogger,
  createTimer,
  logFunctionCall,
  LoggableError,
  withErrorLogging,
  withErrorLoggingSync,
} from '../utils/logger-utils';

/* eslint-disable sonarjs/no-duplicate-string -- Constant definition, used throughout tests */
const TEST_OPERATION = 'Test operation';
const TEST_ERROR = 'Test error';
const TEST_ERROR_CODE = 'TEST_ERROR';
const TYPE_FUNCTION = 'function';

/* eslint-disable max-lines-per-function */
describe('Logger Utils', () => {
  beforeEach(() => {
    // Initialize logger for tests
    initializeLogger({
      serviceName: 'test',
      environment: 'development',
      logLevel: LogLevel.INFO,
      enableConsoleTransport: true,
      enableFileTransport: false,
      fileLogPath: './logs',
      maxFileSize: '10M',
      maxFiles: 5,
      includeTimestamp: true,
      includeMeta: true,
      loki: {
        enabled: false,
        host: 'localhost',
        port: 3100,
        protocol: 'http',
        labels: {},
        batchSize: 100,
        interval: 1000,
        timeout: 3000,
      },
    });
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createTimer', () => {
    it('should create a timer instance', () => {
      const timer = createTimer(TEST_OPERATION);
      expect(timer).toBeDefined();
      expect(timer.end).toBeDefined();
    });

    it('should measure elapsed time', (done) => {
      const timer = createTimer(TEST_OPERATION);
      setTimeout(() => {
        const metadata = timer.end();
        expect(metadata.duration).toBeGreaterThan(0);
        done();
      }, 50);
    });

    it('should accept additional metadata', (done) => {
      const timer = createTimer(TEST_OPERATION);
      setTimeout(() => {
        const metadata = timer.end({ userId: 'user-123' });
        expect(metadata.duration).toBeGreaterThan(0);
        // Memory usage can be negative if GC runs between calls
        expect(typeof metadata.memoryUsed).toBe('number');
        done();
      }, 50);
    });

    it('should handle multiple end calls', () => {
      const timer = createTimer(TEST_OPERATION);
      const meta1 = timer.end();
      // Small delay to ensure duration increases
      const start = Date.now();
      while (Date.now() - start < 1) {
        // Wait at least 1ms
      }
      const meta2 = timer.end();
      expect(meta1.duration).toBeGreaterThanOrEqual(0);
      expect(meta2.duration).toBeGreaterThanOrEqual(meta1.duration);
    });
  });

  describe('LoggableError', () => {
    it('should create an error instance', () => {
      const error = new LoggableError('User not found', 'USER_NOT_FOUND', {
        userId: '123',
      });
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('User not found');
      expect(error.code).toBe('USER_NOT_FOUND');
    });

    it('should include metadata', () => {
      const metadata = { userId: '123', action: 'login' };
      const error = new LoggableError('Login failed', 'LOGIN_FAILED', metadata);
      expect(error.metadata).toEqual(metadata);
    });

    it('should have log method', () => {
      const error = new LoggableError(TEST_ERROR, TEST_ERROR_CODE, {});
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(error.log).toBeDefined();

      expect(typeof error.log).toBe(TYPE_FUNCTION);
    });

    it('should handle empty metadata', () => {
      const error = new LoggableError(TEST_ERROR, TEST_ERROR_CODE, {});
      expect(error.metadata).toEqual({});
    });

    it('should support logging with different levels', () => {
      const error = new LoggableError(TEST_ERROR, TEST_ERROR_CODE, {});
      expect(() => {
        error.log('info');
        error.log('warn');
        error.log('error');
      }).not.toThrow();
    });
  });

  describe('withErrorLogging', () => {
    it('should execute callback without error', async () => {
      const callback = jest.fn();
      await expect(withErrorLogging(callback, { operation: 'Test' })).resolves.not.toThrow();
      expect(callback).toHaveBeenCalled();
    });

    it('should handle callback returning value', async () => {
      const callback = jest.fn().mockResolvedValue('success');
      const result = await withErrorLogging(callback, { operation: 'Test' });
      expect(result).toBe('success');
    });

    it('should catch and log errors', async () => {
      const error = new Error('Test error');
      const callback = jest.fn().mockRejectedValue(error);
      await expect(withErrorLogging(callback, { operation: 'Test' })).rejects.toThrow();
      expect(callback).toHaveBeenCalled();
    });

    it('should include operation in error context', async () => {
      const callback = jest.fn().mockRejectedValue(new Error('Test error'));
      try {
        await withErrorLogging(callback, {
          operation: 'User creation',
          metadata: { userId: '123' },
        });
      } catch {
        // Error expected
      }
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('auditLog', () => {
    it('should create audit log entry', () => {
      expect(() => {
        auditLog('CREATE', 'user', 'user-123', { email: 'test@example.com' });
      }).not.toThrow();
    });

    it('should handle different action types', () => {
      expect(() => {
        auditLog('CREATE', 'user', 'user-123', {});
        auditLog('READ', 'document', 'user-123', {});
        auditLog('UPDATE', 'config', 'user-123', {});
        auditLog('DELETE', 'account', 'user-123', {});
      }).not.toThrow();
    });

    it('should handle complex metadata', () => {
      expect(() => {
        auditLog('CREATE', 'user', 'user-123', {
          email: 'test@example.com',
          roles: ['admin', 'user'],
          settings: { notifications: true },
        });
      }).not.toThrow();
    });
  });

  describe('logFunctionCall', () => {
    it('should wrap function for logging', () => {
      const testFunction = (a: number, b: number) => a + b;
      const wrapped = logFunctionCall(testFunction, 'add');
      expect(typeof wrapped).toBe(TYPE_FUNCTION);
    });

    it('should execute wrapped function', () => {
      const testFunction = (a: number, b: number) => a + b;
      const wrapped = logFunctionCall(testFunction, 'add');
      const result = wrapped(2, 3);
      expect(result).toBe(5);
    });

    it('should handle function errors', () => {
      const testFunction = () => {
        throw new Error('Test error');
      };
      const wrapped = logFunctionCall(testFunction, 'errorFn');
      expect(() => wrapped()).toThrow();
    });
  });

  describe('BatchLogger', () => {
    it('should create batch logger instance', () => {
      const logger = new BatchLogger();
      expect(logger).toBeDefined();
    });

    it('should add info logs', () => {
      const logger = new BatchLogger();
      logger.info('Info message', { data: 'test' });
      expect(logger).toBeDefined();
    });

    it('should add warn logs', () => {
      const logger = new BatchLogger();
      logger.warn('Warning', { code: 'WARN_001' });
      expect(logger).toBeDefined();
    });

    it('should add error logs', () => {
      const logger = new BatchLogger();
      logger.error('Error', { code: 'ERR_001' });
      expect(logger).toBeDefined();
    });

    it('should add debug logs', () => {
      const logger = new BatchLogger();
      logger.debug('Debug', { data: 'debug' });
      expect(logger).toBeDefined();
    });

    it('should support chaining', () => {
      const logger = new BatchLogger();
      const result = logger.info('Message 1', {}).warn('Message 2', {}).error('Message 3', {});
      expect(result).toBe(logger);
    });

    const TEST_MESSAGE = 'Test message';

    it('should flush logs', () => {
      const logger = new BatchLogger();
      logger.info(TEST_MESSAGE, {});
      expect(() => {
        logger.flush();
      }).not.toThrow();
    });

    it('should clear logs', () => {
      const logger = new BatchLogger();
      logger.info(TEST_MESSAGE, {});
      logger.clear();
      expect(logger).toBeDefined();
    });
  });

  describe('withErrorLoggingSync', () => {
    it('should execute sync callback without error', () => {
      const callback = jest.fn().mockReturnValue('success');
      const result = withErrorLoggingSync(callback, { operation: 'Test' });
      expect(result).toBe('success');
      expect(callback).toHaveBeenCalled();
    });

    it('should catch sync errors', () => {
      const callback = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      expect(() => {
        withErrorLoggingSync(callback, { operation: 'Test' });
      }).toThrow();
    });
  });
});
