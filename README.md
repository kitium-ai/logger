# Centralized Logging System

An enterprise-ready centralized logging system with structured logging and Grafana Loki integration
for cloud-native applications.

## What is @kitiumai/logger?

**@kitiumai/logger** is a comprehensive, enterprise-grade logging solution designed specifically for modern Node.js applications. It provides structured logging, distributed tracing, centralized log aggregation, and extensive middleware support for frameworks like Express.js, Next.js, and NestJS.

### Key Capabilities

- **5 Logger Types**: Console, File, In-Memory, and Central (Grafana Loki) logging
- **Framework Integration**: Native middleware for Express, Next.js, NestJS, and Fastify
- **Distributed Tracing**: Automatic trace ID/span ID propagation with OpenTelemetry support
- **Security Features**: Automatic PII detection and redaction
- **Performance Monitoring**: Request timing, memory tracking, and custom metrics
- **Testing Support**: Complete mock logger implementations for Jest/Vitest
- **Type Safety**: Full TypeScript support with comprehensive type definitions

## Why Do You Need This Package?

In modern cloud-native applications, logging is critical for:

### 🔍 **Observability & Debugging**
- **Distributed Tracing**: Track requests across microservices with automatic trace/span ID correlation
- **Context Propagation**: Maintain user, session, and request context throughout async operations
- **Performance Monitoring**: Track response times, memory usage, and custom business metrics

### 🛡️ **Security & Compliance**
- **PII Protection**: Automatic detection and redaction of sensitive data (passwords, tokens, API keys)
- **Audit Logging**: Compliance-ready audit trails with structured, tamper-evident logs
- **Security Monitoring**: Integration with security information and event management (SIEM) systems

### 🚀 **Production Reliability**
- **Centralized Aggregation**: All logs in one place with Grafana Loki for easy querying and analysis
- **Error Tracking**: Structured error logging with stack traces and contextual metadata
- **Health Monitoring**: Built-in health checks and circuit breakers for resilient logging

### 🧪 **Developer Experience**
- **Testing Support**: Comprehensive mocking utilities eliminate the need to write custom mocks
- **Type Safety**: Full TypeScript support prevents logging-related runtime errors
- **Framework Integration**: Drop-in middleware for popular Node.js frameworks

## Competitor Comparison

| Feature | @kitiumai/logger | Winston | Pino | Bunyan | Morgan |
|---------|------------------|---------|------|--------|--------|
| **Logger Types** | 5 (Console, File, Memory, Loki) | 4+ | 3 | 3 | 1 |
| **Loki Integration** | ✅ Native | ❌ Manual | ❌ Manual | ❌ Manual | ❌ |
| **Framework Middleware** | Express, Next.js, NestJS, Fastify | Basic Express | Basic Express | Basic Express | Express Only |
| **Distributed Tracing** | ✅ OpenTelemetry | ❌ | ❌ | ❌ | ❌ |
| **PII Redaction** | ✅ Automatic | ❌ | ❌ | ❌ | ❌ |
| **Testing Mocks** | ✅ Complete | ❌ | ❌ | ❌ | ❌ |
| **TypeScript Support** | ✅ Full | ⚠️ Partial | ⚠️ Partial | ⚠️ Partial | ❌ |
| **Performance Metrics** | ✅ Built-in | ❌ | ❌ | ❌ | ❌ |
| **Health Checks** | ✅ Built-in | ❌ | ❌ | ❌ | ❌ |
| **Bundle Size** | 🟢 Small (Tree-shakeable) | 🟡 Medium | 🟢 Small | 🟡 Medium | 🟢 Small |

## Unique Selling Proposition (USP)

### 🎯 **Production-Ready Enterprise Features**
Unlike basic logging libraries, @kitiumai/logger includes enterprise-grade features out-of-the-box:

- **Cloud-Native Architecture**: Native Grafana Loki integration for scalable log aggregation
- **Security-First Design**: Automatic PII detection and compliance-ready audit logging
- **Framework Agnostic**: Works seamlessly across Express, Next.js, NestJS, and Fastify
- **Zero-Config Testing**: Complete mock implementations eliminate testing friction

### 🚀 **Developer Productivity**
- **One-Line Setup**: Environment-based auto-configuration for development/staging/production
- **Type-Safe APIs**: Full TypeScript support prevents logging bugs at compile time
- **Rich Context**: Automatic propagation of trace IDs, user context, and session data
- **Performance Insights**: Built-in metrics collection and performance monitoring

### 🛡️ **Compliance & Security**
- **GDPR/CCPA Ready**: Automatic sensitive data redaction and privacy protection
- **Audit Trails**: Structured, immutable audit logs for regulatory compliance
- **Security Monitoring**: Integration points for SIEM systems and security alerting

## Features

✅ **Multiple Logger Types** - Console, File, In-Memory, or Central (Loki) logging ✅ **Structured
Logging** - JSON-formatted logs with contextual metadata ✅ **Distributed Tracing** - Automatic
trace ID and span ID tracking ✅ **Grafana Loki Integration** - Cloud-native log aggregation and
analysis ✅ **TypeScript Support** - Full type safety and excellent IDE support ✅ **Express.js
Middleware** - Out-of-the-box HTTP request/response logging ✅ **Error Tracking** - Automatic error
logging with stack traces ✅ **Performance Metrics** - Request duration and memory usage tracking ✅
**Request Context** - Async context for user, session, and request metadata ✅ **Sensitive Data
Filtering** - Automatic redaction of passwords, tokens, and API keys ✅ **Builder Pattern** - Fluent
API for easy logger configuration ✅ **Log Levels** - error, warn, info, http, debug ✅ **Audit
Logging** - Compliance-ready audit trail support

## Structured Logging Implementation ✨

This package implements a **complete, production-ready structured logging system** with all core features fully verified and documented. See [STRUCTURED_LOGGING_IMPLEMENTATION.md](./STRUCTURED_LOGGING_IMPLEMENTATION.md) for comprehensive verification of:

- ✅ **Log Level Management** - 5 custom log levels (error, warn, info, http, debug) with full configuration
- ✅ **Centralized Log Aggregation** - Winston + Grafana Loki integration with batching and reliability
- ✅ **Log Formatting Standards** - Structured JSON with contextual metadata, colored console output
- ✅ **Request/Response Logging** - 5+ Express middleware functions for comprehensive HTTP logging
- ✅ **Performance Logging** - Automatic duration tracking, memory monitoring, and metrics collection
- ✅ **Distributed Tracing** - Trace IDs, span IDs, request IDs, session tracking, and correlation
- ✅ **Sensitive Data Protection** - Recursive field redaction with configurable filter lists
- ✅ **Error Handling** - Stack traces, structured error logging, audit trail support
- ✅ **Type Safety** - Full TypeScript support with comprehensive type definitions
- ✅ **Configuration** - Environment-based setup with validation

### Implementation Highlights

**For Quick Reference:**

- 📄 **[STRUCTURED_LOGGING_IMPLEMENTATION.md](./STRUCTURED_LOGGING_IMPLEMENTATION.md)** - Detailed feature verification with code examples
- 📊 **5 Logger Types**: Console, File, InMemory, Central (Loki)
- 🔒 **Security**: Automatic sensitive field redaction, Loki basic auth
- 📈 **Performance**: Batch logging, async context propagation, memory tracking
- 🏥 **Health Checks**: System monitoring, logger status, transport verification

## Quick Start

### Installation

```bash
npm install @kitiumai/logger
# or
yarn add @kitiumai/logger
```

### Basic Setup

```typescript
import { initializeLogger, getLoggerConfig, getLogger } from '@kitiumai/logger';

// Initialize logger with configuration
const config = getLoggerConfig();
const logger = initializeLogger(config);

// Use logger
getLogger().info('Application started');
getLogger().error('An error occurred', { userId: '123' }, error);
```

### One-line presets (happy path)

```typescript
import { createLogger } from '@kitiumai/logger';

// Automatically applies environment defaults:
// - development: pretty console
// - staging: console + file
// - production: Loki + file, sampling, circuit breaker
const logger = createLogger('production');

logger.info('Bootstrap complete');
```

You can also override any field without building a full config object:

```typescript
const logger = createLogger('staging', {
  samplingRate: 0.5,
  loki: { enabled: true, batchSize: 200 },
});
```

### Express.js Integration

```typescript
import express from 'express';
import {
  initializeLogger,
  getLoggerConfig,
  tracingMiddleware,
  errorLoggingMiddleware,
  performanceMetricsMiddleware,
```

## Usage & Tree-Shaking

### Subpath Imports (Recommended for Bundle Size)

The logger package provides modular subpath exports to help bundlers tree-shake unused code. Import only what you need:

```typescript
// ✅ Minimal — only core logger functions
import { createLogger, getLogger } from '@kitiumai/logger';

// ✅ Middleware only — for Express/Next.js apps
import { tracingMiddleware, errorLoggingMiddleware } from '@kitiumai/logger/middleware';

// ✅ Utilities only — for timers, metrics, error handling
import { createTimer, loggerMetrics, retryWithBackoff } from '@kitiumai/logger/utils';
```

### Top-level Barrel (Works, But Larger)

If you import from the top-level barrel, modern bundlers (esbuild, Rollup, webpack with Terser) will still tree-shake unused exports:

```typescript
// ⚠️ Works but includes all exports; bundler will tree-shake unused ones
import { createLogger, tracingMiddleware, createTimer } from '@kitiumai/logger';
```

### Build Optimization Tips

1. **Use subpath imports in production** to guarantee minimal bundle surface across all bundlers.
2. **For middleware apps** (Express, Next.js, NestJS), import middleware via `@kitiumai/logger/middleware` to avoid including core logger logic if you only wrap existing loggers.
3. **For utility libraries**, use `@kitiumai/logger/utils` to ship only the helpers (timers, metrics) without the full logger.
4. **Verify bundling** with esbuild: `esbuild --bundle --minify --analyze src/index.ts` to see what's included.

The package provides ESM and CommonJS dual builds (`dist/esm/` and `dist/cjs/`) with `sideEffects: false`, so tree-shaking works across all modern toolchains.

} from '@kitiumai/logger';

const app = express();

// Initialize logger
const config = getLoggerConfig();
initializeLogger(config);

// Add logging middleware (order matters!)
app.use(tracingMiddleware()); // Must be first
app.use(performanceMetricsMiddleware());

// Your routes here
app.get('/api/data', (req, res) => {
getLogger().info('Fetching data');
res.json({ data: [] });
});

// Error handling middleware (must be last)
app.use(errorLoggingMiddleware());

app.listen(3000, () => {
getLogger().info('Server started on port 3000');
});

````

### Context bridges (Express, Next.js, OpenTelemetry)

```typescript
import { bridgeExpressRequest, bridgeOpenTelemetryContext } from '@kitiumai/logger';

// Express request handler
app.use((req, _res, next) => {
  bridgeExpressRequest(req); // pulls traceparent/B3/user headers into contextManager
  next();
});

// Inside any function running under OpenTelemetry span
bridgeOpenTelemetryContext();
````

For framework-agnostic scenarios, use `bridgeHeadersToContext` to hydrate the async context from a raw headers object.

## Logger Types

The logging system supports multiple logger types to suit different environments and use cases:

### 1. **Console Logger** (Development)

Simple console output for development and debugging:

```typescript
import { LoggerBuilder } from '@kitiumai/logger';

const logger = LoggerBuilder.console('my-app');
logger.info('Application started');
```

**Best for:** Local development, testing, quick debugging

### 2. **In-Memory Logger** (Testing/Debugging)

Stores logs in memory for inspection and testing:

```typescript
import { LoggerBuilder, InMemoryLogger } from '@kitiumai/logger';

const logger = LoggerBuilder.inMemory('my-app') as InMemoryLogger;
logger.info('User login', { userId: '123' });

// Query logs
const logs = logger.getLogs();
const errorLogs = logger.getLogsByLevel('error');
const stats = logger.getStats();

// Export logs
const json = logger.export();
```

**Best for:** Unit testing, debugging, log inspection, development

### 3. **File Logger** (Production/Staging)

Writes logs to disk with automatic rotation:

```typescript
import { LoggerBuilder } from '@kitiumai/logger';

const logger = LoggerBuilder.file('my-app', './logs')
  .withMaxFileSize('100m')
  .withMaxFiles(14)
  .withConsole(false) // Only file, no console
  .build();

logger.info('Application started');
```

**Best for:** Staging, production servers, on-premise deployments

### 4. **Central Logger** (Cloud-Native with Loki)

Sends logs to Grafana Loki for cloud-native environments:

```typescript
import { LoggerBuilder, getLoggerConfig } from '@kitiumai/logger';

const config = getLoggerConfig();
const logger = LoggerBuilder.central(config);

logger.info('Application started');
// Logs are aggregated in Loki and queryable in Grafana
```

**Best for:** Microservices, Kubernetes, cloud deployments, centralized log analysis

## Standard log schema and validation

All transports normalize entries to a common schema before emission. Required fields:

- `timestamp`, `level`, `message`
- `service`, `environment`
- Correlation fields: `traceId`, `spanId`, `requestId`, `sessionId`, `correlationId`, `userId`
- Optional `metadata` and structured `error` payloads

Schema enforcement is on by default (`LOG_ENFORCE_SCHEMA=true`) and fills missing fields from the async context. Set `samplingRate` (0–1) to curb noisy logs without changing code; logs are dropped probabilistically before formatting.

```typescript
import { getLoggerConfig, initializeLogger } from '@kitiumai/logger';

const config = getLoggerConfig();
config.enforceSchema = true;
config.samplingRate = 0.25; // keep 25% of debug chatter

initializeLogger(config);
```

If Loki becomes unhealthy, the built-in circuit breaker pauses the transport and keeps logging to console/file based on the configured fallback, then retries after the cool-down.

## Using the Builder Pattern

The `LoggerBuilder` provides a fluent API for easy configuration:

```typescript
import { LoggerBuilder, LoggerType } from '@kitiumai/logger';

// Console logger with all options
const logger = new LoggerBuilder()
  .withType(LoggerType.CONSOLE)
  .withServiceName('my-service')
  .withColors(true)
  .withTimestamps(true)
  .build();

// File logger with rotation
const fileLogger = new LoggerBuilder()
  .withType(LoggerType.FILE)
  .withServiceName('my-app')
  .withLogPath('./logs')
  .withMaxFileSize('50m')
  .withMaxFiles(7)
  .withConsole(true) // Include console output
  .build();

// In-memory logger with large capacity
const memLogger = new LoggerBuilder()
  .withType(LoggerType.IN_MEMORY)
  .withServiceName('test-app')
  .withMaxInMemoryLogs(50000)
  .build();
```

## Using the Factory Pattern

For dynamic logger creation:

```typescript
import { LoggerFactory, LoggerType } from '@kitiumai/logger';

// Create logger dynamically
const logger = LoggerFactory.create({
  type: LoggerType.CONSOLE,
  serviceName: 'my-app',
});

// Create from string (useful for env variables)
const loggerType = process.env.LOGGER_TYPE || 'console';
const logger = LoggerFactory.createFromString(loggerType, {
  type: LoggerType.CONSOLE,
  serviceName: 'my-app',
});
```

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Application
NODE_ENV=development
SERVICE_NAME=my-service
LOG_LEVEL=info

# Loki
LOKI_ENABLED=true
LOKI_HOST=localhost
LOKI_PORT=3100
LOKI_PROTOCOL=http
```

### Available Configuration Options

| Variable            | Default         | Description                                        |
| ------------------- | --------------- | -------------------------------------------------- |
| `NODE_ENV`          | development     | Environment (development, staging, production)     |
| `SERVICE_NAME`      | default-service | Service name for log labels                        |
| `LOG_LEVEL`         | info            | Minimum log level (error, warn, info, http, debug) |
| `LOG_CONSOLE`       | true            | Enable console output                              |
| `LOG_FILE_ENABLED`  | false           | Enable file logging                                |
| `LOG_FILE_PATH`     | ./logs          | Log file directory                                 |
| `LOG_MAX_FILE_SIZE` | 100m            | Max size per log file before rotation              |
| `LOG_MAX_FILES`     | 14              | Max number of rotated log files                    |
| `LOKI_ENABLED`      | true            | Enable Loki integration                            |
| `LOKI_HOST`         | localhost       | Loki server host                                   |
| `LOKI_PORT`         | 3100            | Loki server port                                   |
| `LOKI_PROTOCOL`     | http            | Protocol (http or https)                           |
| `LOKI_BATCH_SIZE`   | 100             | Number of logs to batch before sending             |
| `LOKI_INTERVAL`     | 5000            | Time in ms between batch sends                     |
| `LOKI_USERNAME`     | -               | Optional basic auth username                       |
| `LOKI_PASSWORD`     | -               | Optional basic auth password                       |
| `LOKI_LABELS`       | -               | Custom Loki labels (JSON or key=value)             |

## Usage Guide

### Basic Logging

```typescript
import { getLogger } from '@kitiumai/logger';

const logger = getLogger();

// Info level
logger.info('User logged in', { userId: '123' });

// Warning level
logger.warn('API rate limit approaching', { remaining: 10 });

// Error level with error object
logger.error('Database connection failed', { attempt: 1 }, error);

// Debug level
logger.debug('Processing request', { requestId: 'abc123' });

// HTTP level (for API requests)
logger.http('Request completed', { statusCode: 200, duration: 45 });
```

### Distributed Tracing

```typescript
import { contextManager } from '@kitiumai/logger';

// Automatic in Express middleware, but can be used manually:
contextManager.run(
  {
    traceId: 'custom-trace-123',
    userId: 'user-456',
  },
  () => {
    // All logs in this scope will have traceId and userId
    getLogger().info('Processing with context');
  }
);
```

### Request Context Enhancement

```typescript
import { addMetadata } from '@kitiumai/logger';

app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;

  // Add metadata that will be included in all logs for this request
  addMetadata('userId', userId);
  addMetadata('department', 'engineering');

  getLogger().info('Fetching user');
  // Log will include: traceId, userId, department, etc.

  res.json({ id: userId });
});
```

### Error Handling with LoggableError

```typescript
import { LoggableError } from '@kitiumai/logger';

// Create errors with structured metadata
const error = new LoggableError('User not found', 'USER_NOT_FOUND', {
  userId: '123',
  searchField: 'email',
});

// Log with appropriate level
error.log('warn');

// Manual handling
try {
  throw error;
} catch (err) {
  if (err instanceof LoggableError) {
    err.log('error');
  }
}
```

### Performance Timing

```typescript
import { createTimer } from '@kitiumai/logger';

const timer = createTimer('Database query');

// Perform operation
const result = await database.query();

// End timer and log duration
timer.end({ recordCount: result.length });
// Logs: "Database query completed in 145ms" with metadata
```

### Async Operations with Error Logging

```typescript
import { withErrorLogging } from '@kitiumai/logger';

const result = await withErrorLogging(
  async () => {
    // Your async operation
    return await fetchUserData(userId);
  },
  {
    operation: 'Fetch user data',
    metadata: { userId },
  }
);
// Automatically logs errors and timing
```

### Audit Logging (Compliance)

```typescript
import { auditLog } from '@kitiumai/logger';

// Log security/compliance-relevant events
auditLog('UPDATE', 'user_permissions', userId, {
  oldRole: 'user',
  newRole: 'admin',
  reason: 'Team lead promotion',
});

// Logs:
// "Audit: UPDATE on user_permissions"
// with metadata for compliance analysis
```

### Batch Logging

```typescript
import { BatchLogger } from '@kitiumai/logger';

const batch = new BatchLogger();

// Collect logs
batch
  .info('Processing started', { itemCount: 100 })
  .debug('Item 1 processed', { itemId: 1 })
  .debug('Item 2 processed', { itemId: 2 })
  .warn('Item 3 skipped', { itemId: 3, reason: 'invalid' });

// Flush all at once
await batch.flush();
```

## Testing & Mocking

The `@kitiumai/logger` package provides comprehensive mocking utilities for testing applications that use the logger. These mocks are compatible with both Jest and Vitest, eliminating the need for consumers to write their own mock implementations.

### Quick Start

```typescript
import {
  createMockLogger,
  createLoggerSpy,
  createIsolatedMockLogger
} from '@kitiumai/logger';

describe('MyService', () => {
  it('should log user actions', () => {
    const mockLogger = createMockLogger();
    const service = new MyService(mockLogger);

    service.doSomething();

    expect(mockLogger.calls).toHaveLength(1);
    expect(mockLogger.getLastCall()?.message).toBe('Something happened');
  });
});
```

### Mock Logger Classes and Functions

#### `MockLogger`

A complete implementation of the `ILogger` interface that captures all log calls.

**Methods:**
- `calls`: Get all captured log calls (readonly)
- `clear()`: Clear all captured calls
- `getCallsByLevel(level: string)`: Get calls for a specific log level
- `getLastCall()`: Get the most recent log call
- `hasLogs(level?: string)`: Check if any logs exist (optionally by level)
- `findCallsByMessage(text: string)`: Find calls containing specific text

**Example:**
```typescript
const logger = createMockLogger();

logger.info('User logged in', { userId: 123 });
logger.error('Database error', { code: 'CONNECTION_FAILED' }, new Error('Connection timeout'));

console.log(logger.calls.length); // 2
console.log(logger.getCallsByLevel('error')); // [error call]
console.log(logger.hasLogs('info')); // true
console.log(logger.findCallsByMessage('Database')); // [error call]
```

#### `createMockLogger()`

Creates a new `MockLogger` instance.

```typescript
const logger = createMockLogger();
```

#### `createMockLoggerWithContext(context)`

Creates a mock logger with initial context.

```typescript
const logger = createMockLoggerWithContext({
  traceId: 'test-123',
  userId: 'user-456'
});

logger.info('Test message');
// The call will include the context
```

#### `createLoggerSpy()`

Creates a spy object with additional utility methods.

```typescript
const spy = createLoggerSpy();

// Use spy.logger for logging
spy.logger.info('Test message');

// Access utilities
console.log(spy.calls); // readonly array
spy.clear(); // clear calls
console.log(spy.hasLogs('info')); // true
```

#### `createIsolatedMockLogger()`

Creates a logger with testing-specific assertion methods.

```typescript
const { logger, reset, getLogs, assertNoErrors, assertLogged } = createIsolatedMockLogger();

logger.error('Something went wrong');

// These methods throw on failure
assertNoErrors(); // Throws: "Expected no error logs, but found 1"
assertLogged('went wrong'); // Passes
assertLogged('nonexistent'); // Throws: "Expected logger to have logged message containing 'nonexistent'"
```

### Testing Services with Dependencies

```typescript
class UserService {
  constructor(private logger: ILogger) {}

  async createUser(userData: UserData): Promise<User> {
    this.logger.info('Creating user', { email: userData.email });

    try {
      const user = await this.userRepository.create(userData);
      this.logger.info('User created successfully', { userId: user.id });
      return user;
    } catch (error) {
      this.logger.error('Failed to create user', { email: userData.email }, error);
      throw error;
    }
  }
}

// Test
describe('UserService', () => {
  let mockLogger: MockLogger;
  let service: UserService;

  beforeEach(() => {
    mockLogger = createMockLogger();
    service = new UserService(mockLogger);
  });

  it('should log successful user creation', async () => {
    const userData = { email: 'user@example.com', name: 'John Doe' };

    await service.createUser(userData);

    expect(mockLogger.calls).toHaveLength(2);
    expect(mockLogger.findCallsByMessage('Creating user')).toHaveLength(1);
    expect(mockLogger.findCallsByMessage('successfully')).toHaveLength(1);
  });

  it('should log errors during user creation', async () => {
    // Mock repository to throw
    mockUserRepository.create.mockRejectedValue(new Error('Database error'));

    await expect(service.createUser(userData)).rejects.toThrow();

    // Assert logging
    expect(mockLogger.getCallsByLevel('error')).toHaveLength(1);
    const errorCall = mockLogger.getLastCall();
    expect(errorCall?.message).toBe('Failed to create user');
    expect(errorCall?.error?.message).toBe('Database error');
  });
});
```

### Testing Middleware

```typescript
import { createMockLogger } from '@kitiumai/logger';

describe('Logging Middleware', () => {
  it('should log HTTP requests', () => {
    const mockLogger = createMockLogger();
    const middleware = loggingMiddleware({ logger: mockLogger });

    const mockReq = { method: 'GET', url: '/api/users' };
    const mockRes = {};
    const mockNext = jest.fn();

    middleware(mockReq, mockRes, mockNext);

    expect(mockLogger.hasLogs('http')).toBe(true);
    expect(mockLogger.findCallsByMessage('GET /api/users')).toHaveLength(1);
  });
});
```

### Testing with Context

```typescript
describe('Context-aware logging', () => {
  it('should include context in logs', async () => {
    const logger = createMockLogger();

    await logger.withContext({ traceId: 'req-123', userId: 'user-456' }, async () => {
      logger.info('Processing request');

      // Context is automatically included
      const call = logger.getLastCall();
      expect(call?.context?.traceId).toBe('req-123');
      expect(call?.context?.userId).toBe('user-456');
    });
  });
});
```

### Best Practices

1. **Use Appropriate Mock Type**
   - `createMockLogger()`: Basic logging capture
   - `createLoggerSpy()`: Additional utility methods
   - `createIsolatedMockLogger()`: Built-in assertions for simple tests

2. **Clear Between Tests**
   ```typescript
   let mockLogger: MockLogger;

   beforeEach(() => {
     mockLogger = createMockLogger();
   });
   ```

3. **Test Logging Behavior**
   ```typescript
   // Good
   expect(logger.findCallsByMessage('User not found')).toHaveLength(1);
   expect(logger.getCallsByLevel('error')).toHaveLength(1);

   // Less useful
   expect(logger.calls.length).toBeGreaterThan(0);
   ```

4. **Test Error Logging**
   ```typescript
   try {
     await riskyOperation();
   } catch (error) {
     const errorLogs = logger.getCallsByLevel('error');
     expect(errorLogs).toHaveLength(1);
     expect(errorLogs[0].error).toBe(error);
   }
   ```

## Docker Setup (Loki + Grafana)

### Start the Stack

```bash
# Copy environment variables
cp .env.example .env

# Start services
docker-compose up -d

# View logs
docker-compose logs -f loki
```

### Access Grafana

- **URL**: http://localhost:3000
- **Username**: admin
- **Password**: admin

### Querying Logs in Grafana

```logql
# All logs from service
{service="my-service"}

# Logs by level
{service="my-service"} | json level="error"

# Logs with trace ID
{service="my-service"} | json | traceId="abc123"

# Performance metrics
{service="my-service"} | json duration > 1000

# Error logs
{service="my-service"} | json level="error"

# Logs for specific user
{service="my-service"} | json userId="user-123"
```

## Advanced Features

### Custom Transports

```typescript
import winston from 'winston';
import { CentralLogger } from '@kitiumai/logger';

const logger = new CentralLogger(config);

// The underlying winston logger is available
// logger.logger to add custom transports
```

### Request Body Logging with Filtering

```typescript
import { bodyLoggingMiddleware } from '@kitiumai/logger';

// Log request bodies but filter sensitive fields
app.use(bodyLoggingMiddleware(['password', 'token', 'apiKey', 'ssn', 'creditCard']));
```

### User Context Middleware

```typescript
import { userContextMiddleware } from '@kitiumai/logger';

// Automatically extract user ID from request
app.use(
  userContextMiddleware((req) => {
    // Custom extraction logic
    return req.user?.id || req.get('x-user-id');
  })
);
```

### Sanitizing Sensitive Data

```typescript
import { sanitizeData } from '@kitiumai/logger';

const data = {
  email: 'user@example.com',
  password: 'secret123',
  apiKey: 'key-abc123',
};

const safe = sanitizeData(data, ['password', 'apiKey']);
// Result: { email: 'user@example.com', password: '[REDACTED]', apiKey: '[REDACTED]' }
```

## API Reference

### Core Logger APIs

#### `createLogger(preset?, overrides?)`
Create a logger instance with environment-based presets.

**Parameters:**
- `preset?: 'development' | 'staging' | 'production'` - Environment preset
- `overrides?: Partial<LoggerConfig>` - Configuration overrides

**Returns:** `ILogger` - Configured logger instance

**Example:**
```typescript
const logger = createLogger('production', { samplingRate: 0.5 });
```

#### `initializeLogger(config)`
Initialize the global logger instance.

**Parameters:**
- `config: LoggerConfig` - Logger configuration

**Returns:** `CentralLogger` - Initialized logger

#### `getLogger()`
Get the current global logger instance.

**Returns:** `ILogger` - Current logger instance

### Logger Types

#### `ConsoleLogger`
Development logger with colored console output.

#### `FileLogger`
File-based logger with rotation support.

#### `InMemoryLogger`
In-memory logger for testing and development.

#### `CentralLogger`
Production logger with Grafana Loki integration.

### Middleware APIs

#### Express.js Middleware

```typescript
import {
  tracingMiddleware,
  errorLoggingMiddleware,
  performanceMetricsMiddleware,
  userContextMiddleware,
  bodyLoggingMiddleware
} from '@kitiumai/logger/middleware';
```

- `tracingMiddleware()` - Adds trace ID/span ID to requests
- `errorLoggingMiddleware()` - Logs errors with stack traces
- `performanceMetricsMiddleware()` - Tracks request duration and memory
- `userContextMiddleware(userExtractor?)` - Extracts user context from requests
- `bodyLoggingMiddleware(options?)` - Logs request/response bodies

#### Next.js Middleware

```typescript
import {
  withNextApiLogger,
  withNextRouteLogger,
  createNextFetchWrapper
} from '@kitiumai/logger/middleware/next';
```

- `withNextApiLogger(handler)` - Wraps API route handlers
- `withNextRouteLogger(handler)` - Wraps App Router route handlers
- `createNextFetchWrapper(options?)` - Wraps outbound fetch calls

#### NestJS Middleware

```typescript
import {
  createNestLoggingMiddleware,
  createNestExceptionFilter
} from '@kitiumai/logger/middleware/nest';
```

- `createNestLoggingMiddleware()` - Creates logging middleware
- `createNestExceptionFilter()` - Creates exception filter

### Context Management

#### `bridgeExpressRequest(req)`
Extract trace context from Express request headers.

#### `bridgeOpenTelemetryContext()`
Bridge OpenTelemetry context to logger context.

#### `bridgeHeadersToContext(headers)`
Extract context from raw headers object.

#### `withLoggingContext(context, fn)`
Run async function with additional context.

### Utility APIs

#### `createTimer(name?)`
Create a performance timer.

**Returns:** `Timer` - Timer instance with `.start()`, `.stop()`, `.duration()` methods

#### `LoggableError`
Error class that includes logging context.

#### `auditLog(action, details, user?)`
Create structured audit log entry.

#### `BatchLogger`
Batch multiple log operations for performance.

#### `withErrorLogging(fn, context?)`
Wrap async function with automatic error logging.

#### `withErrorLoggingSync(fn, context?)`
Wrap sync function with automatic error logging.

### Security & PII Protection

#### `sanitizeObject(obj, fields?)`
Recursively sanitize object fields.

#### `redactValue(value, pattern?)`
Redact sensitive values.

#### `detectPIITypes(text)`
Detect PII types in text.

#### `isSensitiveField(fieldName)`
Check if field name indicates sensitive data.

### Metrics & Monitoring

#### `loggerMetrics`
Access to metrics registry.

#### `Counter`, `Gauge`, `Histogram`
Metrics collection classes.

#### `performHealthCheck()`
Check logger system health.

#### `healthCheckMiddleware()`
Express middleware for health checks.

### Testing APIs

#### `createMockLogger()`
Create mock logger for testing.

**Returns:** `MockLogger` - Mock logger with `.calls`, `.clear()`, `.getLastCall()` methods

#### `createLoggerSpy()`
Create logger spy with additional utilities.

#### `createIsolatedMockLogger()`
Create logger with built-in assertions.

### Configuration APIs

#### `getLoggerConfig()`
Get default logger configuration.

#### `LogLevel`
Enum: `error`, `warn`, `info`, `http`, `debug`

#### Logger Configuration Types

```typescript
interface LoggerConfig {
  level: LogLevel;
  loki?: LokiConfig;
  file?: FileConfig;
  console?: ConsoleConfig;
  samplingRate?: number;
  batchSize?: number;
  // ... more options
}
```

### Builder Pattern

#### `LoggerBuilder`
Fluent API for logger construction.

```typescript
const logger = LoggerBuilder
  .console('my-app')
  .withLoki({ host: 'localhost', port: 3100 })
  .withLevel('debug')
  .build();
```

### Error Handling

#### `retryWithBackoff(fn, config?)`
Retry function with exponential backoff.

#### `safeAsync(fn, fallback?)`
Wrap async function with error handling.

#### `CircuitBreaker`
Circuit breaker for resilient operations.

### Console Capture

#### `captureConsole(options?)`
Capture console.log/warn/error calls.

#### `restoreConsole()`
Restore original console methods.

## Production Recommendations

### 1. **Log Levels**

```env
NODE_ENV=production
LOG_LEVEL=info  # Only error, warn, info
LOG_CONSOLE=false  # Disable console in production
LOG_FILE_ENABLED=true  # Enable file logging
```

### 2. **Loki Configuration**

```env
LOKI_ENABLED=true
LOKI_HOST=loki.company.com  # Use managed Loki or secure endpoint
LOKI_PROTOCOL=https
LOKI_USERNAME=your-org
LOKI_PASSWORD=your-token
LOKI_LABELS={"region":"us-west-2","cluster":"prod"}
```

### 3. **Error Handling**

```typescript
// Ensure graceful shutdown
process.on('SIGTERM', async () => {
  await logger.close(); // Flush Loki
  process.exit(0);
});
```

### 4. **Resource Limits**

- Set appropriate `LOKI_BATCH_SIZE` for your volume
- Monitor memory usage with large batch sizes
- Use file rotation to prevent disk space issues

### 5. **Monitoring**

- Monitor Loki disk usage
- Set up Grafana alerts for errors
- Track logger performance with metrics

## Performance Considerations

- **Batching**: Logs are batched before sending to Loki (default 100 logs or 5s)
- **Async Context**: Uses Node.js AsyncLocalStorage (minimal overhead)
- **Memory**: Each log entry is ~1KB; 100 batch size = ~100KB in memory
- **Network**: Batching reduces network calls; typical overhead <5ms per request

## Troubleshooting

### Logs not appearing in Loki

```bash
# Check Loki is running
docker-compose logs loki

# Verify connection
curl http://localhost:3100/loki/api/v1/status/ready

# Check logs
getLogger().info('test log');
```

### Memory issues

Reduce batch size:

```env
LOKI_BATCH_SIZE=25  # From default 100
```

### High latency

Increase interval to reduce frequency:

```env
LOKI_INTERVAL=10000  # From default 5000 (10 seconds)
```

### Missing trace IDs

Ensure middleware is first:

```typescript
app.use(tracingMiddleware()); // Must be before other middleware
```

## TypeScript Support

Fully typed interfaces are available:

```typescript
import { LoggerConfig, LokiConfig, LogContext, StructuredLogEntry } from '@kitiumai/logger';

// All configurations are type-safe
```

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines.

## Migration Guide

Complete guide for migrating from various logging solutions to **@kitiumai/logger**.

### Quick Migration Steps

1. **Install the Package**

   ```bash
   npm install @kitiumai/logger
   # or
   yarn add @kitiumai/logger
   # or
   pnpm add @kitiumai/logger
   ```

2. **Initialize in Your App**

   ```typescript
   import { LoggerBuilder, LoggerType } from '@kitiumai/logger';

   // For development (console output)
   const logger = LoggerBuilder.console('my-app');

   // For production (file-based)
   const logger = LoggerBuilder.file('my-app', './logs');

   // For cloud (Loki integration)
   import { getLoggerConfig } from '@kitiumai/logger';
   const config = getLoggerConfig();
   const logger = LoggerBuilder.central(config);
   ```

### Migration Strategies

**Strategy 1: Gradual Migration (Recommended)**

- Install the package
- Create a singleton logger instance
- Replace logging statements progressively
- Run tests after each file migration
- Commit changes

**Strategy 2: Automated Migration**

- Use the migration script: `npm run migrate`
- Review the generated changes
- Test thoroughly
- Commit changes

**Strategy 3: Wrapper Pattern**

```typescript
// logger-adapter.ts
import { getLogger } from '@kitiumai/logger';

export const logger = {
  log: (msg: string, meta?: any) => getLogger().info(msg, meta),
  error: (msg: string, err?: Error) => getLogger().error(msg, {}, err),
  warn: (msg: string, meta?: any) => getLogger().warn(msg, meta),
  debug: (msg: string, meta?: any) => getLogger().debug(msg, meta),
};
```

### Before & After Examples

**From console.log:**

```typescript
// Before
console.log('User logged in:', userId);
console.error('Database error:', err.message);

// After
logger.info('User logged in', { userId });
logger.error('Database error', { message: err.message }, err);
```

**From Winston Logger:**

```typescript
// Before
import winston from 'winston';
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

// After
import { LoggerBuilder } from '@kitiumai/logger';
const logger = LoggerBuilder.console('my-app');
```

**From Pino Logger:**

```typescript
// Before
import pino from 'pino';
const logger = pino({ level: 'info' });
logger.info({ userId: '123' }, 'User action');

// After
import { LoggerBuilder } from '@kitiumai/logger';
const logger = LoggerBuilder.console('my-app');
logger.info('User action', { userId: '123' });
```

**From Bunyan Logger:**

```typescript
// Before
import bunyan from 'bunyan';
const log = bunyan.createLogger({ name: 'myapp' });
log.info({ userId: '123', action: 'login' }, 'User logged in');

// After
import { LoggerBuilder } from '@kitiumai/logger';
const logger = LoggerBuilder.console('myapp');
logger.info('User logged in', { userId: '123', action: 'login' });
```

### Using the Migration Tool

**Run the Interactive Tool:**

```bash
npm run migrate
```

This tool will:

1. Scan your project for logging statements
2. Identify which loggers are used
3. Generate a migration report with statistics
4. Provide recommendations

**Advanced Options:**

```bash
# Scan specific directory
npm run migrate -- /path/to/project

# Generate a report file
npm run migrate -- --report migration-report.json

# CI/CD integration
npm run migrate -- --ci
```

### Framework Integration Examples

**Express.js:**

```typescript
import express from 'express';
import {
  LoggerBuilder,
  tracingMiddleware,
  errorLoggingMiddleware,
  bodyLoggingMiddleware,
  performanceMetricsMiddleware,
} from '@kitiumai/logger';

const app = express();
const logger = LoggerBuilder.console('my-api');

// Add logging middleware
app.use(tracingMiddleware());
app.use(bodyLoggingMiddleware());
app.use(performanceMetricsMiddleware());

// Routes
app.get('/api/users', (req, res) => {
  logger.info('Fetching users');
  res.json({ users: [] });
});

// Error handling
app.use(errorLoggingMiddleware());
```

**Next.js:**

```typescript
// lib/logger.ts
import { LoggerBuilder } from '@kitiumai/logger';
export const logger = LoggerBuilder.console('my-nextjs-app');

// pages/api/hello.ts
import { withNextApiLogger } from '@kitiumai/logger/middleware/next';
import { logger } from '@/lib/logger';

export default withNextApiLogger(async (req, res) => {
  logger.info('API call', { path: req.url, method: req.method });
  res.status(200).json({ message: 'Hello' });
});

// app/api/users/route.ts (App Router)
import { withNextRouteLogger } from '@kitiumai/logger/middleware/next';
import { logger } from '@/lib/logger';

export const GET = withNextRouteLogger(async (request) => {
  logger.info('Fetching users (Next Route)', { path: request.nextUrl.pathname });
  return Response.json({ users: [] });
});
```

**NestJS:**

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  createNestLoggingMiddleware,
  createNestExceptionFilter,
} from '@kitiumai/logger/middleware/nest';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(createNestLoggingMiddleware());
  app.useGlobalFilters(createNestExceptionFilter());
  await app.listen(3000);
}

bootstrap();
```

**Fastify:**

```typescript
import Fastify from 'fastify';
import { LoggerBuilder } from '@kitiumai/logger';

const kitiumLogger = LoggerBuilder.console('my-fastify-app');
const fastify = Fastify({ logger: { level: 'info' } });

fastify.get('/hello', async (request, reply) => {
  kitiumLogger.info('Request received', {
    url: request.url,
    method: request.method,
  });
  return { hello: 'world' };
});
```

### Common Migration Patterns

**Pattern 1: Contextual Logging**

```typescript
// Before (Winston)
const logger = winston.createLogger({
  defaultMeta: { userId: user.id, requestId: req.id },
});

// After (Kitium)
await logger.withContext({ userId: user.id, requestId: req.id }, async () => {
  logger.info('Processing user request');
  logger.debug('Loading data');
  // All logs include userId and requestId automatically
});
```

**Pattern 2: Error Handling**

```typescript
// Before
logger.error('Operation failed', {
  error: err.message,
  stack: err.stack,
  context: { userId: '123' },
});

// After
logger.error('Operation failed', { userId: '123' }, err);
```

**Pattern 3: Performance Monitoring**

```typescript
import { createTimer } from '@kitiumai/logger';

const timer = createTimer('Database query');
// ... perform operation ...
const { duration, memoryUsed } = timer.end({
  query: 'SELECT * FROM users',
});
```

**Pattern 4: Batch Logging**

```typescript
import { BatchLogger } from '@kitiumai/logger';

const batch = new BatchLogger();
batch.info('Step 1 complete');
batch.info('Step 2 complete');
batch.warn('Step 3 had warning');
batch.flush(); // Log all at once
```

### Migration Checklist

- [ ] Install package: `npm install @kitiumai/logger`
- [ ] Run migration tool: `npm run migrate`
- [ ] Update imports in all files
- [ ] Replace logging calls
- [ ] Update error handling
- [ ] Test in development
- [ ] Run full test suite
- [ ] Update documentation
- [ ] Commit and deploy

### Migration Troubleshooting

**Issue: Type Errors with `any` type**

- Solution: Use `unknown` instead and handle narrowing:

```typescript
const meta: Record<string, unknown> = {};
```

**Issue: Missing Imports**

- Solution: Check package installation and import paths:

```typescript
// ✅ Correct
import { LoggerBuilder } from '@kitiumai/logger';
```

**Issue: Logger Not Initialized**

- Solution: Initialize logger before using it:

```typescript
import { LoggerBuilder } from '@kitiumai/logger';
const logger = LoggerBuilder.console('my-app');
export { logger };
```

**Issue: Console Output in Tests**

- Solution: Use InMemoryLogger for testing:

```typescript
import { LoggerBuilder, LoggerType } from '@kitiumai/logger';
const logger = LoggerBuilder.inMemory('test-app');
```

## Migration Scripts Documentation

This package includes scripts to help migrate existing projects to use **@kitiumai/logger**.

### Available Scripts

#### 1. Interactive Migration Tool (`npm run migrate`)

A Node.js script that analyzes your project and provides migration guidance.

**Features:**

- Scans project for existing logging patterns
- Detects console.log, Winston, Bunyan, Pino, and Debug usage
- Generates migration report with statistics
- Provides interactive migration guide
- Identifies files that need updates

**Example Output:**

```
🚀 Kitium Logger Migration Tool

📊 Logger Usage Summary:
  console.log/error/warn/info/debug:  245 occurrences
  Winston logger:                      89 occurrences
  Total logging statements found: 334

📁 Files that need migration:
  src/index.ts
  src/utils/helpers.ts
  src/services/api.ts
```

#### 2. TypeScript Version

A TypeScript version of the migration script for advanced use cases.

```bash
ts-node scripts/migrate.ts
```

### How to Use Migration Tool

**Step 1: Run the Scanner**

```bash
npm run migrate
```

**Step 2: Review the Report**
The tool will show:

- Total logging statements found
- Types of loggers detected
- Files that need updating
- Line numbers for each occurrence

**Step 3: Follow the Guide**
The tool provides:

- Installation instructions
- Code examples for your use case
- Migration patterns
- Best practices

**Step 4: Apply Changes**
Apply the suggested changes to your codebase

**Step 5: Test & Verify**

```bash
npm run test
npm run build
npm run lint
```

### Migration Script Options

**Scan specific directory:**

```bash
npm run migrate -- /path/to/project
```

**Get help:**

```bash
npm run migrate:help
```

**Generate migration script (optional):**
The tool can generate an automated migration script to replace common patterns.

### Integration with CI/CD

Add to your pre-commit hook or CI pipeline:

```bash
npm run migrate -- --ci
npm run migrate -- --report migration-report.json
```

## Package Assessment & Improvements

**Overall Assessment: 7.5/10** - Solid Foundation with Notable Improvements Needed

### ✅ Strengths

**Architecture & Design Patterns (9/10)**

- Multiple logger implementations with strategy pattern
- Builder pattern for fluent configuration
- Factory pattern for logger instantiation
- Singleton pattern for global logger management
- Clear separation of concerns

**Type Safety (9/10)**

- Full TypeScript implementation
- Well-defined interfaces (ILogger, LogContext, LogEntry)
- No any types in critical paths
- Generic support for context management
- Proper enums for LogLevel and LoggerType

**Context Propagation (8.5/10)**

- AsyncLocalStorage-based context management
- Automatic trace/span ID generation (UUID)
- User and session tracking support
- Distributed tracing ready
- Context isolation per request

**Multiple Output Targets (8/10)**

- Console, File, InMemory, and Loki support
- Daily file rotation with configurable retention
- Loki integration for centralized logging
- Environment-based configuration
- Optional console transport with file logging

**Express.js Integration (8/10)**

- Tracing middleware with request/response timing
- Performance metrics middleware
- Error logging middleware
- Body logging with automatic sanitization
- User context extraction middleware

**Security Features (7.5/10)**

- Automatic sensitive field redaction
- Recursive sanitization for nested objects
- Loki basic auth support
- Audit logging support
- LoggableError for context-aware error handling

### ⚠️ Critical Issues

**1. Testing & Quality (0% Coverage) 🔴 CRITICAL**

- No unit tests in repository
- Target: >90% code coverage (Google/Netflix standard)
- Required: Comprehensive test suite for all logger implementations

**2. Error Handling (4/10) 🔴 CRITICAL**

- Missing try-catch blocks in middleware
- No retry logic with exponential backoff
- No circuit breaker pattern for Loki
- No graceful degradation strategy
- Fire-and-forget batching without recovery

**3. Performance Issues (5/10) 🔴 CRITICAL**

- Unbounded memory in InMemoryLogger (default 10,000 logs)
- Missing metrics/observability
- No memory limits or LRU eviction
- Slow request detection not configurable

**4. Configuration Management (5/10) 🟠 MAJOR**

- Hardcoded threshold values
- Missing validation of config values
- No hot reloading support
- No dynamic log level changes

**5. Missing Production Features (4/10) 🔴 CRITICAL**

- No structured logging enforcement
- No log sampling for high-volume services
- No log aggregation strategy
- No OpenTelemetry integration

### 🎯 Comparison with Industry Standards

| Aspect                 | Current  | Google   | Amazon   | Netflix  |
| ---------------------- | -------- | -------- | -------- | -------- |
| Test Coverage          | 0%       | >95%     | >90%     | >95%     |
| Error Handling         | Basic    | Advanced | Advanced | Advanced |
| Circuit Breakers       | ❌       | ✅       | ✅       | ✅       |
| Metrics/Observability  | 🟡 Basic | ✅ Full  | ✅ Full  | ✅ Full  |
| Performance Monitoring | Partial  | Complete | Complete | Complete |
| Distributed Tracing    | Manual   | OTEL     | OTEL     | OTEL     |

### 📋 Top 10 Recommendations

🔴 **CRITICAL (Must Have)**

1. **Add Comprehensive Unit Tests (40-60 hours)**
   - Jest setup with >90% coverage
   - Test all logger implementations
   - Mock Loki and file system
   - Context propagation tests

2. **Implement Error Handling & Recovery (20-30 hours)**
   - Add try-catch blocks in middleware
   - Implement retry logic with exponential backoff
   - Circuit breaker for Loki
   - Graceful degradation

3. **Add Observability/Metrics (15-25 hours)**
   - Prometheus metrics export
   - Memory usage tracking
   - Batch latency metrics
   - Dropped logs counter

4. **Fix Code Complexity Issues (10-15 hours)**
   - Refactor methods exceeding limits
   - Extract helper functions
   - Improve readability

🟠 **MAJOR (High Value)**

5. **Implement Configuration Validation (8-12 hours)**
6. **Add OpenTelemetry Support (15-20 hours)**
7. **Implement Structured Logging Standard (10-15 hours)**
8. **Add Health Check Endpoints (5-8 hours)**

🟡 **MEDIUM (Nice to Have)**

9. **Add Performance/Load Tests (12-18 hours)**
10. **Improve Documentation (10-15 hours)**

### 💡 Quick Win Implementations

These improvements can be done quickly to improve production readiness:

1. **Add error handling to middleware** (1 hour)
2. **Add Prometheus metrics** (3 hours)
3. **Add basic test file** (2 hours)
4. **Add graceful shutdown** (2 hours)

### Production Readiness

**Current Status:** NOT READY for production without addressing critical issues

**Recommended Timeline:**

1. Tests - 2 weeks
2. Error handling - 1 week
3. Metrics - 1 week
4. Code quality refactoring - 1 week

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review example applications
3. Review the Migration Guide above
4. Check Loki documentation: https://grafana.com/docs/loki/latest/
5. Review Winston documentation: https://github.com/winstonjs/winston

---

Built with ❤️ for enterprise logging
