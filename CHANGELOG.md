# Changelog

All notable changes to the @kitiumai/logger package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-19

### Added

- **Enterprise-Ready Centralized Logging System** - Complete logging infrastructure with multiple output backends
  - Console Logger for development environments
  - File Logger with daily rotation support
  - In-Memory Logger for testing and debugging
  - Central Logger with Grafana Loki integration for cloud-native deployments

- **Express.js Integration**
  - `tracingMiddleware()` - Adds distributed tracing with trace IDs and request context
  - `errorLoggingMiddleware()` - Comprehensive error logging and handling
  - `bodyLoggingMiddleware()` - Request body logging with sensitive field filtering
  - `performanceMetricsMiddleware()` - Performance monitoring and slow request detection
  - `userContextMiddleware()` - User context extraction and propagation

- **Context Management**
  - Async-local storage for request context propagation
  - Structured context including traceId, spanId, requestId, userId, sessionId, correlationId
  - `withContext()` API for context-aware logging within async boundaries

- **Logger Utilities**
  - `createTimer()` - Performance timing with automatic log level determination
  - `withErrorLogging()` - Async function wrapping with automatic error logging
  - `withErrorLoggingSync()` - Synchronous function wrapping with error handling
  - `logFunctionCall()` - Function entry/exit logging for debugging
  - `LoggableError` - Custom error class with structured metadata and logging
  - `BatchLogger` - Batch logging for atomic multi-log operations
  - `auditLog()` - Compliance and security audit logging

- **Logger Builder Pattern**
  - `LoggerBuilder` - Fluent API for logger instantiation and configuration
  - `LoggerFactory` - Factory for creating loggers from configuration objects
  - Multiple static convenience methods (console, file, inMemory, central)

- **Security & Privacy**
  - Sensitive field filtering in request body logging
  - Support for custom field redaction
  - Context-aware log enrichment without exposing raw request data
  - Automatic sanitization utilities for data objects

- **Configuration**
  - Environment-based logger configuration
  - Support for multiple log levels (error, warn, info, http, debug)
  - Configurable log paths, file rotation, and retention
  - Loki connection configuration with basic authentication

- **TypeScript Support**
  - Full TypeScript type definitions
  - Generic logging methods with type safety
  - Proper error typing throughout

- **Examples**
  - Express application example with integrated logging
  - Logger types demonstration with all available logger implementations
  - Usage examples for middleware, utilities, and context management

### Fixed

- ESLint configuration compatibility with v9 flat config format
- TypeScript strict mode compliance
- Unused imports and parameters
- Proper nullish coalescing operator usage

### Changed

- Upgraded to ESLint v9 and @typescript-eslint v8
- Changed default `any` types to `unknown` for better type safety
- Removed deprecated .eslintignore file (uses eslint.config.js ignores property)

### Technical

- Integrated with @kitiumai/lint v1.2.6 for consistent code quality
- Full async context propagation using AsyncLocalStorage
- Winston-based logging with custom formatters and transports
- Support for Grafana Loki with winston-loki transport

## [Unreleased]

- [ ] Add structured logging tests
- [ ] Add performance benchmarks
- [ ] Add integration tests with real Loki instance
- [ ] Add request correlation tracking across services
- [ ] Add log sampling for high-traffic scenarios
