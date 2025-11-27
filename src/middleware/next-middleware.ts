import type { LogContext } from '../context/async-context';
import { contextManager } from '../context/async-context';
import { getLogger } from '../logger/logger';
import { addMetadata } from './express-middleware';

const HEADER_TRACE_ID = 'x-trace-id';
const HEADER_SPAN_ID = 'x-span-id';
const HEADER_REQUEST_ID = 'x-request-id';
const HEADER_USER_ID = 'x-user-id';
const HEADER_SESSION_ID = 'x-session-id';
const HEADER_CORRELATION_ID = 'x-correlation-id';

type NextApiHandlerLike = (request: NextApiRequestLike, res: NextApiResponseLike) => unknown;
type NextApiRequestLike = {
  headers?: Record<string, string | string[] | undefined>;
  method?: string;
  url?: string;
  socket?: { remoteAddress?: string };
  query?: Record<string, string | string[] | undefined>;
};
type NextApiResponseLike = {
  statusCode?: number;
  status?: (code: number) => NextApiResponseLike;
  json?: (body: unknown) => unknown;
};

type NextRouteRequestLike = {
  headers: Headers;
  method: string;
  nextUrl: { pathname: string };
};

type NextRouteHandlerLike<TResponse> = (
  request: NextRouteRequestLike
) => Promise<TResponse> | TResponse;

function buildLogContextFromHeaders(headers: Headers): Partial<LogContext> {
  const context: Partial<LogContext> = {};
  const traceId = headers.get(HEADER_TRACE_ID);
  const spanId = headers.get(HEADER_SPAN_ID);
  const requestId = headers.get(HEADER_REQUEST_ID);
  const userId = headers.get(HEADER_USER_ID);
  const sessionId = headers.get(HEADER_SESSION_ID);
  const correlationId = headers.get(HEADER_CORRELATION_ID);

  if (traceId) context.traceId = traceId;
  if (spanId) context.spanId = spanId;
  if (requestId) context.requestId = requestId;
  if (userId) context.userId = userId;
  if (sessionId) context.sessionId = sessionId;
  if (correlationId) context.correlationId = correlationId;

  return context;
}

function headersFromRecord(raw?: Record<string, string | string[] | undefined>): Headers {
  const headers = new Headers();
  if (!raw) return headers;

  for (const [key, value] of Object.entries(raw)) {
    if (Array.isArray(value)) {
      value.forEach((entry) => headers.append(key, entry));
    } else if (typeof value === 'string') {
      headers.set(key, value);
    }
  }

  return headers;
}

export function withNextApiLogger(handler: NextApiHandlerLike): NextApiHandlerLike {
  return async (request, res) => {
    const headers = headersFromRecord(request.headers);
    const partialContext = buildLogContextFromHeaders(headers);
    if (!partialContext.requestId) {
      const fallbackRequestId =
        headers.get(HEADER_TRACE_ID) ??
        (typeof request.query?.['requestId'] === 'string'
          ? request.query?.['requestId']
          : undefined);
      if (fallbackRequestId) {
        partialContext.requestId = fallbackRequestId;
      }
    }
    const context = contextManager.initContext(partialContext);

    return contextManager.run(context, async () => {
      const start = Date.now();
      try {
        addMetadata('ip', request.socket?.remoteAddress);
        addMetadata('method', request.method);
        addMetadata('path', request.url);
        const result = await handler(request, res);
        getLogger().http('Next API request completed', {
          method: request.method,
          path: request.url,
          statusCode: res.statusCode,
          duration: Date.now() - start,
        });
        return result;
      } catch (error) {
        getLogger().error(
          'Next API handler error',
          { method: request.method, path: request.url },
          error as Error
        );
        throw error;
      }
    });
  };
}

export function withNextRouteLogger<TResponse>(
  handler: NextRouteHandlerLike<TResponse>
): NextRouteHandlerLike<TResponse> {
  return async (request) => {
    const partialContext = buildLogContextFromHeaders(request.headers);
    if (!partialContext.requestId) {
      const fallbackRequestId =
        request.headers.get(HEADER_TRACE_ID) ?? request.headers.get(HEADER_REQUEST_ID);
      if (fallbackRequestId) {
        partialContext.requestId = fallbackRequestId;
      }
    }
    const context = contextManager.initContext(partialContext);

    return contextManager.run(context, async () => {
      const start = Date.now();
      try {
        const response = await handler(request);
        getLogger().http('Next route completed', {
          method: request.method,
          path: request.nextUrl.pathname,
          duration: Date.now() - start,
        });
        return response;
      } catch (error) {
        getLogger().error(
          'Next route handler error',
          { method: request.method, path: request.nextUrl.pathname },
          error as Error
        );
        throw error;
      }
    });
  };
}

export function createNextFetchWrapper(fetchFunction: typeof fetch): typeof fetch {
  return async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const context = contextManager.getContext();
    const headers = new Headers(init?.headers ?? {});

    headers.set(HEADER_TRACE_ID, context.traceId);
    headers.set(HEADER_SPAN_ID, context.spanId ?? '');
    headers.set(HEADER_REQUEST_ID, context.requestId ?? context.traceId);
    if (context.userId) headers.set(HEADER_USER_ID, context.userId);
    if (context.sessionId) headers.set(HEADER_SESSION_ID, context.sessionId);
    if (context.correlationId) headers.set(HEADER_CORRELATION_ID, context.correlationId);

    return fetchFunction(input, {
      ...init,
      headers,
    });
  };
}
