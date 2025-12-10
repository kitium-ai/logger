import type { EventEmitter } from 'node:events';

import { contextManager } from '../context/async-context';
import { TraceContextExtractor } from '../context/trace-context-extractor';
import { getLogger } from '../logger/logger';
import { addMetadata } from './express-middleware';

type NestHttpContextLike = {
  getRequest: () => {
    headers?: Record<string, string>;
    method?: string;
    url?: string;
  };
  getResponse: () => {
    statusCode?: number;
    status?: (code: number) => { json: (body: unknown) => void };
  };
};

type NestExecutionContextLike = {
  switchToHttp: () => NestHttpContextLike;
};

type NextFunction = () => void;

export class NestLoggerMiddleware {
  use(
    request: { headers?: Record<string, string>; method?: string; url?: string; ip?: string },
    res: EventEmitter & { statusCode?: number },
    next: NextFunction
  ): void {
    const headers = request.headers ?? {};

    // Use centralized trace context extraction
    const getHeader = (name: string): string | undefined => headers[name];
    const context = TraceContextExtractor.extractLogContext(getHeader, true);

    contextManager.run(context, () => {
      addMetadata('ip', request.ip);
      addMetadata('method', request.method);
      addMetadata('path', request.url);

      const start = Date.now();
      const logCompletion = (): void => {
        getLogger().http('Nest request completed', {
          method: request.method,
          path: request.url,
          statusCode: res.statusCode,
          duration: Date.now() - start,
        });
      };

      res.once?.('finish', logCompletion);
      res.once?.('close', logCompletion);
      next();
    });
  }
}

export function createNestExceptionFilter(): {
  catch: (exception: unknown, host: NestExecutionContextLike) => void;
} {
  return {
    catch(exception: unknown, host: NestExecutionContextLike): void {
      const context = host.switchToHttp();
      const response = context.getResponse();
      const request = context.getRequest();

      getLogger().error('Nest exception caught', {
        method: request?.method,
        path: request?.url,
        error:
          exception instanceof Error
            ? { message: exception.message, stack: exception.stack }
            : exception,
      });

      response.status?.(500).json({
        statusCode: 500,
        timestamp: new Date().toISOString(),
        path: request?.url,
      });
    },
  };
}

export function createNestLoggingMiddleware(): NestLoggerMiddleware {
  return new NestLoggerMiddleware();
}
