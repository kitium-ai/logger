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
  if (!headers) {
    return undefined;
  }
  if (typeof (headers as { get?: (k: string) => HeaderValue }).get === 'function') {
    const value = (headers as { get?: (k: string) => HeaderValue }).get?.(key);
    return Array.isArray(value) ? value[0] : (value ?? undefined);
  }

  if (Object.prototype.hasOwnProperty.call(headers, key)) {
    const recordValue = (headers as Record<string, HeaderValue>)[key];
    return Array.isArray(recordValue) ? recordValue[0] : (recordValue ?? undefined);
  }
  return undefined;
}

function normalizeTraceValue(value?: string): string | undefined {
  return value?.replace(/[^a-zA-Z0-9-]/g, '');
}

function extractTraceIds(headers: HeaderSource): { traceId?: string; spanId?: string } {
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
  const result: { traceId?: string; spanId?: string } = {};
  if (traceId) {
    result.traceId = traceId;
  }
  if (spanId) {
    result.spanId = spanId;
  }
  return result;
}

function extractContextIdentifiers(headers: HeaderSource): {
  userId?: string;
  sessionId?: string;
  correlationId?: string;
  requestId?: string;
} {
  const result: {
    userId?: string;
    sessionId?: string;
    correlationId?: string;
    requestId?: string;
  } = {};
  const userId = readHeader(headers, 'x-user-id');
  const sessionId = readHeader(headers, 'x-session-id');
  const correlationId = readHeader(headers, 'x-correlation-id');
  const requestId = readHeader(headers, 'x-request-id');
  if (userId) {
    result.userId = userId;
  }
  if (sessionId) {
    result.sessionId = sessionId;
  }
  if (correlationId) {
    result.correlationId = correlationId;
  }
  if (requestId) {
    result.requestId = requestId;
  }
  return result;
}

function setContextFieldIfPresent<K extends keyof LogContext>(
  contextData: Partial<LogContext>,
  fieldName: K,
  value: LogContext[K] | undefined
): void {
  if (value !== undefined) {
    contextData[fieldName] = value;
  }
}

function buildContextData(
  extracted: {
    traceId?: string;
    spanId?: string;
    userId?: string;
    sessionId?: string;
    correlationId?: string;
    requestId?: string;
  },
  overrides: Partial<LogContext>
): Partial<LogContext> {
  const contextData: Partial<LogContext> = {};

  setContextFieldIfPresent(contextData, 'traceId', extracted.traceId ?? overrides.traceId);
  setContextFieldIfPresent(contextData, 'spanId', extracted.spanId ?? overrides.spanId);
  setContextFieldIfPresent(contextData, 'userId', extracted.userId ?? overrides.userId);
  setContextFieldIfPresent(contextData, 'sessionId', extracted.sessionId ?? overrides.sessionId);
  setContextFieldIfPresent(
    contextData,
    'correlationId',
    extracted.correlationId ?? overrides.correlationId
  );
  setContextFieldIfPresent(contextData, 'requestId', extracted.requestId ?? overrides.requestId);

  if (overrides.metadata) {
    contextData.metadata = overrides.metadata;
  }

  return contextData;
}

export function bridgeHeadersToContext(
  headers: HeaderSource,
  overrides: Partial<LogContext> = {}
): LogContext {
  const traceIds = extractTraceIds(headers);
  const identifiers = extractContextIdentifiers(headers);
  const extracted: {
    traceId?: string;
    spanId?: string;
    userId?: string;
    sessionId?: string;
    correlationId?: string;
    requestId?: string;
  } = {};
  if (traceIds.traceId) {
    extracted.traceId = traceIds.traceId;
  }
  if (traceIds.spanId) {
    extracted.spanId = traceIds.spanId;
  }
  if (identifiers.userId) {
    extracted.userId = identifiers.userId;
  }
  if (identifiers.sessionId) {
    extracted.sessionId = identifiers.sessionId;
  }
  if (identifiers.correlationId) {
    extracted.correlationId = identifiers.correlationId;
  }
  if (identifiers.requestId) {
    extracted.requestId = identifiers.requestId;
  }

  const contextData = buildContextData(extracted, overrides);

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

function getValidTraceId(spanContext_?: { traceId?: string }): { traceId?: string } {
  const traceId = spanContext_?.traceId;
  if (traceId && traceId !== '0'.repeat(32)) {
    return { traceId };
  }
  return {};
}

function getValidSpanId(spanContext_?: { spanId?: string }): { spanId?: string } {
  const spanId = spanContext_?.spanId;
  if (spanId && spanId !== '0'.repeat(16)) {
    return { spanId };
  }
  return {};
}

function extractSpanContext(otelContext_: OtelContext = otelContext.active()): {
  traceId?: string;
  spanId?: string;
  sampled: boolean;
} {
  const api = getOpenTelemetryApi();
  const span = api?.trace?.getSpan?.(otelContext_);
  const spanContext = span?.spanContext?.();

  const traceIdResult = getValidTraceId(spanContext);
  const spanIdResult = getValidSpanId(spanContext);
  const sampled = spanContext?.traceFlags === 1;

  const result: { traceId?: string; spanId?: string; sampled: boolean } = { sampled };
  if (traceIdResult.traceId) {
    result.traceId = traceIdResult.traceId;
  }
  if (spanIdResult.spanId) {
    result.spanId = spanIdResult.spanId;
  }
  return result;
}

export function bridgeOpenTelemetryContext(
  otelContext_: OtelContext = otelContext.active()
): LogContext {
  const { traceId, spanId, sampled } = extractSpanContext(otelContext_);

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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const api = require('@opentelemetry/api') as OtelApi;
    return api;
  } catch {
    return null;
  }
}

const otelContext = getOpenTelemetryApi()?.context ?? { active: () => ({}) };
