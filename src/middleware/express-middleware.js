"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tracingMiddleware = tracingMiddleware;
exports.errorLoggingMiddleware = errorLoggingMiddleware;
exports.bodyLoggingMiddleware = bodyLoggingMiddleware;
exports.performanceMetricsMiddleware = performanceMetricsMiddleware;
exports.addMetadata = addMetadata;
exports.sanitizeData = sanitizeData;
exports.userContextMiddleware = userContextMiddleware;
var node_crypto_1 = require("node:crypto");
var uuid_1 = require("uuid");
var logger_1 = require("../logger/logger");
var async_context_1 = require("../context/async-context");
var REQUEST_COMPLETED_MSG = 'Request completed';
var USER_AGENT_HEADER = 'user-agent';
var TRACEPARENT_REGEX = /^[\da-f]{2}-([\da-f]{32})-([\da-f]{16})-[\da-f]{2}$/i;
var DEFAULT_TRACE_VERSION = '00';
var DEFAULT_SENSITIVE_FIELDS = [
    'password',
    'token',
    'secret',
    'apikey',
    'api-key',
    'authorization',
    'cookie',
    'set-cookie',
    'jwt',
    'session',
    'credential',
];
var SENSITIVE_VALUE_PATTERNS = [
    /bearer\s+[a-z0-9\.\-_]+/i,
    /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/, // JWT
    /\b(?:\d[ -]*?){13,16}\b/, // credit card
    /\b[A-Fa-f0-9]{64}\b/, // access tokens/hashes
];
function generateTraceId() {
    return (0, node_crypto_1.randomBytes)(16).toString('hex');
}
function generateSpanId() {
    return (0, node_crypto_1.randomBytes)(8).toString('hex');
}
function buildTraceparent(traceId, spanId, sampled) {
    if (sampled === void 0) { sampled = '01'; }
    var normalizedTraceId = traceId.replace(/-/g, '').padEnd(32, '0').slice(0, 32);
    var normalizedSpanId = spanId.replace(/-/g, '').padEnd(16, '0').slice(0, 16);
    return "".concat(DEFAULT_TRACE_VERSION, "-").concat(normalizedTraceId, "-").concat(normalizedSpanId, "-").concat(sampled);
}
function parseTraceParent(header) {
    if (!header)
        return {};
    var matches = TRACEPARENT_REGEX.exec(header.trim());
    if (!matches) {
        return {};
    }
    var context = {};
    if (matches[1]) {
        context.traceId = matches[1];
    }
    if (matches[2]) {
        context.spanId = matches[2];
    }
    return context;
}
// eslint-disable-next-line max-statements, sonarjs/cognitive-complexity
function parseB3Headers(req) {
    var _a, _b, _c;
    var b3Combined = req.get('b3');
    if (b3Combined) {
        var parts = b3Combined.split('-');
        if (parts.length >= 2) {
            var context_1 = {};
            if (parts[0]) {
                context_1.traceId = parts[0];
            }
            if (parts[1]) {
                context_1.spanId = parts[1];
            }
            if (parts[2]) {
                context_1.parentSpanId = parts[2];
            }
            return context_1;
        }
    }
    var context = {};
    var traceId = (_a = req.get('x-b3-traceid')) !== null && _a !== void 0 ? _a : undefined;
    var spanId = (_b = req.get('x-b3-spanid')) !== null && _b !== void 0 ? _b : undefined;
    var parentSpanId = (_c = req.get('x-b3-parentspanid')) !== null && _c !== void 0 ? _c : undefined;
    if (traceId) {
        context.traceId = traceId;
    }
    if (spanId) {
        context.spanId = spanId;
    }
    if (parentSpanId) {
        context.parentSpanId = parentSpanId;
    }
    return context;
}
function extractTraceContext(req) {
    var traceParent = parseTraceParent(req.get('traceparent'));
    if (traceParent.traceId && traceParent.spanId) {
        return traceParent;
    }
    var b3Context = parseB3Headers(req);
    if (b3Context.traceId || b3Context.spanId) {
        return b3Context;
    }
    return {};
}
function shouldRedactKey(key, sensitiveFields) {
    var normalizedKey = key.toLowerCase();
    return sensitiveFields.some(function (field) { return normalizedKey.includes(field.toLowerCase()); });
}
function isSensitiveValue(value) {
    if (typeof value !== 'string') {
        return false;
    }
    return SENSITIVE_VALUE_PATTERNS.some(function (pattern) { return pattern.test(value); });
}
/**
 * Middleware to add tracing and context to all requests
 */
/* eslint-disable max-lines-per-function */
function tracingMiddleware() {
    /* eslint-disable max-lines-per-function */
    return function (req, res, next) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        var incomingContext = extractTraceContext(req);
        var traceId = (_c = (_b = (_a = incomingContext.traceId) !== null && _a !== void 0 ? _a : req.get('x-trace-id')) !== null && _b !== void 0 ? _b : req.get('x-request-id')) !== null && _c !== void 0 ? _c : generateTraceId();
        var spanId = (_e = (_d = incomingContext.spanId) !== null && _d !== void 0 ? _d : req.get('x-span-id')) !== null && _e !== void 0 ? _e : generateSpanId();
        var requestId = (0, uuid_1.v4)();
        var userId = (_f = req.get('x-user-id')) !== null && _f !== void 0 ? _f : null;
        var sessionId = (_g = req.get('x-session-id')) !== null && _g !== void 0 ? _g : null;
        var correlationId = (_h = req.get('x-correlation-id')) !== null && _h !== void 0 ? _h : null;
        var context = {
            traceId: traceId,
            spanId: spanId,
            requestId: requestId,
            userId: userId,
            sessionId: sessionId,
            correlationId: correlationId,
        };
        async_context_1.contextManager.run(context, function () {
            res.setHeader('x-trace-id', traceId);
            res.setHeader('x-request-id', requestId);
            res.setHeader('x-span-id', spanId);
            res.setHeader('traceparent', buildTraceparent(traceId, spanId));
            var startTime = Date.now();
            var originalJson = res.json.bind(res);
            res.json = function (body) {
                var duration = Date.now() - startTime;
                (0, logger_1.getLogger)().http(REQUEST_COMPLETED_MSG, {
                    method: req.method,
                    path: req.path,
                    statusCode: res.statusCode,
                    duration: duration,
                    ip: req.ip,
                    userAgent: req.get(USER_AGENT_HEADER),
                });
                return originalJson(body);
            };
            var originalSend = res.send.bind(res);
            res.send = function (data) {
                if (!res.headersSent) {
                    var duration = Date.now() - startTime;
                    (0, logger_1.getLogger)().http(REQUEST_COMPLETED_MSG, {
                        method: req.method,
                        path: req.path,
                        statusCode: res.statusCode,
                        duration: duration,
                        ip: req.ip,
                        userAgent: req.get(USER_AGENT_HEADER),
                    });
                }
                return originalSend(data);
            };
            (0, logger_1.getLogger)().http('Incoming request', {
                method: req.method,
                path: req.path,
                query: req.query,
                ip: req.ip,
                userAgent: req.get('user-agent'),
                parentSpanId: incomingContext.parentSpanId,
            });
            next();
        });
    };
}
/**
 * Middleware to catch and log errors
 */
function errorLoggingMiddleware() {
    return function (err, req, res, _next) {
        var _a, _b, _c, _d;
        var logger = (0, logger_1.getLogger)();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        var errAny = err;
        var statusCode = (_b = (_a = errAny.statusCode) !== null && _a !== void 0 ? _a : errAny.status) !== null && _b !== void 0 ? _b : 500;
        var message = (_c = errAny.message) !== null && _c !== void 0 ? _c : 'Internal Server Error';
        var stack = (_d = errAny.stack) !== null && _d !== void 0 ? _d : (err instanceof Error ? err.stack : null);
        logger.error("Request error: ".concat(message), {
            statusCode: statusCode,
            method: req.method,
            path: req.path,
            stack: stack,
            query: req.query,
            body: sanitizeBody(req.body),
        });
        res.status(statusCode).json(__assign({ error: message, status: statusCode, traceId: async_context_1.contextManager.get('traceId') }, (process.env['NODE_ENV'] !== 'production' && {
            stack: stack,
        })));
    };
}
/**
 * Middleware to log request body (with sensitive data filtering)
 */
function bodyLoggingMiddleware(sensitiveFields) {
    if (sensitiveFields === void 0) { sensitiveFields = DEFAULT_SENSITIVE_FIELDS; }
    return function (req, _res, next) {
        if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
            var sanitized = sanitizeData(req.body, sensitiveFields);
            (0, logger_1.getLogger)().debug('Request body', {
                method: req.method,
                path: req.path,
                body: sanitized,
            });
        }
        next();
    };
}
/**
 * Middleware to log performance metrics
 */
function performanceMetricsMiddleware() {
    return function (req, res, next) {
        var startTime = Date.now();
        var startMemory = process.memoryUsage();
        res.on('finish', function () {
            var duration = Date.now() - startTime;
            var endMemory = process.memoryUsage();
            var memoryDelta = {
                heapUsed: endMemory.heapUsed - startMemory.heapUsed,
                external: endMemory.external - startMemory.external,
            };
            if (duration > 1000) {
                // Log slow requests
                (0, logger_1.getLogger)().warn('Slow request detected', {
                    method: req.method,
                    path: req.path,
                    duration: duration,
                    statusCode: res.statusCode,
                    memoryDelta: memoryDelta,
                });
            }
            (0, logger_1.getLogger)().debug('Performance metrics', {
                method: req.method,
                path: req.path,
                duration: duration,
                statusCode: res.statusCode,
                memoryDelta: memoryDelta,
            });
        });
        next();
    };
}
/**
 * Utility to add custom metadata to current request context
 */
function addMetadata(key, value) {
    async_context_1.contextManager.addMetadata(key, value);
}
/**
 * Utility to sanitize request body
 */
function sanitizeBody(body) {
    if (!body)
        return body;
    return sanitizeData(body, DEFAULT_SENSITIVE_FIELDS);
}
/**
 * Utility to sanitize data by removing sensitive fields
 */
function sanitizeData(data, sensitiveFields) {
    if (typeof data !== 'object' || data === null) {
        if (isSensitiveValue(data)) {
            return '[REDACTED]';
        }
        return data;
    }
    if (Array.isArray(data)) {
        return data.map(function (item) { return sanitizeData(item, sensitiveFields); });
    }
    var sanitized = {};
    for (var _i = 0, _a = Object.entries(data); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], value = _b[1];
        if (shouldRedactKey(key, sensitiveFields) || isSensitiveValue(value)) {
            sanitized[key] = '[REDACTED]';
            continue;
        }
        if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeData(value, sensitiveFields);
            continue;
        }
        sanitized[key] = value;
    }
    return sanitized;
}
/**
 * Middleware to set user context from request
 */
function userContextMiddleware(userIdExtractor) {
    return function (req, _res, next) {
        var _a, _b, _c;
        var userId = (_b = (_a = userIdExtractor === null || userIdExtractor === void 0 ? void 0 : userIdExtractor(req)) !== null && _a !== void 0 ? _a : req.get('x-user-id')) !== null && _b !== void 0 ? _b : 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (_c = req.user) === null || _c === void 0 ? void 0 : _c.id;
        if (userId) {
            async_context_1.contextManager.set('userId', userId);
        }
        next();
    };
}
