import { initializeLogger, type ILogger } from './logger';
import {
  getLoggerConfig,
  getPresetConfig,
  type LoggerConfig,
  type LoggerPreset,
} from '../config/logger.config';

export function createLogger(
  presetOrConfig?: LoggerPreset | LoggerConfig,
  overrides: Partial<LoggerConfig> = {}
): ILogger {
  if (!presetOrConfig) {
    const envConfig = getLoggerConfig();
    return initializeLogger(mergeConfig(envConfig, overrides));
  }

  if (typeof presetOrConfig === 'string') {
    const presetConfig = getPresetConfig(presetOrConfig, overrides);
    return initializeLogger(presetConfig);
  }

  return initializeLogger(mergeConfig(presetOrConfig, overrides));
}

function mergeConfig(config: LoggerConfig, overrides: Partial<LoggerConfig>): LoggerConfig {
  return {
    ...config,
    ...overrides,
    loki: { ...config.loki, ...overrides.loki },
  };
}
