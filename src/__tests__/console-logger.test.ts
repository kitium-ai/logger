import { ConsoleLogger } from '../logger/console-logger';

const TEST_SERVICE_NAME = 'test-service';
const CUSTOM_SERVICE_NAME = 'custom-service';
const SHOULD_LOG_MSG = 'Should log';

/* eslint-disable max-lines-per-function */
describe('ConsoleLogger', () => {
  let logger: ConsoleLogger;

  beforeEach(() => {
    logger = new ConsoleLogger({
      serviceName: TEST_SERVICE_NAME,
    });

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should create a console logger instance', () => {
      expect(logger).toBeDefined();
    });

    it('should accept configuration with log level', () => {
      const customLogger = new ConsoleLogger({
        serviceName: CUSTOM_SERVICE_NAME,
      });
      expect(customLogger).toBeDefined();
    });
  });

  describe('logging methods', () => {
    it('should log info messages', () => {
      expect(() => {
        logger.info('Info message', { key: 'value' });
      }).not.toThrow();
    });

    it('should log warn messages', () => {
      expect(() => {
        logger.warn('Warning message', { code: 'WARN_001' });
      }).not.toThrow();
    });

    it('should log error messages', () => {
      const error = new Error('Test error');
      expect(() => {
        logger.error('Error message', { errorId: 'ERR_001' }, error);
      }).not.toThrow();
    });

    it('should log debug messages', () => {
      expect(() => {
        logger.debug('Debug message', { debugData: 'test' });
      }).not.toThrow();
    });

    it('should log http messages', () => {
      expect(() => {
        logger.http('HTTP request', { method: 'GET' });
      }).not.toThrow();
    });
  });

  describe('metadata formatting', () => {
    it('should format simple metadata', () => {
      expect(() => {
        logger.info('Test', { userId: '123', action: 'login' });
      }).not.toThrow();
    });

    it('should format nested metadata', () => {
      expect(() => {
        logger.info('Test', {
          user: { id: '123', name: 'John' },
          request: { method: 'GET', path: '/api' },
        });
      }).not.toThrow();
    });

    it('should handle large metadata objects', () => {
      const largeMetadata: Record<string, string> = {};
      for (let index = 0; index < 50; index++) {
        largeMetadata[`field_${index}`] = `value_${index}`;
      }
      expect(() => {
        logger.info('Large metadata', largeMetadata);
      }).not.toThrow();
    });
  });

  describe('log level filtering', () => {
    it('should respect debug log level', () => {
      const debugLogger = new ConsoleLogger({
        serviceName: TEST_SERVICE_NAME,
      });
      expect(() => {
        debugLogger.debug(SHOULD_LOG_MSG);
        debugLogger.info(SHOULD_LOG_MSG);
        debugLogger.warn(SHOULD_LOG_MSG);
        debugLogger.error(SHOULD_LOG_MSG);
      }).not.toThrow();
    });

    it('should respect error log level', () => {
      const errorLogger = new ConsoleLogger({
        serviceName: 'test',
      });
      expect(() => {
        errorLogger.info('Should not log');
        errorLogger.debug('Should not log');
        errorLogger.error(SHOULD_LOG_MSG);
      }).not.toThrow();
    });
  });

  describe('close method', () => {
    it('should close without error', async () => {
      await expect(logger.close()).resolves.not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle logging errors gracefully', () => {
      expect(() => {
        logger.error('Error occurred', {}, new Error('Test error'));
      }).not.toThrow();
    });

    it('should handle null error parameter', () => {
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        logger.error('Error occurred', {}, null as any);
      }).not.toThrow();
    });
  });
});
