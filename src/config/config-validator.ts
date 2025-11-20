import { LogLevel } from './logger.config';
import type { LoggerConfig } from './logger.config';
import { getLogger } from '../logger/logger';

/**
 * Configuration validation errors
 */
export class ConfigValidationError extends Error {
  constructor(
    public readonly field: string,
    message: string,
  ) {
    super(`Configuration error in field '${field}': ${message}`);
    this.name = 'ConfigValidationError';
  }
}

/**
 * Validation result with errors and warnings
 */
export interface ValidationResult {
  valid: boolean;
  errors: ConfigValidationError[];
  warnings: string[];
}

/**
 * Validates LoggerConfig and returns validation results
 */
export function validateLoggerConfig(config: LoggerConfig): ValidationResult {
  const errors: ConfigValidationError[] = [];
  const warnings: string[] = [];

  // Validate service name
  if (!config.serviceName || config.serviceName.trim().length === 0) {
    errors.push(new ConfigValidationError('serviceName', 'Service name cannot be empty'));
  } else if (config.serviceName.length > 255) {
    errors.push(new ConfigValidationError('serviceName', 'Service name must be less than 255 characters'));
  }

  // Validate environment
  const validEnvironments = ['development', 'staging', 'production'];
  if (!validEnvironments.includes(config.environment)) {
    errors.push(
      new ConfigValidationError(
        'environment',
        `Environment must be one of: ${validEnvironments.join(', ')}`,
      ),
    );
  }

  // Validate log level
  const validLevels = [LogLevel.DEBUG, LogLevel.HTTP, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
  if (!validLevels.includes(config.logLevel)) {
    errors.push(
      new ConfigValidationError(
        'logLevel',
        `Log level must be one of: ${validLevels.join(', ')}`,
      ),
    );
  }

  // Validate file transport settings
  if (config.enableFileTransport) {
    if (!config.fileLogPath || config.fileLogPath.trim().length === 0) {
      errors.push(new ConfigValidationError('fileLogPath', 'File log path cannot be empty when file transport is enabled'));
    }

    if (!isValidFileSize(config.maxFileSize)) {
      errors.push(
        new ConfigValidationError(
          'maxFileSize',
          'Invalid file size format. Use format like "10M", "100K", "1G"',
        ),
      );
    }

    if (config.maxFiles < 1) {
      errors.push(
        new ConfigValidationError('maxFiles', 'Max files must be at least 1'),
      );
    }

    if (config.maxFiles > 100) {
      warnings.push('Warning: maxFiles set to more than 100, which may impact performance');
    }
  }

  // Validate Loki settings
  if (config.loki.enabled) {
    validateLokiConfig(config.loki, errors, warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates Loki configuration
 */
function validateLokiConfig(
  loki: LoggerConfig['loki'],
  errors: ConfigValidationError[],
  warnings: string[],
): void {
  // Validate host
  if (!loki.host || loki.host.trim().length === 0) {
    errors.push(new ConfigValidationError('loki.host', 'Loki host cannot be empty'));
  }

  // Validate port
  if (loki.port < 1 || loki.port > 65535) {
    errors.push(new ConfigValidationError('loki.port', 'Loki port must be between 1 and 65535'));
  }

  // Validate protocol
  const validProtocols = ['http', 'https'];
  if (!validProtocols.includes(loki.protocol)) {
    errors.push(
      new ConfigValidationError(
        'loki.protocol',
        `Loki protocol must be one of: ${validProtocols.join(', ')}`,
      ),
    );
  }

  // Validate batch settings
  if (loki.batchSize < 1) {
    errors.push(new ConfigValidationError('loki.batchSize', 'Batch size must be at least 1'));
  }

  if (loki.batchSize > 10000) {
    warnings.push('Warning: Loki batch size is very large, which may impact memory usage');
  }

  if (loki.interval < 100) {
    warnings.push('Warning: Loki interval is less than 100ms, which may impact performance');
  }

  if (loki.timeout < 1000) {
    warnings.push('Warning: Loki timeout is less than 1000ms, which may cause timeouts');
  }

  // Validate basic auth if provided
  if (loki.basicAuth) {
    if (!loki.basicAuth.username || loki.basicAuth.username.trim().length === 0) {
      errors.push(
        new ConfigValidationError('loki.basicAuth.username', 'Username cannot be empty'),
      );
    }

    if (!loki.basicAuth.password || loki.basicAuth.password.trim().length === 0) {
      errors.push(
        new ConfigValidationError('loki.basicAuth.password', 'Password cannot be empty'),
      );
    }
  }

  // Validate labels
  if (loki.labels && Object.keys(loki.labels).length === 0) {
    warnings.push('Warning: No Loki labels provided, logs may be difficult to search');
  }
}

/**
 * Validates file size format (e.g., "10M", "100K", "1G")
 */
function isValidFileSize(size: string): boolean {
  const sizeRegex = /^(\d+\.?\d*)\s*([KMG])?B?$/i;
  return sizeRegex.test(size);
}

/**
 * Parses file size string to bytes
 */
export function parseFileSize(size: string): number {
  const sizeRegex = /^(\d+\.?\d*)\s*([KMG])?B?$/i;
  const match = size.match(sizeRegex);

  if (!match) {
    throw new Error(`Invalid file size format: ${size}`);
  }

  const [, numberStr, unit] = match;
  const number = parseFloat(numberStr);

  const multipliers: Record<string, number> = {
    K: 1024,
    M: 1024 * 1024,
    G: 1024 * 1024 * 1024,
  };

  const multiplier = multipliers[unit?.toUpperCase() ?? ''] ?? 1;
  return Math.floor(number * multiplier);
}

/**
 * Throws error if validation fails, logs warnings
 */
export function assertValidConfig(config: LoggerConfig): void {
  const result = validateLoggerConfig(config);

  // Log warnings if any
  if (result.warnings.length > 0) {
    try {
      const logger = getLogger();
      result.warnings.forEach((warning) => {
        logger.warn(warning);
      });
    } catch {
      // Logger not initialized yet, skip warning logging
      console.warn(result.warnings);
    }
  }

  // Throw if validation failed
  if (!result.valid) {
    const errorMessages = result.errors.map((e) => e.message).join('; ');
    throw new Error(`Configuration validation failed: ${errorMessages}`);
  }
}
