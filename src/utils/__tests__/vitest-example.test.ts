/**
 * Example of using Mock Logger with Jest/Vitest
 * This shows how consumers can easily test services that use the logger
 */

import { createMockLogger, type MockLogger } from '../mock-logger';

// Example service that uses logging
class UserService {
  constructor(
    private readonly logger: {
      info: (message: string, meta?: Record<string, unknown>) => void;
      error: (message: string, meta?: Record<string, unknown>, error?: Error) => void;
    }
  ) {}

  async createUser(email: string, password: string): Promise<{ id: string; email: string } | null> {
    await Promise.resolve();
    this.logger.info('Creating user', { email });

    // Simulate some business logic
    if (password.length < 8) {
      this.logger.error('Password too short', { email }, new Error('Validation failed'));
      return null;
    }

    // Simulate successful creation
    const user = { id: 'user-123', email };
    this.logger.info('User created successfully', { userId: user.id, email });

    return user;
  }

  async login(email: string, password: string): Promise<boolean> {
    await Promise.resolve();
    this.logger.info('Login attempt', { email });

    // Simulate authentication
    if (email === 'admin@example.com' && password === 'correct') {
      this.logger.info('Login successful', { email });
      return true;
    }

    this.logger.error('Login failed', { email }, new Error('Invalid credentials'));
    return false;
  }
}

describe('UserService with Mock Logger', () => {
  let logger: MockLogger;
  let service: UserService;

  beforeEach(() => {
    logger = createMockLogger();
    service = new UserService(logger);
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const result = await service.createUser('john@example.com', 'password123');

      expect(result).toStrictEqual({
        id: 'user-123',
        email: 'john@example.com',
      });

      // Verify logging
      expect(logger.calls).toHaveLength(2);
      expect(logger.getCallsByLevel('info')).toHaveLength(2);
      expect(logger.findCallsByMessage('Creating user')).toHaveLength(1);
      expect(logger.findCallsByMessage('successfully')).toHaveLength(1);
      expect(logger.hasLogs('error')).toBe(false);
    });

    it('should reject weak passwords', async () => {
      const result = await service.createUser('john@example.com', 'weak');

      expect(result).toBeNull();

      // Verify error logging
      const errorCalls = logger.getCallsByLevel('error');
      expect(errorCalls).toHaveLength(1);
      const firstError = errorCalls[0];
      expect(firstError).toBeDefined();
      expect(firstError?.message).toBe('Password too short');
      expect(firstError?.error?.message).toBe('Validation failed');
      expect(firstError?.meta).toStrictEqual({ email: 'john@example.com' });
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      const result = await service.login('admin@example.com', 'correct');

      expect(result).toBe(true);
      expect(logger.findCallsByMessage('Login successful')).toHaveLength(1);
      expect(logger.getLastCall()?.level).toBe('info');
    });

    it('should fail login with wrong credentials', async () => {
      const result = await service.login('admin@example.com', 'wrong');

      expect(result).toBe(false);
      expect(logger.findCallsByMessage('Login failed')).toHaveLength(1);
      expect(logger.getCallsByLevel('error')).toHaveLength(1);
    });
  });

  describe('Logger Inspection Utilities', () => {
    beforeEach(async () => {
      // Set up some logs for testing inspection methods
      await service.createUser('test@example.com', 'password123');
      await service.login('wrong@example.com', 'wrong');
    });

    it('should provide various inspection methods', () => {
      // Check total calls
      expect(logger.calls.length).toBeGreaterThan(0);

      // Check specific levels
      expect(logger.getCallsByLevel('info').length).toBeGreaterThan(0);
      expect(logger.getCallsByLevel('error').length).toBeGreaterThan(0);

      // Check message content
      expect(logger.findCallsByMessage('Creating user').length).toBeGreaterThan(0);
      expect(logger.findCallsByMessage('Login failed').length).toBeGreaterThan(0);
      expect(logger.findCallsByMessage('nonexistent')).toHaveLength(0);

      // Check last call
      const lastCall = logger.getLastCall();
      expect(lastCall?.level).toBe('error');
      expect(lastCall?.message).toBe('Login failed');
    });

    it('should clear calls between tests', () => {
      expect(logger.calls.length).toBeGreaterThan(0);

      logger.clear();

      expect(logger.calls).toHaveLength(0);
      expect(logger.hasLogs()).toBe(false);
    });
  });
});
