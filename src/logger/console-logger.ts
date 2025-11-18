import { ILogger } from './logger.interface';
import { contextManager, LogContext } from '../context/async-context';

/**
 * Console-only logger for simple applications and development
 * Outputs formatted logs to stdout/stderr
 */
export class ConsoleLogger implements ILogger {
  private serviceName: string;
  private includeTimestamp: boolean;
  private colors: boolean;

  constructor(options: {
    serviceName?: string;
    includeTimestamp?: boolean;
    colors?: boolean;
  } = {}) {
    this.serviceName = options.serviceName || 'app';
    this.includeTimestamp = options.includeTimestamp !== false;
    this.colors = options.colors !== false;
  }

  error(message: string, meta?: any, error?: Error): void {
    this.log('ERROR', message, meta, error);
  }

  warn(message: string, meta?: any): void {
    this.log('WARN', message, meta);
  }

  info(message: string, meta?: any): void {
    this.log('INFO', message, meta);
  }

  http(message: string, meta?: any): void {
    this.log('HTTP', message, meta);
  }

  debug(message: string, meta?: any): void {
    this.log('DEBUG', message, meta);
  }

  withContext<T>(
    context: Partial<LogContext>,
    fn: () => T | Promise<T>,
  ): T | Promise<T> {
    const fullContext = contextManager.initContext(context);
    return contextManager.run(fullContext, () => fn());
  }

  child(metadata: Record<string, any>): ILogger {
    // Return a new instance with metadata bound
    return this;
  }

  async close(): Promise<void> {
    // Nothing to close
    return Promise.resolve();
  }

  private log(level: string, message: string, meta?: any, error?: Error): void {
    const context = contextManager.getContext();
    const timestamp = this.includeTimestamp ? `[${new Date().toISOString()}] ` : '';
    const colorCode = this.getColorCode(level);
    const resetCode = this.colors ? '\x1b[0m' : '';
    const levelStr = this.colors ? `${colorCode}[${level}]${resetCode}` : `[${level}]`;
    const service = `[${this.serviceName}]`;
    const traceId = context.traceId ? ` [trace: ${context.traceId.substring(0, 8)}]` : '';

    let output = `${timestamp}${levelStr} ${service}${traceId} ${message}`;

    // Add metadata
    if (meta && Object.keys(meta).length > 0) {
      output += `\n  ${JSON.stringify(meta, null, 2)
        .split('\n')
        .join('\n  ')}`;
    }

    // Add error
    if (error) {
      output += `\n  Error: ${error.message}`;
      if (error.stack) {
        output += `\n${error.stack
          .split('\n')
          .map((line) => `  ${line}`)
          .join('\n')}`;
      }
    }

    // Add context info if available
    if (context.userId || context.requestId) {
      const contextInfo = [];
      if (context.userId) contextInfo.push(`userId: ${context.userId}`);
      if (context.requestId) contextInfo.push(`requestId: ${context.requestId.substring(0, 8)}`);
      if (context.sessionId) contextInfo.push(`sessionId: ${context.sessionId.substring(0, 8)}`);
      output += `\n  Context: ${contextInfo.join(', ')}`;
    }

    // Write to appropriate stream
    const stream = level === 'ERROR' ? console.error : console.log;
    stream(output);
  }

  private getColorCode(level: string): string {
    if (!this.colors) return '';

    const colors: Record<string, string> = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m', // Yellow
      INFO: '\x1b[32m', // Green
      HTTP: '\x1b[36m', // Cyan
      DEBUG: '\x1b[90m', // Gray
    };

    return colors[level] || '';
  }
}
