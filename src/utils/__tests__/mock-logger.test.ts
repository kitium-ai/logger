/**
 * Mock Logger Tests
 * Demonstrates usage of mock logger for testing
 */

import {
  MockLogger,
  createMockLogger,
  createMockLoggerWithContext,
  createLoggerSpy,
  createIsolatedMockLogger,
  MockLoggerFactory,
  createMockLoggerFactory,
} from '../mock-logger';

describe('MockLogger', () => {
  let logger: MockLogger;

  beforeEach(() => {
    logger = new MockLogger();
  });

  describe('Basic logging', () => {
    it('should capture all log calls', () => {
      logger.info('Test info message');
      logger.error('Test error message', { userId: 123 });
      logger.warn('Test warning');

      expect(logger.calls).toHaveLength(3);
      expect(logger.hasLogs()).toBe(true);
      expect(logger.hasLogs('info')).toBe(true);
      expect(logger.hasLogs('debug')).toBe(false);
    });

    it('should capture log metadata', () => {
      const metadata = { userId: 123, action: 'login' };
      logger.info('User logged in', metadata);

      const call = logger.getLastCall();
      expect(call?.message).toBe('User logged in');
      expect(call?.meta).toEqual(metadata);
      expect(call?.level).toBe('info');
    });

    it('should capture error objects', () => {
      const error = new Error('Test error');
      logger.error('Something went wrong', { code: 500 }, error);

      const call = logger.getLastCall();
      expect(call?.error).toBe(error);
      expect(call?.message).toBe('Something went wrong');
    });
  });

  describe('Context management', () => {
    it('should handle context', async () => {
      const result = await logger.withContext({ traceId: 'abc-123' }, async () => {
        logger.info('Inside context');
        return 'done';
      });

      expect(result).toBe('done');
      expect(logger.calls[0].context?.traceId).toBe('abc-123');
    });

    it('should create child loggers', () => {
      const child = logger.child({ component: 'auth' });
      child.info('Child message', { userId: 456 });

      const call = child.calls[0];
      expect(call.message).toBe('Child message');
      expect(call.meta).toEqual({ component: 'auth', userId: 456 });
    });
  });

  describe('Inspection methods', () => {
    beforeEach(() => {
      logger.error('Database connection failed', { code: 'DB_ERROR' });
      logger.info('User authenticated', { userId: 123 });
      logger.warn('Rate limit exceeded', { ip: '192.168.1.1' });
      logger.error('Validation failed', { field: 'email' });
    });

    it('should filter calls by level', () => {
      const errors = logger.getCallsByLevel('error');
      const infos = logger.getCallsByLevel('info');

      expect(errors).toHaveLength(2);
      expect(infos).toHaveLength(1);
    });

    it('should find calls by message content', () => {
      const dbCalls = logger.findCallsByMessage('database');
      const userCalls = logger.findCallsByMessage('user');

      expect(dbCalls).toHaveLength(1);
      expect(userCalls).toHaveLength(1);
    });

    it('should clear calls', () => {
      expect(logger.calls).toHaveLength(4);
      logger.clear();
      expect(logger.calls).toHaveLength(0);
    });
  });
});

describe('createMockLogger', () => {
  it('should create a new mock logger instance', () => {
    const logger = createMockLogger();
    expect(logger).toBeInstanceOf(MockLogger);
    expect(logger.calls).toHaveLength(0);
  });
});

describe('createMockLoggerWithContext', () => {
  it('should create logger with initial context', () => {
    const logger = createMockLoggerWithContext({ traceId: 'test-123', userId: 'user-456' });

    logger.info('Test message');

    expect(logger.calls[0].context).toEqual({
      traceId: 'test-123',
      userId: 'user-456',
    });
  });
});

describe('createLoggerSpy', () => {
  it('should create a spy object with logger utilities', () => {
    const spy = createLoggerSpy();

    spy.logger.info('Test message');
    spy.logger.error('Test error');

    expect(spy.calls).toHaveLength(2);
    expect(spy.hasLogs('info')).toBe(true);
    expect(spy.getLastCall()?.message).toBe('Test error');

    spy.clear();
    expect(spy.calls).toHaveLength(0);
  });
});

describe('createIsolatedMockLogger', () => {
  it('should provide testing utilities', () => {
    const { logger, reset, getLogs, assertNoErrors, assertLogged } = createIsolatedMockLogger();

    logger.info('Info message');
    logger.error('Error message');

    expect(getLogs()).toHaveLength(2);

    // This should throw because there are errors
    expect(() => assertNoErrors()).toThrow();

    reset();
    expect(getLogs()).toHaveLength(0);

    logger.warn('Warning message');
    expect(() => assertLogged('Warning')).not.toThrow();
    expect(() => assertLogged('Nonexistent')).toThrow();
  });
});

describe('MockLoggerFactory', () => {
  it('should manage multiple named loggers', () => {
    const factory = new MockLoggerFactory();

    const logger1 = factory.getLogger('auth');
    const logger2 = factory.getLogger('api');
    const logger1Again = factory.getLogger('auth');

    expect(logger1).toBe(logger1Again); // Same instance
    expect(logger1).not.toBe(logger2);

    logger1.info('Auth log');
    logger2.error('API error');

    expect(factory.getTotalCallCount()).toBe(2);
    expect(factory.getAllLoggers()).toHaveLength(2);

    factory.clearAll();
    expect(factory.getTotalCallCount()).toBe(0);
  });
});

describe('createMockLoggerFactory', () => {
  it('should create a factory instance', () => {
    const factory = createMockLoggerFactory();
    expect(factory).toBeInstanceOf(MockLoggerFactory);
  });
});

// Example usage patterns
describe('Usage Examples', () => {
  it('should work with Jest matchers (when extended)', () => {
    const logger = createMockLogger();

    // Note: In real tests, you'd call setupLoggerMatchers() in test setup
    logger.info('Test message');
    logger.error('Test error');

    // These would work if matchers were set up
    // expect(logger).toHaveLogged();
    // expect(logger).toHaveLogged('error');
    // expect(logger).toHaveLoggedMessage('Test');
    // expect(logger).toHaveLoggedLevel('info');
  });

  it('should be used for testing services', () => {
    // Example of how to test a service that uses logging
    class UserService {
      constructor(private logger: { info: (msg: string) => void; error: (msg: string) => void }) {}

      authenticate(username: string, password: string): boolean {
        this.logger.info(`Attempting authentication for ${username}`);

        if (password === 'wrong') {
          this.logger.error(`Failed authentication for ${username}`);
          return false;
        }

        this.logger.info(`Successful authentication for ${username}`);
        return true;
      }
    }

    const mockLogger = createMockLogger();
    const service = new UserService(mockLogger);

    // Test successful authentication
    const result1 = service.authenticate('john', 'correct');
    expect(result1).toBe(true);
    expect(mockLogger.findCallsByMessage('Successful')).toHaveLength(1);

    // Test failed authentication
    const result2 = service.authenticate('john', 'wrong');
    expect(result2).toBe(false);
    expect(mockLogger.findCallsByMessage('Failed')).toHaveLength(1);
  });
});
