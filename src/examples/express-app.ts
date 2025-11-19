import type { Request, Response } from 'express';
import express from 'express';
import {
  initializeLogger,
  getLogger,
  getLoggerConfig,
  tracingMiddleware,
  errorLoggingMiddleware,
  bodyLoggingMiddleware,
  performanceMetricsMiddleware,
  userContextMiddleware,
  addMetadata,
  createTimer,
  withErrorLogging,
  LoggableError,
  auditLog,
} from '../index';

/**
 * Example Express application with integrated centralized logging
 */

const app = express();
const port = process.env.PORT ?? 3000;

// Initialize logger with config
const loggerConfig = getLoggerConfig();
const logger = initializeLogger(loggerConfig);

// Middleware
app.use(express.json());

// Logging middleware (order matters!)
app.use(tracingMiddleware()); // Should be first to capture all requests
app.use(bodyLoggingMiddleware(['password', 'apiKey', 'token'])); // Log request bodies with sensitive field filtering
app.use(performanceMetricsMiddleware()); // Track performance
app.use(
  userContextMiddleware((req) => {
    // Custom user ID extraction logic
    return (req.headers['x-user-id'] as string) ?? null;
  }),
);

// Routes
app.get('/health', (_req: Request, res: Response) => {
  getLogger().info('Health check requested');
  res.json({
    status: 'healthy',
    service: loggerConfig.serviceName,
    environment: loggerConfig.environment,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/users/:id', async (req: Request, res: Response) => {
  const timer = createTimer('Fetch user');

  try {
    const userId = req.params.id;

    // Add metadata to logs for this request
    addMetadata('userId', userId);

    // Simulate user lookup
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (userId === '999') {
      throw new LoggableError('User not found', 'USER_NOT_FOUND', { userId });
    }

    const user = {
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
    };

    timer.end({ userId });
    res.json(user);
  } catch (error) {
    if (error instanceof LoggableError) {
      error.log('warn');
      res.status(404).json({ error: error.message, code: error.code });
    } else {
      throw error;
    }
  }
});

app.post('/api/users', async (req: Request, res: Response) => {
  const { email, name } = req.body;

  await withErrorLogging(
    async () => {
      // Audit log for user creation
      auditLog('CREATE', 'user', req.get('x-user-id'), { email, name });

      // Simulate user creation
      await new Promise((resolve) => setTimeout(resolve, 150));

      const newUser = { id: '123', email, name };
      res.status(201).json(newUser);
    },
    { operation: 'Create user', metadata: { email } },
  );
});

app.get('/api/data', async (req: Request, res: Response) => {
  const timer = createTimer('Fetch data');

  try {
    // Simulate a long-running operation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    getLogger().info('Data fetched successfully', {
      recordCount: 100,
      source: 'database',
    });

    timer.end({ recordCount: 100 });

    res.json({
      data: Array(100).fill({ id: 1, value: 'test' }),
      total: 100,
    });
  } catch (error) {
    getLogger().error('Failed to fetch data', {}, error as Error);
    throw error;
  }
});

app.get('/api/slow', async (req: Request, res: Response) => {
  // This will trigger slow request warning
  await new Promise((resolve) => setTimeout(resolve, 2500));

  res.json({ message: 'This was a slow operation' });
});

app.get('/api/error', (_req: Request, _res: Response) => {
  throw new Error('Intentional error for testing');
});

// 404 handler
app.use((req: Request, res: Response) => {
  getLogger().warn('Route not found', {
    method: req.method,
    path: req.path,
  });
  res.status(404).json({ error: 'Not found' });
});

// Error handling middleware (should be last)
app.use(errorLoggingMiddleware());

// Graceful shutdown
async function shutdown() {
  getLogger().info('Server shutting down gracefully...');

  await new Promise<void>((resolve) => {
    server.close(() => {
      getLogger().info('HTTP server closed');
      resolve();
    });
  });

  // Flush logs to Loki
  await logger.close();
  getLogger().info('Logger closed, goodbye!');

  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
const server = app.listen(port, () => {
  getLogger().info(`Server started on port ${port}`, {
    environment: loggerConfig.environment,
    logLevel: loggerConfig.logLevel,
    lokiEnabled: loggerConfig.loki.enabled,
  });
});

export default app;
