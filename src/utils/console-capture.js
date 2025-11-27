"use strict";
/**
 * Console capture utilities with context propagation
 * Framework-agnostic console interception for testing and debugging
 */
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
exports.captureConsole = captureConsole;
exports.restoreConsole = restoreConsole;
var index_1 = require("../index");
/**
 * Capture console output with context propagation and logger integration
 * Framework-agnostic implementation
 */
function captureConsole(options) {
    if (options === void 0) { options = {}; }
    var _a = options.autoLogToLogger, autoLogToLogger = _a === void 0 ? false : _a, _b = options.redactSensitive, redactSensitive = _b === void 0 ? true : _b, _c = options.sensitiveFields, sensitiveFields = _c === void 0 ? ['password', 'token', 'secret', 'apiKey', 'authorization'] : _c, _d = options.getContext, getContext = _d === void 0 ? function () { return index_1.contextManager.getContext(); } : _d, _e = options.logger, logger = _e === void 0 ? (0, index_1.getLogger)() : _e;
    var entries = [];
    var capture = function (level) {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var context = getContext();
            var timestamp = Date.now();
            // Redact sensitive data if enabled
            var sanitizedArgs = redactSensitive
                ? args.map(function (arg) { return (0, index_1.sanitizeData)(arg, sensitiveFields); })
                : args;
            var entry = __assign(__assign(__assign({ level: level, message: sanitizedArgs.map(function (arg) { return String(arg); }), timestamp: timestamp, traceId: context.traceId }, (context.spanId !== undefined && { spanId: context.spanId })), (context.requestId !== undefined && { requestId: context.requestId })), (context.metadata !== undefined && { metadata: context.metadata }));
            entries.push(entry);
            // Auto-log to logger if enabled
            if (autoLogToLogger) {
                var logMessage = sanitizedArgs.map(function (arg) { return String(arg); }).join(' ');
                var metadata = __assign(__assign({}, context.metadata), { consoleCapture: true, originalLevel: level });
                switch (level) {
                    case 'error':
                        logger.error(logMessage, metadata);
                        break;
                    case 'warn':
                        logger.warn(logMessage, metadata);
                        break;
                    case 'info':
                        logger.info(logMessage, metadata);
                        break;
                    case 'debug':
                        logger.debug(logMessage, metadata);
                        break;
                    default:
                        logger.info(logMessage, metadata);
                }
            }
        };
    };
    // Override console methods
    console.log = capture('log');
    console.info = capture('info');
    console.warn = capture('warn');
    console.error = capture('error');
    console.debug = capture('debug');
    return {
        get entries() {
            return __spreadArray([], entries, true);
        },
        get logs() {
            return entries.filter(function (o) { return o.level === 'log'; });
        },
        get errors() {
            return entries.filter(function (o) { return o.level === 'error'; });
        },
        get warns() {
            return entries.filter(function (o) { return o.level === 'warn'; });
        },
        get infos() {
            return entries.filter(function (o) { return o.level === 'info'; });
        },
        get debugs() {
            return entries.filter(function (o) { return o.level === 'debug'; });
        },
        clear: function () {
            entries.length = 0;
        },
        getAll: function () {
            return __spreadArray([], entries, true);
        },
        getByLevel: function (level) {
            return entries.filter(function (o) { return o.level === level; });
        },
        getByTraceId: function (traceId) {
            return entries.filter(function (o) { return o.traceId === traceId; });
        },
        hasOutput: function (level) {
            if (level) {
                return entries.some(function (o) { return o.level === level; });
            }
            return entries.length > 0;
        },
        exportToLogger: function () {
            var loggerInstance = logger || (0, index_1.getLogger)();
            for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
                var entry = entries_1[_i];
                var message = entry.message.join(' ');
                var metadata = __assign(__assign({}, entry.metadata), { consoleCapture: true, originalLevel: entry.level, traceId: entry.traceId, spanId: entry.spanId, requestId: entry.requestId });
                switch (entry.level) {
                    case 'error':
                        loggerInstance.error(message, metadata);
                        break;
                    case 'warn':
                        loggerInstance.warn(message, metadata);
                        break;
                    case 'info':
                        loggerInstance.info(message, metadata);
                        break;
                    case 'debug':
                        loggerInstance.debug(message, metadata);
                        break;
                    default:
                        loggerInstance.info(message, metadata);
                }
            }
        },
    };
}
/**
 * Restore original console methods
 * Note: This is a helper - the capture function stores original methods internally
 */
function restoreConsole(originalConsole) {
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.debug = originalConsole.debug;
}
