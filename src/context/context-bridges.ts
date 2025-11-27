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
    return Array.isArray(value) ? value[0] : (value ?? undefined);
  }

  const recordValue = (headers as Record<string, HeaderValue>)[key];
  return Array.isArray(recordValue) ? recordValue[0] : (recordValue ?? undefined);
}

function normalizeTraceValue(value?: string): string | undefined {
  return value?.replace(/[^a-zA-Z0-9\-]/g, '');
}

export function bridgeHeadersToContext(
  headers: HeaderSource,
  overrides: Partial<LogContext> = {}
): LogContext {
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

  const contextData: Partial<LogContext> = {};

  const finalTraceId = traceId ?? overrides.traceId;
  if (finalTraceId) {
    contextData.traceId = finalTraceId;
  }

  const finalSpanId = spanId ?? overrides.spanId;
  if (finalSpanId) {
    contextData.spanId = finalSpanId;
  }

  const finalUserId = userId ?? overrides.userId;
  if (finalUserId) {
    contextData.userId = finalUserId;
  }

  const finalSessionId = sessionId ?? overrides.sessionId;
  if (finalSessionId) {
    contextData.sessionId = finalSessionId;
  }

  const finalCorrelationId = correlationId ?? overrides.correlationId;
  if (finalCorrelationId) {
    contextData.correlationId = finalCorrelationId;
  }

  const finalRequestId = requestId ?? overrides.requestId;
  if (finalRequestId) {
    contextData.requestId = finalRequestId;
  }

  if (overrides.metadata) {
    contextData.metadata = overrides.metadata;
  }

  return contextManager.initContext(contextData);
}

export function bridgeExpressRequest(request: RequestLike): LogContext {
  const expressOverrides: Partial<LogContext> = {};
  if (request.user?.id) {
    expressOverrides.userId = request.user.id;
  }
  const context = bridgeHeadersToContext(request.headers ?? request, expressOverrides);

  return contextManager.run(context, () => contextManager.getContext());
}

export function bridgeNextRequest(headers: HeaderSource): LogContext {
  const context = bridgeHeadersToContext(headers);
  return contextManager.run(context, () => contextManager.getContext());
}

export function bridgeOpenTelemetryContext(
  otelContext_: OtelContext = otelContext.active()
): LogContext {
  const api = getOpenTelemetryApi();
  const span = api?.trace?.getSpan?.(otelContext_);
  const spanContext = span?.spanContext?.();

  const traceId =
    spanContext?.traceId && spanContext.traceId !== '0'.repeat(32)
      ? spanContext.traceId
      : undefined;
  const spanId =
    spanContext?.spanId && spanContext.spanId !== '0'.repeat(16) ? spanContext.spanId : undefined;
  const sampled = spanContext?.traceFlags === 1;

  const otelData: Partial<LogContext> = {};

  if (traceId) {
    otelData.traceId = traceId;
  }
  if (spanId) {
    otelData.spanId = spanId;
  }
  if (sampled) {
    otelData.correlationId = 'sampled';
  }

  const context = contextManager.initContext(otelData);

  return contextManager.run(context, () => contextManager.getContext());
}

type OtelContext = unknown;
type OtelApi = {
  context?: { active: () => OtelContext };
  trace?: {
    getSpan: (
      context: OtelContext
    ) =>
      | { spanContext?: () => { traceId?: string; spanId?: string; traceFlags?: number } }
      | undefined;
  };
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
