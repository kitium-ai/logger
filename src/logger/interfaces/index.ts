/**
 * Segregated Logger Interfaces
 * Following Interface Segregation Principle (SOLID)
 */

export type { IContextualLogger } from './contextual-logger.interface';
export type { ICoreLogger } from './core-logger.interface';
export type { IMetricsLogger } from './metrics-logger.interface';
export type { IQueueLogger } from './queue-logger.interface';
export type { ISearchableLogger } from './searchable-logger.interface';

/**
 * Composed Interface Types for Different Logger Capabilities
 */

import type { IContextualLogger } from './contextual-logger.interface';
import type { IMetricsLogger } from './metrics-logger.interface';
import type { IQueueLogger } from './queue-logger.interface';
import type { ISearchableLogger } from './searchable-logger.interface';

/**
 * Standard logger with core + context capabilities
 * Use this for most logger implementations
 */
export type ILogger = IContextualLogger;

/**
 * Advanced logger with metrics and queue management
 * Use this for production loggers with monitoring needs
 */
export type IAdvancedLogger = IContextualLogger & IMetricsLogger & IQueueLogger;

/**
 * Full-featured logger with all capabilities including search
 * Use this for in-memory loggers or specialized implementations
 */
export type IFullFeaturedLogger = IContextualLogger &
  IMetricsLogger &
  IQueueLogger &
  ISearchableLogger;
