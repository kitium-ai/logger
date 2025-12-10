import * as winston from 'winston';

import type { LoggerConfig } from '../config/logger.config';
import { contextManager } from '../context/async-context';

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

function setSchemaFieldIfPresent<K extends keyof CoreLogSchema>(
  schema: Partial<CoreLogSchema>,
  fieldName: K,
  value: CoreLogSchema[K] | undefined
): void {
  if (value !== undefined) {
    schema[fieldName] = value;
  }
}

function buildContextFields(
  info: winston.Logform.TransformableInfo,
  context: ReturnType<typeof contextManager.getContext>
): Partial<CoreLogSchema> {
  const result: Partial<CoreLogSchema> = {};

  setSchemaFieldIfPresent(
    result,
    'spanId',
    (info['spanId'] as string | undefined) ?? context.spanId
  );
  setSchemaFieldIfPresent(
    result,
    'userId',
    (info['userId'] as string | undefined) ?? context.userId
  );
  setSchemaFieldIfPresent(
    result,
    'requestId',
    (info['requestId'] as string | undefined) ?? context.requestId
  );
  setSchemaFieldIfPresent(
    result,
    'sessionId',
    (info['sessionId'] as string | undefined) ?? context.sessionId
  );
  setSchemaFieldIfPresent(
    result,
    'correlationId',
    (info['correlationId'] as string | undefined) ?? context.correlationId
  );

  return result;
}

function buildOptionalFields(
  info: winston.Logform.TransformableInfo,
  context: ReturnType<typeof contextManager.getContext>
): Partial<CoreLogSchema> {
  const result: Partial<CoreLogSchema> = {};

  const metadata =
    (info['metadata'] as Record<string, unknown> | undefined) ??
    (info['meta'] as Record<string, unknown> | undefined) ??
    context.metadata;
  setSchemaFieldIfPresent(result, 'metadata', metadata);

  const error = info['error'] as { message: string; stack?: string } | undefined;
  setSchemaFieldIfPresent(result, 'error', error);

  return result;
}

function buildCoreLogSchema(
  info: winston.Logform.TransformableInfo,
  config: LoggerConfig,
  context: ReturnType<typeof contextManager.getContext>
): CoreLogSchema {
  const normalizedMessage =
    typeof info.message === 'string' ? info.message : JSON.stringify(info.message ?? '');

  const baseSchema: Partial<CoreLogSchema> = {
    timestamp: (info['timestamp'] as string | undefined) ?? new Date().toISOString(),
    level: (info['level'] as string | undefined) ?? 'info',
    message: normalizedMessage,
    service: (info['service'] as string | undefined) ?? config.serviceName,
    environment: (info['environment'] as string | undefined) ?? config.environment,
    traceId: (info['traceId'] as string | undefined) ?? context.traceId,
  };

  const schema: Partial<CoreLogSchema> = {
    ...baseSchema,
    ...buildContextFields(info, context),
    ...buildOptionalFields(info, context),
  };

  return schema as CoreLogSchema;
}

export function applySchemaContract(config: LoggerConfig): winston.Logform.Format {
  return winston.format((info: winston.Logform.TransformableInfo) => {
    const context = contextManager.getContext();
    const schema = buildCoreLogSchema(info, config, context);

    return { ...info, ...schema };
  })();
}
