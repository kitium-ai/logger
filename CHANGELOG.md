# Changelog

All notable changes to the @kitiumai/logger package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] - 2025-11-24

### Added

Context aware logger support added

## [1.4.0] - 2025-11-24

### Added

- **Next.js middleware helpers** – New `withNextApiLogger`, `withNextRouteLogger`, and `createNextFetchWrapper` adapters (exported via `@kitiumai/logger/middleware/next`) wrap API routes, App Router handlers, and outbound fetch calls with trace propagation and structured logging.
- **NestJS middleware/filters** – Added `createNestLoggingMiddleware` and `createNestExceptionFilter` (exported via `@kitiumai/logger/middleware/nest`) so Nest apps can plug into the logger without extra wiring.
- **Context utilities** – Introduced `withLoggingContext` helper to run arbitrary async work inside a derived log context, keeping framework adapters minimal.
- **Documentation coverage** – README now includes full Next.js (API + App Router) and NestJS setup examples alongside existing Express/Fastify guides.

### Changed

- **Package exports** – Updated `package.json` to publish the new middleware entry points (`./middleware/next`, `./middleware/nest`) for both ESM and CJS consumers.
- **Migration script** – The interactive `scripts/migrate.ts` now:
  - Uses glob-based scanning with user-defined ignore globs.
  - Tracks per-logger occurrences (console, Winston, Bunyan, Pino, debug) and reports line numbers with categories.
  - Ensures the `LoggerBuilder` import/initialization are injected exactly once before rewriting console statements.

## [1.2.0] - 2025-11-20

### Added

- **Consolidated Documentation** - Integrated migration guide, assessment report, and migration scripts documentation into comprehensive README.md
- **Enhanced Migration Guide** - Detailed step-by-step migration instructions with multiple strategies (gradual, automated, wrapper pattern)
- **Migration Tool Documentation** - Complete guide for using the interactive migration scripts with advanced options and CI/CD integration
- **Package Assessment Report** - Comprehensive evaluation with strengths, critical issues, and top 10 improvement recommendations
- **Industry Standards Comparison** - Detailed comparison with Google, Amazon, and Netflix logging standards

### Changed

- **Documentation Structure** - Migrated MIGRATION.md, improvement.md, and scripts/README.md content into main README.md for better discoverability
- **README.md Expanded** - Now includes 1,100+ lines of comprehensive documentation covering:
  - Migration strategies and before/after examples
  - Framework integration examples (Express, Next.js, Fastify)
  - Common migration patterns
  - Migration tool usage and advanced options
  - Complete package assessment and recommendations
  - Production readiness guidance

### Removed

- **MIGRATION.md** - Content consolidated into README.md
- **improvement.md** - Content consolidated into README.md
- **scripts/README.md** - Content consolidated into README.md

### Documentation

- Complete migration guide with 8 different before/after examples
- Framework integration examples for Express.js, Next.js, and Fastify
- 10 priority-ranked improvement recommendations with implementation time estimates
- Package assessment score (7.5/10) with detailed strength and weakness analysis
- Production readiness assessment with recommended timeline

## [1.1.0] - 2025-11-19

### Added

Migration scripts for existing log data to new structured format

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

### Added

- **Standard log schema contract** that normalizes core fields across all transports and fills gaps from async context.
- **Preset-based logger bootstrap** via `createLogger` and `getPresetConfig` for development, staging, and production defaults.
- **Context bridges** for Express headers, framework-agnostic headers, and OpenTelemetry active spans.
- **Operational safeguards** including configurable sampling and a Loki circuit breaker with fallback routing.

### Documentation

- README updates covering presets, schema enforcement, sampling, circuit breakers, and context bridge examples.

### Technical

- Adopted the @kitiumai/lint v2 API surface in eslint.config.js to align with the latest configuration exports.
