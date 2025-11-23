import { AsyncLocalStorage } from 'async_hooks';
import { v4 as uuidv4 } from 'uuid';

export type LogContext = {
  traceId: string;
  spanId?: string;
  userId?: string;
  requestId?: string;
  sessionId?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
};

class ContextManager {
  private readonly asyncLocalStorage = new AsyncLocalStorage<LogContext>();

  /**
   * Initialize context for a new trace/request
   */
  /* eslint-disable complexity */
  initContext(context?: Partial<LogContext>): LogContext {
    const newContext: LogContext = {
      traceId: context?.traceId ?? uuidv4(),
      spanId: context?.spanId ?? uuidv4(),
      requestId: context?.requestId ?? uuidv4(),
      ...(context?.userId !== undefined && { userId: context.userId }),
      ...(context?.sessionId !== undefined && { sessionId: context.sessionId }),
      ...(context?.correlationId !== undefined && { correlationId: context.correlationId }),
      ...(context?.metadata !== undefined && { metadata: context.metadata }),
    };
    return newContext;
  }

  /**
   * Run function within a context
   */
  run<T>(context: LogContext, fn: () => T): T {
    return this.asyncLocalStorage.run(context, fn);
  }

  /**
   * Get current context or create a new one
   */
  getContext(): LogContext {
    const existing = this.asyncLocalStorage.getStore();
    if (existing) {
      return existing;
    }
    return this.initContext();
  }

  /**
   * Set context values
   */
  setContext(context: Partial<LogContext>): LogContext {
    const existing = this.getContext();
    const updated = { ...existing, ...context };
    return updated;
  }

  /**
   * Get specific context value
   */
  get<K extends keyof LogContext>(key: K): LogContext[K] | undefined {
    // eslint-disable-next-line security/detect-object-injection
    return this.getContext()[key];
  }

  /**
   * Set specific context value
   */
  set<K extends keyof LogContext>(key: K, value: LogContext[K]): void {
    const context = this.getContext();
    // eslint-disable-next-line security/detect-object-injection
    context[key] = value;
  }

  /**
   * Add metadata to context
   */
  addMetadata(key: string, value: unknown): void {
    const context = this.getContext();
    context.metadata ??= {};
    // eslint-disable-next-line security/detect-object-injection
    context.metadata[key] = value;
  }

  /**
   * Clear context
   */
  clear(): void {
    // AsyncLocalStorage doesn't have an exitSyncScope method
    // Context is automatically cleared when exiting the async context
  }
}

export const contextManager = new ContextManager();
