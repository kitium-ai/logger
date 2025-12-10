import { contextManager, type LogContext } from '../context/async-context';
import { TraceContextExtractor } from '../context/trace-context-extractor';
import { getLogger } from '../logger/logger';
import { addMetadata } from './express-middleware';

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

function buildLogContextFromHeaders(headers: Headers): LogContext {
  // Create a header getter function for TraceContextExtractor
  const getHeader = (name: string): string | undefined => headers.get(name) ?? undefined;

  // Use centralized trace context extraction
  return TraceContextExtractor.extractLogContext(getHeader, true);
}

function headersFromRecord(raw?: Record<string, string | string[] | undefined>): Headers {
  const headers = new Headers();
  if (!raw) {
    return headers;
  }

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
    const context = buildLogContextFromHeaders(headers);

    // Fallback for requestId if not extracted
    if (!context.requestId && typeof request.query?.['requestId'] === 'string') {
      context.requestId = request.query['requestId'];
    }

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
    const context = buildLogContextFromHeaders(request.headers);

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

    // Use centralized header setting for consistent trace propagation
    TraceContextExtractor.setResponseHeaders((name, value) => headers.set(name, value), context);

    return fetchFunction(input, {
      ...init,
      headers,
    });
  };
}
