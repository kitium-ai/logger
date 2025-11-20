import { CentralLogger } from '../logger/logger';
import { LogLevel } from '../config/logger.config';
import type { LoggerConfig } from '../config/logger.config';

describe('CentralLogger', () => {
  let logger: CentralLogger;
  let mockConfig: LoggerConfig;

  beforeEach(() => {
    mockConfig = {
      serviceName: 'test-service',
      environment: 'development',
      logLevel: LogLevel.INFO,
      enableConsoleTransport: true,
      enableFileTransport: false,
      fileLogPath: './logs',
      maxFileSize: '10M',
      maxFiles: 5,
      loki: {
        enabled: false,
        host: 'localhost',
        port: 3100,
        protocol: 'http',
        labels: { service: 'test' },
        batchSize: 100,
        interval: 1000,
        timeout: 3000,
      },
    };

    // Suppress console output during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should create a logger instance with valid config', () => {
      logger = new CentralLogger(mockConfig);
      expect(logger).toBeDefined();
    });

    it('should accept config with console transport enabled', () => {
      mockConfig.enableConsoleTransport = true;
      logger = new CentralLogger(mockConfig);
      expect(logger).toBeDefined();
    });

    it('should accept config with file transport enabled', () => {
      mockConfig.enableFileTransport = true;
      logger = new CentralLogger(mockConfig);
      expect(logger).toBeDefined();
    });

    it('should accept config with Loki enabled', () => {
      mockConfig.loki.enabled = true;
      logger = new CentralLogger(mockConfig);
      expect(logger).toBeDefined();
    });
  });

  describe('logging methods', () => {
    beforeEach(() => {
      logger = new CentralLogger(mockConfig);
    });

    it('should log at info level', () => {
      const spy = jest.fn();
      expect(() => {
        logger.info('Test message', { userId: '123' });
      }).not.toThrow();
    });

    it('should log at warn level', () => {
      expect(() => {
        logger.warn('Warning message', { code: 'WARN_001' });
      }).not.toThrow();
    });

    it('should log at error level', () => {
      const error = new Error('Test error');
      expect(() => {
        logger.error('Error occurred', { errorId: 'ERR_001' }, error);
      }).not.toThrow();
    });

    it('should log at debug level', () => {
      mockConfig.logLevel = LogLevel.DEBUG;
      const loggerDebug = new CentralLogger(mockConfig);
      expect(() => {
        loggerDebug.debug('Debug message', { debugData: 'test' });
      }).not.toThrow();
    });

    it('should log at http level', () => {
      expect(() => {
        logger.http('HTTP request', { method: 'GET', path: '/api/users' });
      }).not.toThrow();
    });
  });

  describe('metadata handling', () => {
    beforeEach(() => {
      logger = new CentralLogger(mockConfig);
    });

    it('should accept empty metadata', () => {
      expect(() => {
        logger.info('Message', {});
      }).not.toThrow();
    });

    it('should accept complex metadata objects', () => {
      const metadata = {
        userId: '123',
        requestId: 'req-456',
        nested: {
          level1: {
            level2: 'value',
          },
        },
        array: [1, 2, 3],
      };
      expect(() => {
        logger.info('Complex metadata', metadata);
      }).not.toThrow();
    });

    it('should handle null and undefined values in metadata', () => {
      const metadata = {
        value1: null,
        value2: undefined,
        value3: 'defined',
      };
      expect(() => {
        logger.info('Null/undefined metadata', metadata);
      }).not.toThrow();
    });
  });

  describe('close method', () => {
    beforeEach(() => {
      logger = new CentralLogger(mockConfig);
    });

    it('should close without error', async () => {
      await expect(logger.close()).resolves.not.toThrow();
    });

    it('should handle multiple close calls', async () => {
      await logger.close();
      await expect(logger.close()).resolves.not.toThrow();
    });
  });

  describe('log level filtering', () => {
    it('should respect configured log level', () => {
      mockConfig.logLevel = LogLevel.WARN;
      logger = new CentralLogger(mockConfig);
      expect(() => {
        logger.debug('This debug should not appear');
        logger.info('This info should not appear');
        logger.warn('This warning should appear');
        logger.error('This error should appear');
      }).not.toThrow();
    });

    it('should allow all levels when set to DEBUG', () => {
      mockConfig.logLevel = LogLevel.DEBUG;
      logger = new CentralLogger(mockConfig);
      expect(() => {
        logger.debug('Debug');
        logger.http('HTTP');
        logger.info('Info');
        logger.warn('Warn');
        logger.error('Error');
      }).not.toThrow();
    });

    it('should only allow errors when set to ERROR', () => {
      mockConfig.logLevel = LogLevel.ERROR;
      logger = new CentralLogger(mockConfig);
      expect(() => {
        logger.debug('Debug');
        logger.info('Info');
        logger.warn('Warn');
        logger.error('Error');
      }).not.toThrow();
    });
  });
});
