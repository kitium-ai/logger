# Migration Guide: Kitium Logger

Complete guide for migrating from various logging solutions to **@kitium-ai/centralized-logger**.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Installation](#installation)
3. [Migration Strategies](#migration-strategies)
4. [Before & After Examples](#before--after-examples)
5. [Using the Migration Tool](#using-the-migration-tool)
6. [Framework Integration](#framework-integration)
7. [Common Patterns](#common-patterns)
8. [Troubleshooting](#troubleshooting)

## Quick Start

### 1. Install the Package

```bash
npm install @kitium-ai/centralized-logger
```

### 2. Initialize in Your App

```typescript
import { LoggerBuilder, LoggerType } from '@kitium-ai/centralized-logger';

// For development (console output)
const logger = LoggerBuilder.console('my-app');

// For production (file-based)
const logger = LoggerBuilder.file('my-app', './logs');

// For cloud (Loki integration)
import { getLoggerConfig } from '@kitium-ai/centralized-logger';
const config = getLoggerConfig();
const logger = LoggerBuilder.central(config);
```

### 3. Start Logging

```typescript
// Basic logging
logger.info('Application started', { version: '1.0.0' });

// With error
logger.error('Something went wrong', { context: 'data' }, error);

// With metadata
logger.debug('Processing user', { userId: '123', action: 'create' });
```

## Installation

```bash
# NPM
npm install @kitium-ai/centralized-logger

# Yarn
yarn add @kitium-ai/centralized-logger

# PNPM
pnpm add @kitium-ai/centralized-logger
```

## Migration Strategies

### Strategy 1: Gradual Migration (Recommended)

1. Install the package
2. Create a singleton logger instance
3. Replace logging statements progressively
4. Run tests after each file migration
5. Commit changes

### Strategy 2: Automated Migration

1. Use the migration script (see below)
2. Review the generated changes
3. Test thoroughly
4. Commit changes

### Strategy 3: Wrapper Pattern

Create a compatibility layer for gradual migration:

```typescript
// logger-adapter.ts
import { getLogger } from '@kitium-ai/centralized-logger';

export const logger = {
  log: (msg: string, meta?: any) => getLogger().info(msg, meta),
  error: (msg: string, err?: Error) => getLogger().error(msg, {}, err),
  warn: (msg: string, meta?: any) => getLogger().warn(msg, meta),
  debug: (msg: string, meta?: any) => getLogger().debug(msg, meta),
};
```

## Before & After Examples

### Example 1: console.log

**Before:**

```typescript
console.log('User logged in:', userId);
console.error('Database error:', err.message);
```

**After:**

```typescript
logger.info('User logged in', { userId });
logger.error('Database error', { message: err.message }, err);
```

### Example 2: Winston Logger

**Before:**

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

logger.info('Request received', {
  method: req.method,
  path: req.path,
});
```

**After:**

```typescript
import { LoggerBuilder, LoggerType } from '@kitium-ai/centralized-logger';

const logger = LoggerBuilder.console('my-app');

logger.info('Request received', {
  method: req.method,
  path: req.path,
});
```

### Example 3: Pino Logger

**Before:**

```typescript
import pino from 'pino';

const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
  },
});

logger.info({ userId: '123' }, 'User action');
```

**After:**

```typescript
import { LoggerBuilder } from '@kitium-ai/centralized-logger';

const logger = LoggerBuilder.console('my-app');

logger.info('User action', { userId: '123' });
```

### Example 4: Bunyan Logger

**Before:**

```typescript
import bunyan from 'bunyan';

const log = bunyan.createLogger({ name: 'myapp' });

log.info({ userId: '123', action: 'login' }, 'User logged in');
log.error({ err: error }, 'An error occurred');
```

**After:**

```typescript
import { LoggerBuilder } from '@kitium-ai/centralized-logger';

const logger = LoggerBuilder.console('myapp');

logger.info('User logged in', { userId: '123', action: 'login' });
logger.error('An error occurred', {}, error);
```

## Using the Migration Tool

### Run the Interactive Tool

```bash
npm run migrate
```

This tool will:

1. Scan your project for logging statements
2. Identify which loggers are used
3. Generate a migration report
4. Provide recommendations

### Example Output

```
🚀 Kitium Logger Migration Tool

📂 Scanning directory: /home/user/project

Scanning files...

╔════════════════════════════════════════════════════════════╗
║         Kitium Logger Migration Report                      ║
╚════════════════════════════════════════════════════════════╝

📊 Logger Usage Summary:
─────────────────────────────────────────────────────────────
  console.log/error/warn/info/debug:  245 occurrences
  Winston logger:                      89 occurrences
  Bunyan logger:                       0 occurrences
  Pino logger:                         12 occurrences
  Debug module:                        34 occurrences
─────────────────────────────────────────────────────────────

📈 Total logging statements found: 380
```

## Framework Integration

### Express.js

```typescript
import express from 'express';
import {
  LoggerBuilder,
  tracingMiddleware,
  errorLoggingMiddleware,
  bodyLoggingMiddleware,
  performanceMetricsMiddleware,
} from '@kitium-ai/centralized-logger';

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

// Error handling middleware
app.use(errorLoggingMiddleware());
```

### Next.js

```typescript
// lib/logger.ts
import { LoggerBuilder } from '@kitium-ai/centralized-logger';

const logger = LoggerBuilder.console('my-nextjs-app');

export default logger;

// pages/api/hello.ts
import logger from '@/lib/logger';

export default function handler(req, res) {
  logger.info('API call', { path: req.url, method: req.method });
  res.status(200).json({ message: 'Hello' });
}
```

### Fastify

```typescript
import Fastify from 'fastify';
import { LoggerBuilder } from '@kitium-ai/centralized-logger';

const kitiumLogger = LoggerBuilder.console('my-fastify-app');

const fastify = Fastify({
  logger: {
    level: 'info',
  },
});

fastify.get('/hello', async (request, reply) => {
  kitiumLogger.info('Request received', {
    url: request.url,
    method: request.method,
  });
  return { hello: 'world' };
});
```

## Common Patterns

### Pattern 1: Contextual Logging

```typescript
// Before (Winston)
const logger = winston.createLogger({
  defaultMeta: { userId: user.id, requestId: req.id },
});

// After (Kitium)
await logger.withContext({ userId: user.id, requestId: req.id }, async () => {
  logger.info('Processing user request');
  logger.debug('Loading data');
  logger.info('Request complete');
  // All logs include userId and requestId automatically
});
```

### Pattern 2: Error Handling

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

### Pattern 3: Performance Monitoring

```typescript
import { createTimer } from '@kitium-ai/centralized-logger';

const timer = createTimer('Database query');
// ... perform operation ...
const { duration, memoryUsed } = timer.end({
  query: 'SELECT * FROM users',
});
```

### Pattern 4: Batch Logging

```typescript
import { BatchLogger } from '@kitium-ai/centralized-logger';

const batch = new BatchLogger();
batch.info('Step 1 complete');
batch.info('Step 2 complete');
batch.warn('Step 3 had warning');
batch.flush(); // Log all at once
```

## Troubleshooting

### Issue: Type Errors with `any` type

**Problem:** TypeScript compiler complains about `any` types

**Solution:** Use `unknown` instead and handle narrowing:

```typescript
// ❌ Avoid
const meta: any = {};

// ✅ Use
const meta: Record<string, unknown> = {};
```

### Issue: Missing Imports

**Problem:** `LoggerBuilder` or other exports not found

**Solution:** Check package installation and import paths:

```typescript
// ✅ Correct
import { LoggerBuilder } from '@kitium-ai/centralized-logger';

// ❌ Wrong
import { LoggerBuilder } from '@kitium-ai/logger';
```

### Issue: Logger Not Initialized

**Problem:** "Logger not initialized. Call initializeLogger first."

**Solution:** Initialize logger before using it:

```typescript
import { LoggerBuilder } from '@kitium-ai/centralized-logger';

// Initialize early in your app
const logger = LoggerBuilder.console('my-app');
export { logger };

// Then use in other files
import { logger } from './logger';
logger.info('message');
```

### Issue: Console Output in Tests

**Problem:** Console logs showing up in test output

**Solution:** Use InMemoryLogger for testing:

```typescript
import { LoggerBuilder, LoggerType } from '@kitium-ai/centralized-logger';

const logger = LoggerBuilder.inMemory('test-app');
// or
const logger = new LoggerBuilder().withType(LoggerType.IN_MEMORY).build();
```

## Performance Tips

1. **Use appropriate logger type:**
   - Development: `ConsoleLogger`
   - Production: `FileLogger` or `CentralLogger`
   - Testing: `InMemoryLogger`

2. **Batch operations:**

   ```typescript
   const batch = new BatchLogger();
   // ... add many logs ...
   batch.flush();
   ```

3. **Structured logging:**

   ```typescript
   // ✅ Good
   logger.info('User action', {
     userId: user.id,
     action: 'login',
     timestamp: Date.now(),
   });

   // ❌ Avoid
   logger.info(`User ${user.id} performed action login at ${Date.now()}`);
   ```

## Support & Resources

- [GitHub Issues](https://github.com/kitium-ai/logger/issues)
- [Examples](./src/examples/)
- [API Documentation](./README.md)

## Checklist for Complete Migration

- [ ] Install package: `npm install @kitium-ai/centralized-logger`
- [ ] Run migration tool: `npm run migrate`
- [ ] Update imports in all files
- [ ] Replace logging calls
- [ ] Update error handling
- [ ] Test in development
- [ ] Run full test suite
- [ ] Update documentation
- [ ] Commit and deploy

## Additional Resources

- [Structured Logging Best Practices](./docs/structured-logging.md)
- [Performance Optimization](./docs/optimization.md)
- [Cloud Deployment](./docs/deployment.md)
