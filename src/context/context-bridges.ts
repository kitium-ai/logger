import { contextManager, type LogContext } from './async-context';

type HeaderValue = string | string[] | undefined;
type HeaderSource = { get?(key: string): HeaderValue } | Record<string, HeaderValue>;

type RequestLike = {
  headers?: HeaderSource;
  get?(key: string): HeaderValue;
  method?: string;
  url?: string;
  path?: string;
  ip?: string;
  user?: { id?: string };
};

function readHeader(headers: HeaderSource | undefined, key: string): string | undefined {
  if (!headers) return undefined;
  if (typeof (headers as { get?: (k: string) => HeaderValue }).get === 'function') {
    const value = (headers as { get?: (k: string) => HeaderValue }).get?.(key);
    return Array.isArray(value) ? value[0] : value ?? undefined;
  }

  const recordValue = (headers as Record<string, HeaderValue>)[key];
  return Array.isArray(recordValue) ? recordValue[0] : recordValue ?? undefined;
}

function normalizeTraceValue(value?: string): string | undefined {
  return value?.replace(/[^a-zA-Z0-9\-]/g, '');
}

export function bridgeHeadersToContext(headers: HeaderSource, overrides: Partial<LogContext> = {}): LogContext {
  const traceId = normalizeTraceValue(
    readHeader(headers, 'traceparent')?.split('-')[1] ??
      (readHeader(headers, 'x-b3-traceid') as string | undefined) ??
      (readHeader(headers, 'x-trace-id') as string | undefined)
  );
  const spanId = normalizeTraceValue(
    readHeader(headers, 'traceparent')?.split('-')[2] ??
      (readHeader(headers, 'x-b3-spanid') as string | undefined) ??
      (readHeader(headers, 'x-span-id') as string | undefined)
  );
  const userId = readHeader(headers, 'x-user-id');
  const sessionId = readHeader(headers, 'x-session-id');
  const correlationId = readHeader(headers, 'x-correlation-id');
  const requestId = readHeader(headers, 'x-request-id');

  return contextManager.initContext({
    traceId: traceId ?? overrides.traceId,
    spanId: spanId ?? overrides.spanId,
    userId: userId ?? overrides.userId,
    sessionId: sessionId ?? overrides.sessionId,
    correlationId: correlationId ?? overrides.correlationId,
    requestId: requestId ?? overrides.requestId,
    metadata: overrides.metadata,
  });
}

export function bridgeExpressRequest(req: RequestLike): LogContext {
  const context = bridgeHeadersToContext(req.headers ?? req, {
    userId: req.user?.id,
  });

  return contextManager.run(context, () => contextManager.getContext());
}

export function bridgeNextRequest(headers: HeaderSource): LogContext {
  const context = bridgeHeadersToContext(headers);
  return contextManager.run(context, () => contextManager.getContext());
}

export function bridgeOpenTelemetryContext(otelCtx: OtelContext = otelContext.active()): LogContext {
  const api = getOpenTelemetryApi();
  const span = api?.trace?.getSpan?.(otelCtx);
  const spanContext = span?.spanContext?.();

  const traceId = spanContext?.traceId && spanContext.traceId !== '0'.repeat(32)
    ? spanContext.traceId
    : undefined;
  const spanId = spanContext?.spanId && spanContext.spanId !== '0'.repeat(16)
    ? spanContext.spanId
    : undefined;
  const sampled = spanContext?.traceFlags === 1;

  const context = contextManager.initContext({
    traceId: traceId ?? undefined,
    spanId: spanId ?? undefined,
    correlationId: sampled ? 'sampled' : undefined,
  });

  return contextManager.run(context, () => contextManager.getContext());
}

type OtelContext = unknown;
type OtelApi = {
  context?: { active: () => OtelContext };
  trace?: { getSpan: (context: OtelContext) => { spanContext?: () => { traceId?: string; spanId?: string; traceFlags?: number } } | undefined };
};

function getOpenTelemetryApi(): OtelApi | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
    const api = require('@opentelemetry/api') as OtelApi;
    return api;
  } catch {
    return null;
  }
}

const otelContext = getOpenTelemetryApi()?.context ?? { active: () => ({}) };
