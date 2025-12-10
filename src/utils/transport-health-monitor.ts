/**
 * Transport Health Monitoring - High Priority Implementation
 * Monitors transport health and provides automatic failover capabilities
 */

import { EventEmitter } from 'node:events';

export type TransportHealthStatus = {
  transport: string;
  healthy: boolean;
  lastSuccess: number;
  lastFailure: number;
  failureCount: number;
  avgResponseTime: number;
  consecutiveFailures: number;
  circuitBreakerState: 'closed' | 'open' | 'half-open';
};

export type HealthMonitorConfig = {
  healthCheckInterval: number;
  failureThreshold: number;
  recoveryThreshold: number;
  circuitBreakerTimeout: number;
  enableAutoFailover: boolean;
};

export type TransportEndpoint = {
  name: string;
  url: string;
  healthCheck: () => Promise<boolean>;
  send: (data: unknown) => Promise<void>;
};

export class TransportHealthMonitor extends EventEmitter {
  private readonly transports = new Map<string, TransportEndpoint>();
  private readonly healthStatus = new Map<string, TransportHealthStatus>();
  private healthCheckTimer?: NodeJS.Timeout;
  private primaryTransport?: string;
  private failoverTransport?: string;

  constructor(private readonly config: HealthMonitorConfig) {
    super();
    this.setupHealthChecks();
  }

  /**
   * Register a transport endpoint
   */
  registerTransport(endpoint: TransportEndpoint, isPrimary = false): void {
    this.transports.set(endpoint.name, endpoint);

    this.healthStatus.set(endpoint.name, {
      transport: endpoint.name,
      healthy: true,
      lastSuccess: Date.now(),
      lastFailure: 0,
      failureCount: 0,
      avgResponseTime: 0,
      consecutiveFailures: 0,
      circuitBreakerState: 'closed',
    });

    if (isPrimary) {
      this.primaryTransport = endpoint.name;
    }

    this.emit('transport-registered', endpoint.name);
  }

  /**
   * Get health status for all transports
   */
  getHealthStatus(): TransportHealthStatus[] {
    return Array.from(this.healthStatus.values());
  }

  /**
   * Get health status for specific transport
   */
  getTransportHealth(transportName: string): TransportHealthStatus | undefined {
    return this.healthStatus.get(transportName);
  }

  /**
   * Check if transport is healthy
   */
  isHealthy(transportName: string): boolean {
    const status = this.healthStatus.get(transportName);
    return status?.healthy ?? false;
  }

  /**
   * Get the currently active transport (with failover logic)
   */
  getActiveTransport(): string | undefined {
    if (this.primaryTransport && this.isHealthy(this.primaryTransport)) {
      return this.primaryTransport;
    }

    // Try failover transport first if configured
    if (this.failoverTransport && this.isHealthy(this.failoverTransport)) {
      return this.failoverTransport;
    }

    // Find first healthy transport as failover
    for (const [name, status] of this.healthStatus) {
      if (status.healthy && name !== this.primaryTransport) {
        if (this.config.enableAutoFailover) {
          this.failoverTransport = name;
          this.emit('failover-activated', name);
        }
        return name;
      }
    }

    return undefined;
  }

  /**
   * Send data through healthy transport
   */
  async send(data: unknown): Promise<void> {
    const activeTransport = this.getActiveTransport();

    if (!activeTransport) {
      throw new Error('No healthy transport available');
    }

    const transport = this.transports.get(activeTransport);
    if (!transport) {
      throw new Error(`Transport ${activeTransport} not found`);
    }

    const startTime = Date.now();
    const status = this.healthStatus.get(activeTransport);
    if (!status) {
      throw new Error(`Health status for transport ${activeTransport} not found`);
    }

    try {
      await transport.send(data);

      // Update success metrics
      status.lastSuccess = Date.now();
      status.consecutiveFailures = 0;
      status.circuitBreakerState = 'closed';

      // Update average response time
      const responseTime = Date.now() - startTime;
      status.avgResponseTime = (status.avgResponseTime + responseTime) / 2;

      if (!status.healthy) {
        status.healthy = true;
        this.emit('transport-recovered', activeTransport);
      }
    } catch (error) {
      // Update failure metrics
      status.lastFailure = Date.now();
      status.failureCount++;
      status.consecutiveFailures++;

      // Circuit breaker logic
      if (status.consecutiveFailures >= this.config.failureThreshold) {
        status.circuitBreakerState = 'open';
        status.healthy = false;
        this.emit('circuit-breaker-open', activeTransport);
      }

      throw error;
    }
  }

  /**
   * Force a health check for specific transport
   */
  async checkHealth(transportName: string): Promise<boolean> {
    const transport = this.transports.get(transportName);
    const status = this.healthStatus.get(transportName);

    if (!transport || !status) {
      return false;
    }

    try {
      const isHealthy = await transport.healthCheck();

      if (
        isHealthy &&
        !status.healthy &&
        status.consecutiveFailures >= this.config.recoveryThreshold
      ) {
        // Recovery logic
        status.healthy = true;
        status.consecutiveFailures = 0;
        status.circuitBreakerState = 'half-open';
        this.emit('transport-recovered', transportName);

        // After successful health check, close circuit breaker
        setTimeout(() => {
          if (status.circuitBreakerState === 'half-open') {
            status.circuitBreakerState = 'closed';
            this.emit('circuit-breaker-closed', transportName);
          }
        }, this.config.circuitBreakerTimeout);
      } else if (!isHealthy) {
        status.healthy = false;
        status.consecutiveFailures++;
      }

      return isHealthy;
    } catch {
      status.healthy = false;
      status.consecutiveFailures++;
      return false;
    }
  }

  /**
   * Shutdown the health monitor
   */
  shutdown(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
    this.emit('shutdown');
  }

  private setupHealthChecks(): void {
    this.healthCheckTimer = setInterval(() => {
      void (async (): Promise<void> => {
        for (const transportName of this.transports.keys()) {
          await this.checkHealth(transportName);
        }
      })();
    }, this.config.healthCheckInterval);
  }
}
