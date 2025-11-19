# Centralized Logging System

An enterprise-ready centralized logging system with structured logging and Grafana Loki integration for cloud-native applications.

## Features

✅ **Multiple Logger Types** - Console, File, In-Memory, or Central (Loki) logging
✅ **Structured Logging** - JSON-formatted logs with contextual metadata
✅ **Distributed Tracing** - Automatic trace ID and span ID tracking
✅ **Grafana Loki Integration** - Cloud-native log aggregation and analysis
✅ **TypeScript Support** - Full type safety and excellent IDE support
✅ **Express.js Middleware** - Out-of-the-box HTTP request/response logging
✅ **Error Tracking** - Automatic error logging with stack traces
✅ **Performance Metrics** - Request duration and memory usage tracking
✅ **Request Context** - Async context for user, session, and request metadata
✅ **Sensitive Data Filtering** - Automatic redaction of passwords, tokens, and API keys
✅ **Builder Pattern** - Fluent API for easy logger configuration
✅ **Log Levels** - error, warn, info, http, debug
✅ **Audit Logging** - Compliance-ready audit trail support

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

### Express.js Integration

```typescript
import express from 'express';
import {
  initializeLogger,
  getLoggerConfig,
  tracingMiddleware,
  errorLoggingMiddleware,
  performanceMetricsMiddleware,
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
```

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

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | development | Environment (development, staging, production) |
| `SERVICE_NAME` | default-service | Service name for log labels |
| `LOG_LEVEL` | info | Minimum log level (error, warn, info, http, debug) |
| `LOG_CONSOLE` | true | Enable console output |
| `LOG_FILE_ENABLED` | false | Enable file logging |
| `LOG_FILE_PATH` | ./logs | Log file directory |
| `LOG_MAX_FILE_SIZE` | 100m | Max size per log file before rotation |
| `LOG_MAX_FILES` | 14 | Max number of rotated log files |
| `LOKI_ENABLED` | true | Enable Loki integration |
| `LOKI_HOST` | localhost | Loki server host |
| `LOKI_PORT` | 3100 | Loki server port |
| `LOKI_PROTOCOL` | http | Protocol (http or https) |
| `LOKI_BATCH_SIZE` | 100 | Number of logs to batch before sending |
| `LOKI_INTERVAL` | 5000 | Time in ms between batch sends |
| `LOKI_USERNAME` | - | Optional basic auth username |
| `LOKI_PASSWORD` | - | Optional basic auth password |
| `LOKI_LABELS` | - | Custom Loki labels (JSON or key=value) |

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
  },
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
const error = new LoggableError(
  'User not found',
  'USER_NOT_FOUND',
  { userId: '123', searchField: 'email' },
);

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
  },
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
app.use(bodyLoggingMiddleware([
  'password',
  'token',
  'apiKey',
  'ssn',
  'creditCard',
]));
```

### User Context Middleware

```typescript
import { userContextMiddleware } from '@kitiumai/logger';

// Automatically extract user ID from request
app.use(userContextMiddleware((req) => {
  // Custom extraction logic
  return req.user?.id || req.get('x-user-id');
}));
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
import {
  LoggerConfig,
  LokiConfig,
  LogContext,
  StructuredLogEntry,
} from '@kitiumai/logger';

// All configurations are type-safe
```

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review example applications
3. Check Loki documentation: https://grafana.com/docs/loki/latest/
4. Review Winston documentation: https://github.com/winstonjs/winston

---

Built with ❤️ for enterprise logging
