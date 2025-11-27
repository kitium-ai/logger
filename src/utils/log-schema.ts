import * as winston from 'winston';
import { contextManager } from '../context/async-context';
import type { LoggerConfig } from '../config/logger.config';

export type CoreLogSchema = {
  timestamp: string;
  level: string;
  message: string;
  service: string;
  environment: string;
  traceId: string;
  spanId?: string;
  userId?: string;
  requestId?: string;
  sessionId?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
  error?: { message: string; stack?: string };
};

export function applySchemaContract(
  config: LoggerConfig
): winston.Logform.Format {
  return winston.format((info: winston.Logform.TransformableInfo) => {
    const context = contextManager.getContext();
    const normalizedMessage =
      typeof info.message === 'string'
        ? info.message
        : JSON.stringify(info.message ?? '');

    const schema: CoreLogSchema = {
      timestamp: info.timestamp ?? new Date().toISOString(),
      level: info.level ?? 'info',
      message: normalizedMessage,
      service: (info.service as string) ?? config.serviceName,
      environment: (info.environment as string) ?? config.environment,
      traceId: (info.traceId as string) ?? context.traceId,
      spanId: (info.spanId as string) ?? context.spanId,
      userId: (info.userId as string) ?? context.userId,
      requestId: (info.requestId as string) ?? context.requestId,
      sessionId: (info.sessionId as string) ?? context.sessionId,
      correlationId: (info.correlationId as string) ?? context.correlationId,
      metadata:
        (info.metadata as Record<string, unknown>) ??
        (info.meta as Record<string, unknown>) ??
        context.metadata,
      error: info.error as { message: string; stack?: string },
    };

    return { ...info, ...schema };
  })();
}
