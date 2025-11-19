/**
 * Examples demonstrating different logger types
 */

import {
  LoggerBuilder,
  LoggerFactory,
  LoggerType,
  getLoggerConfig,
} from '../index';

/**
 * Example 1: Console Logger - Simple development logging
 */
export function exampleConsoleLogger() {
  console.log('\n=== Console Logger Example ===');

  // Using builder pattern
  const logger = LoggerBuilder.console('my-app');

  logger.info('Application started', { version: '1.0.0' });
  logger.debug('Debug information', { environment: 'development' });
  logger.warn('Warning message', { threshold: 100 });

  const error = new Error('Something went wrong');
  logger.error('An error occurred', { code: 'ERR_001' }, error);
}

/**
 * Example 2: In-Memory Logger - Testing and debugging
 */
export function exampleInMemoryLogger() {
  console.log('\n=== In-Memory Logger Example ===');

  // Using builder pattern
  const logger = LoggerBuilder.inMemory('my-app', 1000) as InMemoryLogger;

  // Simulate some logging
  for (let i = 0; i < 5; i++) {
    logger.info(`Processing item ${i}`, { itemId: i });
  }

  logger.warn('High memory usage detected', { usage: '85%' });
  logger.error('Database connection failed', { attempt: 1 }, new Error('Connection timeout'));

  // Query logs
  console.log('\nTotal logs:', logger.getLogs().length);
  console.log('Stats:', logger.getStats());

  // Get specific logs
  const errors = logger.getLogsByLevel('error');
  console.log('Error logs:', errors.length);

  // Export logs
  const exported = logger.exportByLevel('info');
  console.log('Exported info logs:', exported);
}

/**
 * Example 3: File Logger - Production logging
 */
export function exampleFileLogger() {
  console.log('\n=== File Logger Example ===');

  const logger = LoggerBuilder.file('my-app', './logs/app')
    .withMaxFileSize('50m')
    .withMaxFiles(7)
    .build();

  logger.info('Application started', { pid: process.pid });
  logger.debug('Processing request', { requestId: 'req-123', duration: 45 });
  logger.warn('Slow query detected', { queryTime: 5000 });

  const error = new Error('Database error');
  logger.error('Operation failed', { operation: 'createUser' }, error);

  // Logs are written to ./logs/app/ directory with daily rotation
  console.log('Logs written to ./logs/app/ directory');
}

/**
 * Example 4: Central Logger - Cloud-native with Loki
 */
export async function exampleCentralLogger() {
  console.log('\n=== Central Logger Example ===');

  const config = getLoggerConfig();
  const logger = LoggerBuilder.central(config);

  logger.info('Application started', {
    version: '1.0.0',
    environment: config.environment,
  });

  logger.debug('Initializing services', { services: ['db', 'cache', 'auth'] });
  logger.http('HTTP request', {
    method: 'GET',
    path: '/api/users',
    statusCode: 200,
    duration: 145,
  });

  const error = new Error('Service unavailable');
  logger.error('Failed to connect to service', { service: 'payment-api' }, error);

  // Logs are sent to Loki and can be queried in Grafana
  console.log('Logs sent to Loki at', `${config.loki.protocol}://${config.loki.host}:${config.loki.port}`);

  // Close logger to flush logs
  await logger.close();
}

/**
 * Example 5: Using LoggerFactory
 */
export function exampleLoggerFactory() {
  console.log('\n=== LoggerFactory Example ===');

  // Create console logger
  const consoleLogger = LoggerFactory.create({
    type: LoggerType.CONSOLE,
    serviceName: 'factory-app',
  });

  consoleLogger.info('Created with factory', { type: 'console' });

  // Create from string
  const fileLogger = LoggerFactory.createFromString('file', {
    type: LoggerType.FILE,
    serviceName: 'factory-app',
    logPath: './logs/factory',
  });

  fileLogger.info('Created with factory', { type: 'file' });
}

/**
 * Example 6: Global Logger with Auto-initialization
 */
export function exampleGlobalLogger() {
  console.log('\n=== Global Logger Example ===');

  import { initGlobalLogger, getGlobalLogger } from '../index';

  // Initialize global logger
  initGlobalLogger({
    type: LoggerType.CONSOLE,
    serviceName: 'global-app',
  });

  // Get and use global logger
  const logger = getGlobalLogger();
  logger.info('Using global logger');
}

/**
 * Example 7: Logger with Context
 */
export async function exampleLoggerWithContext() {
  console.log('\n=== Logger with Context Example ===');

  const logger = LoggerBuilder.console('context-app');

  // Run code with request context
  await logger.withContext(
    {
      traceId: 'trace-123',
      userId: 'user-456',
      requestId: 'req-789',
      sessionId: 'session-abc',
    },
    async () => {
      logger.info('Processing user request');
      logger.debug('Validating input', { input: 'data' });
      logger.info('Request completed');
      // All logs will include traceId, userId, requestId, sessionId
    },
  );
}

/**
 * Example 8: Switching Logger Types Dynamically
 */
export function exampleDynamicLoggerType() {
  console.log('\n=== Dynamic Logger Type Example ===');

  const loggerType = process.env.LOGGER_TYPE || 'console';

  const logger = LoggerFactory.createFromString(loggerType, {
    type: LoggerType.CONSOLE,
    serviceName: 'dynamic-app',
    logPath: './logs',
  });

  console.log(`Using ${loggerType} logger`);
  logger.info('Dynamic logger initialized', { type: loggerType });
}

/**
 * Example 9: Development vs Production Setup
 */
export function exampleEnvironmentSetup() {
  console.log('\n=== Environment-based Setup Example ===');

  const isDev = process.env.NODE_ENV === 'development';
  const isProd = process.env.NODE_ENV === 'production';

  let logger;

  if (isDev) {
    // Development: Console + In-memory for debugging
    console.log('Setting up development logger (console)');
    logger = LoggerBuilder.console('app');
  } else if (isProd) {
    // Production: Central (Loki) for cloud-native setup
    console.log('Setting up production logger (central/loki)');
    const config = getLoggerConfig();
    logger = LoggerBuilder.central(config);
  } else {
    // Staging: File-based logging with console output
    console.log('Setting up staging logger (file)');
    logger = LoggerBuilder.file('app', './logs/staging')
      .withConsole(true)
      .build();
  }

  logger.info('Logger initialized for environment', { env: process.env.NODE_ENV });
}

/**
 * Example 10: Custom Configuration per Logger Type
 */
export function exampleCustomConfiguration() {
  console.log('\n=== Custom Configuration Example ===');

  // Console logger with custom settings
  const consoleLogger = new LoggerBuilder()
    .withType(LoggerType.CONSOLE)
    .withServiceName('custom-app')
    .withColors(true)
    .withTimestamps(true)
    .build();

  consoleLogger.info('Console logger with colors and timestamps');

  // File logger with custom rotation
  const fileLogger = new LoggerBuilder()
    .withType(LoggerType.FILE)
    .withServiceName('custom-app')
    .withLogPath('./logs/custom')
    .withMaxFileSize('50m')
    .withMaxFiles(10)
    .withConsole(false) // No console output
    .build();

  fileLogger.info('File logger with custom rotation settings');

  // In-memory logger with large capacity
  const memoryLogger = new LoggerBuilder()
    .withType(LoggerType.IN_MEMORY)
    .withServiceName('custom-app')
    .withMaxInMemoryLogs(50000)
    .build();

  memoryLogger.info('In-memory logger with 50k capacity');
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  try {
    exampleConsoleLogger();
    exampleInMemoryLogger();
    exampleFileLogger();
    // await exampleCentralLogger();
    exampleLoggerFactory();
    // exampleGlobalLogger();
    await exampleLoggerWithContext();
    exampleDynamicLoggerType();
    exampleEnvironmentSetup();
    exampleCustomConfiguration();

    console.log('\n=== All examples completed ===\n');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}
