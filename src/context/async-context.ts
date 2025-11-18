import { AsyncLocalStorage } from 'async_hooks';
import { v4 as uuidv4 } from 'uuid';

export interface LogContext {
  traceId: string;
  spanId?: string;
  userId?: string;
  requestId?: string;
  sessionId?: string;
  correlationId?: string;
  metadata?: Record<string, any>;
}

class ContextManager {
  private asyncLocalStorage = new AsyncLocalStorage<LogContext>();

  /**
   * Initialize context for a new trace/request
   */
  initContext(context?: Partial<LogContext>): LogContext {
    const newContext: LogContext = {
      traceId: context?.traceId || uuidv4(),
      spanId: context?.spanId || uuidv4(),
      userId: context?.userId,
      requestId: context?.requestId || uuidv4(),
      sessionId: context?.sessionId,
      correlationId: context?.correlationId,
      metadata: context?.metadata,
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
    return this.getContext()[key];
  }

  /**
   * Set specific context value
   */
  set<K extends keyof LogContext>(key: K, value: LogContext[K]): void {
    const context = this.getContext();
    context[key] = value;
  }

  /**
   * Add metadata to context
   */
  addMetadata(key: string, value: any): void {
    const context = this.getContext();
    if (!context.metadata) {
      context.metadata = {};
    }
    context.metadata[key] = value;
  }

  /**
   * Clear context
   */
  clear(): void {
    this.asyncLocalStorage.exitSyncScope();
  }
}

export const contextManager = new ContextManager();
