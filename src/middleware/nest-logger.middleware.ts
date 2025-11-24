import type { EventEmitter } from 'node:events';
import { contextManager } from '../context/async-context';
import type { LogContext } from '../context/async-context';
import { getLogger } from '../logger/logger';
import { addMetadata } from './express-middleware';

const HEADER_TRACE_ID = 'x-trace-id';
const HEADER_SPAN_ID = 'x-span-id';
const HEADER_REQUEST_ID = 'x-request-id';
const HEADER_USER_ID = 'x-user-id';
const HEADER_SESSION_ID = 'x-session-id';
const HEADER_CORRELATION_ID = 'x-correlation-id';

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
    req: { headers?: Record<string, string>; method?: string; url?: string; ip?: string },
    res: EventEmitter & { statusCode?: number },
    next: NextFunction
  ) {
    const partialContext: Partial<LogContext> = {};
    const headers = req.headers ?? {};

    const traceId = headers[HEADER_TRACE_ID];
    const spanId = headers[HEADER_SPAN_ID];
    const requestId = headers[HEADER_REQUEST_ID];
    const userId = headers[HEADER_USER_ID];
    const sessionId = headers[HEADER_SESSION_ID];
    const correlationId = headers[HEADER_CORRELATION_ID];

    if (traceId) partialContext.traceId = traceId;
    if (spanId) partialContext.spanId = spanId;
    if (requestId) partialContext.requestId = requestId;
    if (userId) partialContext.userId = userId;
    if (sessionId) partialContext.sessionId = sessionId;
    if (correlationId) partialContext.correlationId = correlationId;

    const context = contextManager.initContext(partialContext);

    contextManager.run(context, () => {
      addMetadata('ip', req.ip);
      addMetadata('method', req.method);
      addMetadata('path', req.url);

      const start = Date.now();
      const logCompletion = () => {
        getLogger().http('Nest request completed', {
          method: req.method,
          path: req.url,
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

export function createNestExceptionFilter() {
  return {
    catch(exception: unknown, host: NestExecutionContextLike) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse();
      const request = ctx.getRequest();

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
