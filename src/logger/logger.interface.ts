/**
 * Logger Interfaces - SOLID Compliant
 *
 * This file re-exports the segregated logger interfaces for backward compatibility.
 * Use specific interfaces from ./interfaces/ for new code to follow Interface Segregation Principle.
 */

// Re-export LogEntry for backward compatibility
export type { LogEntry } from '../utils/async-logging-queue';

// Re-export segregated interfaces
export type {
  IAdvancedLogger,
  IContextualLogger,
  ICoreLogger,
  IFullFeaturedLogger,
  ILogger,
  IMetricsLogger,
  IQueueLogger,
  ISearchableLogger,
} from './interfaces';

/**
 * @deprecated Use specific interfaces (ICoreLogger, IContextualLogger, etc.) instead
 * This type is maintained for backward compatibility but will be removed in a future version
 *
 * For new code:
 * - Use ILogger for basic loggers (core + context)
 * - Use IAdvancedLogger for production loggers (core + context + metrics + queue)
 * - Use IFullFeaturedLogger for full-featured loggers (all capabilities)
 */
export type { ILogger as LegacyILogger } from './interfaces';
