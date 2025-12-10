import type { NextFunction, Request, Response } from 'express';

import { LogLevel } from '../config/logger.config';
import { initializeLogger } from '../index';
import {
  bodyLoggingMiddleware,
  errorLoggingMiddleware,
  performanceMetricsMiddleware,
  tracingMiddleware,
  userContextMiddleware,
} from '../middleware/express-middleware';

const HTTP_METHOD_GET = 'GET';
const TYPE_FUNCTION = 'function';
const TRACING_MIDDLEWARE = 'tracingMiddleware';
const SHOULD_CREATE_MIDDLEWARE_FUNCTION = 'should create middleware function';

/* eslint-disable max-lines-per-function */
describe('Express Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

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
    mockRequest = {
      method: HTTP_METHOD_GET,
      path: '/api/users',
      /* eslint-disable @typescript-eslint/naming-convention */
      headers: {
        'x-user-id': 'user-123',
        'x-request-id': 'req-456',
      },
      /* eslint-enable @typescript-eslint/naming-convention */
      body: { name: 'John', password: 'secret123' },
      get: jest.fn((header: string): string | string[] | undefined => {
        /* eslint-disable @typescript-eslint/naming-convention */
        const headersMap: Record<string, string> = {
          'x-user-id': 'user-123',
          'x-request-id': 'req-456',
        };
        /* eslint-enable @typescript-eslint/naming-convention */
        return headersMap[header.toLowerCase()];
      }) as unknown as Request['get'],
    };

    mockResponse = {
      statusCode: 200,
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      getHeader: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      emit: jest.fn(),
    };

    mockNext = jest.fn();

    // Suppress console output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe(TRACING_MIDDLEWARE, () => {
    it(SHOULD_CREATE_MIDDLEWARE_FUNCTION, () => {
      const middleware = tracingMiddleware();
      expect(typeof middleware).toBe(TYPE_FUNCTION);
    });

    it('should call next middleware', (done) => {
      const middleware = tracingMiddleware();
      mockNext.mockImplementation(() => {
        done();
      });

      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle GET requests', (done) => {
      const middleware = tracingMiddleware();
      mockNext.mockImplementation(() => {
        done();
      });

      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle POST requests', (done) => {
      mockRequest.method = 'POST';
      const middleware = tracingMiddleware();
      mockNext.mockImplementation(() => {
        done();
      });

      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle errors in next middleware', (done) => {
      const middleware = tracingMiddleware();
      mockNext.mockImplementation(() => {
        throw new Error('Test error');
      });

      expect(() => {
        middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);
      }).toThrow('Test error');
      done();
    });
  });

  describe('performanceMetricsMiddleware', () => {
    it(SHOULD_CREATE_MIDDLEWARE_FUNCTION, () => {
      const middleware = performanceMetricsMiddleware();
      expect(typeof middleware).toBe(TYPE_FUNCTION);
    });

    it('should call next middleware', (done) => {
      const middleware = performanceMetricsMiddleware();
      mockNext.mockImplementation(() => {
        done();
      });

      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle slow requests', (done) => {
      const middleware = performanceMetricsMiddleware();
      mockNext.mockImplementation(() => {
        done();
      });

      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('errorLoggingMiddleware', () => {
    it(SHOULD_CREATE_MIDDLEWARE_FUNCTION, () => {
      const middleware = errorLoggingMiddleware();
      expect(typeof middleware).toBe(TYPE_FUNCTION);
    });

    it('should have 4 parameters for error handling', () => {
      const middleware = errorLoggingMiddleware();
      expect(middleware).toHaveLength(4);
    });
  });

  describe('bodyLoggingMiddleware', () => {
    it(SHOULD_CREATE_MIDDLEWARE_FUNCTION, () => {
      const middleware = bodyLoggingMiddleware(['password']);
      expect(typeof middleware).toBe(TYPE_FUNCTION);
    });

    it('should accept array of sensitive fields', (done) => {
      const middleware = bodyLoggingMiddleware(['password', 'apiKey', 'token']);
      mockNext.mockImplementation(() => {
        done();
      });

      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should work with default sensitive fields', (done) => {
      const middleware = bodyLoggingMiddleware();
      mockNext.mockImplementation(() => {
        done();
      });

      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle requests without body', (done) => {
      mockRequest.body = undefined;
      const middleware = bodyLoggingMiddleware(['password']);
      mockNext.mockImplementation(() => {
        done();
      });

      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('userContextMiddleware', () => {
    it('should create middleware function with extractor', () => {
      const extractor = (request: Request): string => request.headers['x-user-id'] as string;
      const middleware = userContextMiddleware(extractor);
      expect(typeof middleware).toBe(TYPE_FUNCTION);
    });

    it('should call extractor function', (done) => {
      const extractor = jest.fn().mockReturnValue('user-123');
      const middleware = userContextMiddleware(extractor);
      mockNext.mockImplementation(() => {
        done();
      });

      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(extractor).toHaveBeenCalled();
    });

    it('should handle extractor returning null', (done) => {
      const extractor = jest.fn().mockReturnValue(null);
      const middleware = userContextMiddleware(extractor);
      mockNext.mockImplementation(() => {
        done();
      });

      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
      expect(extractor).toHaveBeenCalled();
    });

    it('should handle extractor returning undefined', (done) => {
      const extractor = jest.fn();
      const middleware = userContextMiddleware(extractor);
      mockNext.mockImplementation(() => {
        done();
      });

      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
      expect(extractor).toHaveBeenCalled();
    });

    it('should handle request with user ID header', (done) => {
      const userExtractor = (request: Request): string | undefined => {
        const userHeader = request.get('x-user-id');
        if (Array.isArray(userHeader)) {
          return userHeader[0];
        }
        return userHeader;
      };

      const middleware = userContextMiddleware(userExtractor);
      mockNext.mockImplementation(() => {
        done();
      });

      middleware(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('middleware ordering and integration', () => {
    it('should chain multiple middleware', (done) => {
      const middleware1 = jest.fn((_request: Request, _res: Response, next: NextFunction): void =>
        next()
      );
      const middleware2 = jest.fn((_request: Request, _res: Response, next: NextFunction): void =>
        next()
      );
      const middleware3 = jest.fn((): void => {
        done();
      });

      middleware1(mockRequest as Request, mockResponse as Response, () => {
        middleware2(mockRequest as Request, mockResponse as Response, middleware3);
      });

      expect(middleware1).toHaveBeenCalled();
      expect(middleware2).toHaveBeenCalled();
    });
  });
});
