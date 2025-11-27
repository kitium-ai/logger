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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryLogger = void 0;
var async_context_1 = require("../context/async-context");
/**
 * In-memory logger for testing, debugging, and development
 * Stores logs in memory for inspection and does not persist to disk/cloud
 */
var InMemoryLogger = /** @class */ (function () {
    function InMemoryLogger(options) {
        if (options === void 0) { options = {}; }
        var _a, _b;
        this.logs = [];
        this.maxSize = (_a = options.maxSize) !== null && _a !== void 0 ? _a : 10000; // Keep last 10k logs
        this.serviceName = (_b = options.serviceName) !== null && _b !== void 0 ? _b : 'in-memory-service';
    }
    /**
     * Get the service name for this logger
     */
    InMemoryLogger.prototype.getServiceName = function () {
        return this.serviceName;
    };
    InMemoryLogger.prototype.error = function (message, meta, error) {
        this.addLog('error', message, meta, error);
    };
    InMemoryLogger.prototype.warn = function (message, meta) {
        this.addLog('warn', message, meta);
    };
    InMemoryLogger.prototype.info = function (message, meta) {
        this.addLog('info', message, meta);
    };
    InMemoryLogger.prototype.http = function (message, meta) {
        this.addLog('http', message, meta);
    };
    InMemoryLogger.prototype.debug = function (message, meta) {
        this.addLog('debug', message, meta);
    };
    InMemoryLogger.prototype.withContext = function (context, fn) {
        var fullContext = async_context_1.contextManager.initContext(context);
        return async_context_1.contextManager.run(fullContext, function () { return fn(); });
    };
    InMemoryLogger.prototype.child = function (_metadata) {
        // Return a new instance with metadata bound (not used in in-memory)
        return this;
    };
    InMemoryLogger.prototype.close = function () {
        // No resources to clean up for in-memory
        return Promise.resolve();
    };
    /**
     * Get all logs
     */
    InMemoryLogger.prototype.getLogs = function () {
        return __spreadArray([], this.logs, true);
    };
    /**
     * Get logs filtered by level
     */
    InMemoryLogger.prototype.getLogsByLevel = function (level) {
        return this.logs.filter(function (log) { return log.level === level; });
    };
    /**
     * Get logs filtered by message pattern
     */
    InMemoryLogger.prototype.getLogsByMessage = function (pattern) {
        // eslint-disable-next-line security/detect-non-literal-regexp
        var regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
        return this.logs.filter(function (log) { return regex.test(log.message); });
    };
    /**
     * Get logs for a specific trace
     */
    InMemoryLogger.prototype.getLogsByTraceId = function (traceId) {
        return this.logs.filter(function (log) { var _a; return ((_a = log.context) === null || _a === void 0 ? void 0 : _a.traceId) === traceId; });
    };
    /**
     * Get logs for a specific user
     */
    InMemoryLogger.prototype.getLogsByUserId = function (userId) {
        return this.logs.filter(function (log) { var _a; return ((_a = log.context) === null || _a === void 0 ? void 0 : _a.userId) === userId; });
    };
    /**
     * Clear all logs
     */
    InMemoryLogger.prototype.clear = function () {
        this.logs = [];
    };
    /**
     * Get statistics about stored logs
     */
    InMemoryLogger.prototype.getStats = function () {
        var _a;
        var byLevel = {};
        this.logs.forEach(function (log) {
            var _a;
            byLevel[log.level] = ((_a = byLevel[log.level]) !== null && _a !== void 0 ? _a : 0) + 1;
        });
        var result = {
            totalLogs: this.logs.length,
            byLevel: byLevel,
            serviceName: this.serviceName,
        };
        if ((_a = this.logs[0]) === null || _a === void 0 ? void 0 : _a.timestamp) {
            result.oldestLog = this.logs[0].timestamp;
        }
        var lastLog = this.logs[this.logs.length - 1];
        if (lastLog === null || lastLog === void 0 ? void 0 : lastLog.timestamp) {
            result.newestLog = lastLog.timestamp;
        }
        return result;
    };
    /**
     * Export logs as JSON
     */
    InMemoryLogger.prototype.export = function () {
        return JSON.stringify(this.logs, null, 2);
    };
    /**
     * Export logs filtered by level
     */
    InMemoryLogger.prototype.exportByLevel = function (level) {
        return JSON.stringify(this.getLogsByLevel(level), null, 2);
    };
    InMemoryLogger.prototype.addLog = function (level, message, meta, error) {
        var context = async_context_1.contextManager.getContext();
        // Enrich metadata with service name
        var enrichedMeta = meta !== undefined
            ? __assign(__assign({}, (typeof meta === 'object' && meta !== null && !Array.isArray(meta)
                ? meta
                : { originalMeta: meta })), { serviceName: this.serviceName }) : { serviceName: this.serviceName };
        var entry = {
            timestamp: new Date().toISOString(),
            level: level,
            message: message,
            metadata: enrichedMeta,
            context: __assign(__assign(__assign(__assign(__assign({ traceId: context.traceId }, (context.spanId !== undefined && { spanId: context.spanId })), (context.userId !== undefined && { userId: context.userId })), (context.requestId !== undefined && { requestId: context.requestId })), (context.sessionId !== undefined && { sessionId: context.sessionId })), (context.correlationId !== undefined && { correlationId: context.correlationId })),
        };
        if (error) {
            entry.error = __assign({ message: error.message }, (error.stack !== undefined && { stack: error.stack }));
        }
        this.logs.push(entry);
        // Maintain max size
        if (this.logs.length > this.maxSize) {
            this.logs = this.logs.slice(-this.maxSize);
        }
    };
    return InMemoryLogger;
}());
exports.InMemoryLogger = InMemoryLogger;
