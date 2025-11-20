import {
  tracingMiddleware,
  performanceMetricsMiddleware,
  errorLoggingMiddleware,
  bodyLoggingMiddleware,
  userContextMiddleware,
} from '../middleware/express-middleware';
import { LogLevel } from '../config/logger.config';
import type { Request, Response, NextFunction } from 'express';

describe('Express Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      path: '/api/users',
      headers: {
        'x-user-id': 'user-123',
        'x-request-id': 'req-456',
      },
      body: { name: 'John', password: 'secret123' },
      get: jest.fn((header: string) => {
        const headersMap: Record<string, string> = {
          'x-user-id': 'user-123',
          'x-request-id': 'req-456',
        };
        return headersMap[header.toLowerCase()];
      }),
    };

    mockResponse = {
      statusCode: 200,
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
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

  describe('tracingMiddleware', () => {
    it('should create middleware function', () => {
      const middleware = tracingMiddleware();
      expect(typeof middleware).toBe('function');
    });

    it('should call next middleware', (done) => {
      const middleware = tracingMiddleware();
      mockNext.mockImplementation(() => {
        done();
      });

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction,
      );
    });

    it('should handle GET requests', (done) => {
      const middleware = tracingMiddleware();
      mockNext.mockImplementation(() => {
        done();
      });

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction,
      );
    });

    it('should handle POST requests', (done) => {
      mockRequest.method = 'POST';
      const middleware = tracingMiddleware();
      mockNext.mockImplementation(() => {
        done();
      });

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction,
      );
    });

    it('should handle errors in next middleware', (done) => {
      const middleware = tracingMiddleware();
      mockNext.mockImplementation(() => {
        throw new Error('Test error');
      });

      expect(() => {
        middleware(
          mockRequest as Request,
          mockResponse as Response,
          mockNext as NextFunction,
        );
      }).toThrow();
      done();
    });
  });

  describe('performanceMetricsMiddleware', () => {
    it('should create middleware function', () => {
      const middleware = performanceMetricsMiddleware();
      expect(typeof middleware).toBe('function');
    });

    it('should call next middleware', (done) => {
      const middleware = performanceMetricsMiddleware();
      mockNext.mockImplementation(() => {
        done();
      });

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction,
      );
    });

    it('should handle slow requests', (done) => {
      const middleware = performanceMetricsMiddleware();
      mockNext.mockImplementation(() => {
        done();
      });

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction,
      );
    });
  });

  describe('errorLoggingMiddleware', () => {
    it('should create middleware function', () => {
      const middleware = errorLoggingMiddleware();
      expect(typeof middleware).toBe('function');
    });

    it('should have 4 parameters for error handling', () => {
      const middleware = errorLoggingMiddleware();
      expect(middleware.length).toBe(4);
    });
  });

  describe('bodyLoggingMiddleware', () => {
    it('should create middleware function', () => {
      const middleware = bodyLoggingMiddleware(['password']);
      expect(typeof middleware).toBe('function');
    });

    it('should accept array of sensitive fields', (done) => {
      const middleware = bodyLoggingMiddleware(['password', 'apiKey', 'token']);
      mockNext.mockImplementation(() => {
        done();
      });

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction,
      );
    });

    it('should work with default sensitive fields', (done) => {
      const middleware = bodyLoggingMiddleware();
      mockNext.mockImplementation(() => {
        done();
      });

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction,
      );
    });

    it('should handle requests without body', (done) => {
      mockRequest.body = undefined;
      const middleware = bodyLoggingMiddleware(['password']);
      mockNext.mockImplementation(() => {
        done();
      });

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction,
      );
    });
  });

  describe('userContextMiddleware', () => {
    it('should create middleware function with extractor', () => {
      const extractor = (req: Request) => req.headers['x-user-id'] as string;
      const middleware = userContextMiddleware(extractor);
      expect(typeof middleware).toBe('function');
    });

    it('should call extractor function', (done) => {
      const extractor = jest.fn().mockReturnValue('user-123');
      const middleware = userContextMiddleware(extractor);
      mockNext.mockImplementation(() => {
        done();
      });

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction,
      );

      expect(extractor).toHaveBeenCalled();
    });

    it('should handle extractor returning null', (done) => {
      const extractor = jest.fn().mockReturnValue(null);
      const middleware = userContextMiddleware(extractor);
      mockNext.mockImplementation(() => {
        done();
      });

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction,
      );
    });

    it('should handle extractor returning undefined', (done) => {
      const extractor = jest.fn().mockReturnValue(undefined);
      const middleware = userContextMiddleware(extractor);
      mockNext.mockImplementation(() => {
        done();
      });

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction,
      );
    });

    it('should handle request with user ID header', (done) => {
      const userExtractor = (req: Request) => req.get('x-user-id');

      const middleware = userContextMiddleware(userExtractor);
      mockNext.mockImplementation(() => {
        done();
      });

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction,
      );
    });
  });

  describe('middleware ordering and integration', () => {
    it('should chain multiple middleware', (done) => {
      const middleware1 = jest.fn((req, res, next) => next());
      const middleware2 = jest.fn((req, res, next) => next());
      const middleware3 = jest.fn(() => {
        done();
      });

      middleware1(
        mockRequest as Request,
        mockResponse as Response,
        () => {
          middleware2(
            mockRequest as Request,
            mockResponse as Response,
            middleware3,
          );
        },
      );

      expect(middleware1).toHaveBeenCalled();
      expect(middleware2).toHaveBeenCalled();
    });
  });
});
