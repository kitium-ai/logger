import { randomBytes } from 'node:crypto';

import type { LogContext } from './async-context';

/**
 * Trace context extracted from incoming requests
 */
export type IncomingTraceContext = {
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
};

/**
 * Headers interface for framework-agnostic trace extraction
 */
export type HeaderGetter = (name: string) => string | string[] | undefined;

/**
 * TraceContextExtractor - Centralized trace context parsing and generation
 *
 * Supports multiple distributed tracing standards:
 * - W3C Trace Context (traceparent)
 * - B3 (Zipkin) headers (single and multi-header format)
 * - Custom headers (x-trace-id, x-request-id, etc.)
 */
export class TraceContextExtractor {
  /* eslint-disable @typescript-eslint/naming-convention */
  private static readonly TRACEPARENT_REGEX =
    /^[\da-f]{2}-([\da-f]{32})-([\da-f]{16})-[\da-f]{2}$/i;
  private static readonly DEFAULT_TRACE_VERSION = '00';
  /* eslint-enable @typescript-eslint/naming-convention */

  /**
   * Generate a new trace ID (16 bytes = 32 hex chars)
   */
  static generateTraceId(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Generate a new span ID (8 bytes = 16 hex chars)
   */
  static generateSpanId(): string {
    return randomBytes(8).toString('hex');
  }

  /**
   * Build a W3C traceparent header value
   */
  static buildTraceparent(traceId: string, spanId: string, sampled = '01'): string {
    const normalizedTraceId = traceId.replace(/-/g, '').padEnd(32, '0').slice(0, 32);
    const normalizedSpanId = spanId.replace(/-/g, '').padEnd(16, '0').slice(0, 16);
    return `${this.DEFAULT_TRACE_VERSION}-${normalizedTraceId}-${normalizedSpanId}-${sampled}`;
  }

  /**
   * Parse W3C traceparent header
   * Format: 00-<trace-id>-<span-id>-<flags>
   */
  static parseTraceparent(header?: string): IncomingTraceContext {
    if (!header) {
      return {};
    }

    const matches = this.TRACEPARENT_REGEX.exec(header.trim());
    if (!matches) {
      return {};
    }

    const context: IncomingTraceContext = {};
    if (matches[1]) {
      context.traceId = matches[1];
    }
    if (matches[2]) {
      context.spanId = matches[2];
    }
    return context;
  }

  /**
   * Parse combined B3 header format
   */
  private static parseB3Combined(b3Header: string): IncomingTraceContext | null {
    const parts = b3Header.split('-');
    if (parts.length < 2) {
      return null;
    }
    const result: IncomingTraceContext = {};
    if (parts[0]) {
      result.traceId = parts[0];
    }
    if (parts[1]) {
      result.spanId = parts[1];
    }
    if (parts[2]) {
      result.parentSpanId = parts[2];
    }
    return result;
  }

  /**
   * Parse B3 headers (Zipkin format)
   * Supports both single header (b3) and multi-header format
   */
  static parseB3Headers(getHeader: HeaderGetter): IncomingTraceContext {
    // Try combined B3 header first
    const b3Combined = getHeader('b3') as string | undefined;
    if (b3Combined) {
      const combined = this.parseB3Combined(b3Combined);
      if (combined) {
        return combined;
      }
    }

    // Try individual B3 headers
    return {
      traceId: (getHeader('x-b3-traceid') as string) ?? undefined,
      spanId: (getHeader('x-b3-spanid') as string) ?? undefined,
      parentSpanId: (getHeader('x-b3-parentspanid') as string) ?? undefined,
    };
  }

  /**
   * Extract trace context from headers with fallback chain:
   * 1. W3C traceparent
   * 2. B3 headers (combined or individual)
   * 3. Custom headers (x-trace-id, x-request-id)
   * 4. Generate new IDs if not found
   */
  static extractTraceContext(getHeader: HeaderGetter): IncomingTraceContext {
    // Try W3C traceparent first (preferred standard)
    const traceParent = this.parseTraceparent(getHeader('traceparent') as string);
    if (traceParent.traceId && traceParent.spanId) {
      return traceParent;
    }

    // Try B3 headers (Zipkin format)
    const b3Context = this.parseB3Headers(getHeader);
    if (b3Context.traceId || b3Context.spanId) {
      return b3Context;
    }

    // No standard trace headers found
    return {};
  }

  /**
   * Extract or generate ID with optional generation
   */
  private static extractOrGenerateId(
    existingId: string | undefined,
    getHeader: HeaderGetter,
    headerName: string,
    generator: () => string,
    generateIds: boolean
  ): string {
    return existingId ?? (getHeader(headerName) as string) ?? (generateIds ? generator() : '');
  }

  /**
   * Extract full log context from headers with fallbacks and ID generation
   * This is the main entry point for middleware
   */
  static extractLogContext(getHeader: HeaderGetter, generateIds = true): LogContext {
    const incomingContext = this.extractTraceContext(getHeader);

    const traceId = this.extractOrGenerateId(
      incomingContext.traceId,
      getHeader,
      'x-trace-id',
      () => this.generateTraceId(),
      generateIds
    );
    const spanId = this.extractOrGenerateId(
      incomingContext.spanId,
      getHeader,
      'x-span-id',
      () => this.generateSpanId(),
      generateIds
    );

    return {
      traceId,
      spanId,
      userId: (getHeader('x-user-id') as string) ?? undefined,
      sessionId: (getHeader('x-session-id') as string) ?? undefined,
      correlationId: (getHeader('x-correlation-id') as string) ?? undefined,
      requestId: (getHeader('x-request-id') as string) ?? undefined,
    };
  }

  /**
   * Set trace context response headers for downstream propagation
   */
  static setResponseHeaders(
    setHeader: (name: string, value: string) => void,
    context: LogContext
  ): void {
    if (context.traceId && context.spanId) {
      // Set W3C traceparent header
      setHeader('traceparent', this.buildTraceparent(context.traceId, context.spanId));
    }

    // Set individual headers for compatibility
    if (context.traceId) {
      setHeader('x-trace-id', context.traceId);
    }
    if (context.spanId) {
      setHeader('x-span-id', context.spanId);
    }
    if (context.correlationId) {
      setHeader('x-correlation-id', context.correlationId);
    }
    if (context.requestId) {
      setHeader('x-request-id', context.requestId);
    }
  }
}
