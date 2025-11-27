"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleLogger = void 0;
var async_context_1 = require("../context/async-context");
/**
 * Console-only logger for simple applications and development
 * Outputs formatted logs to stdout/stderr
 */
var ConsoleLogger = /** @class */ (function () {
    function ConsoleLogger(options) {
        if (options === void 0) { options = {}; }
        var _a;
        this.serviceName = (_a = options.serviceName) !== null && _a !== void 0 ? _a : 'app';
        this.includeTimestamp = options.includeTimestamp !== false;
        this.colors = options.colors !== false;
    }
    ConsoleLogger.prototype.error = function (message, meta, error) {
        this.log('ERROR', message, meta, error);
    };
    ConsoleLogger.prototype.warn = function (message, meta) {
        this.log('WARN', message, meta);
    };
    ConsoleLogger.prototype.info = function (message, meta) {
        this.log('INFO', message, meta);
    };
    ConsoleLogger.prototype.http = function (message, meta) {
        this.log('HTTP', message, meta);
    };
    ConsoleLogger.prototype.debug = function (message, meta) {
        this.log('DEBUG', message, meta);
    };
    ConsoleLogger.prototype.withContext = function (context, fn) {
        var fullContext = async_context_1.contextManager.initContext(context);
        return async_context_1.contextManager.run(fullContext, function () { return fn(); });
    };
    ConsoleLogger.prototype.child = function (_metadata) {
        // Return a new instance with metadata bound
        return this;
    };
    ConsoleLogger.prototype.close = function () {
        // Nothing to close
        return Promise.resolve();
    };
    /* eslint-disable complexity, sonarjs/cognitive-complexity, max-statements */
    ConsoleLogger.prototype.log = function (level, message, meta, error) {
        var context = async_context_1.contextManager.getContext();
        var timestamp = this.includeTimestamp ? "[".concat(new Date().toISOString(), "] ") : '';
        var colorCode = this.getColorCode(level);
        var resetCode = this.colors ? '\x1b[0m' : '';
        var levelStr = this.colors ? "".concat(colorCode, "[").concat(level, "]").concat(resetCode) : "[".concat(level, "]");
        var service = "[".concat(this.serviceName, "]");
        var traceId = context.traceId ? " [trace: ".concat(context.traceId.substring(0, 8), "]") : '';
        var output = "".concat(timestamp).concat(levelStr, " ").concat(service).concat(traceId, " ").concat(message);
        // Add metadata
        if (meta && Object.keys(meta).length > 0) {
            output += "\n  ".concat(JSON.stringify(meta, null, 2).split('\n').join('\n  '));
        }
        // Add error
        if (error) {
            output += "\n  Error: ".concat(error.message);
            if (error.stack) {
                output += "\n".concat(error.stack
                    .split('\n')
                    .map(function (line) { return "  ".concat(line); })
                    .join('\n'));
            }
        }
        // Add context info if available
        if (context.userId || context.requestId) {
            var contextInfo = [];
            if (context.userId)
                contextInfo.push("userId: ".concat(context.userId));
            if (context.requestId)
                contextInfo.push("requestId: ".concat(context.requestId.substring(0, 8)));
            if (context.sessionId)
                contextInfo.push("sessionId: ".concat(context.sessionId.substring(0, 8)));
            output += "\n  Context: ".concat(contextInfo.join(', '));
        }
        // Write to appropriate stream
        // eslint-disable-next-line no-console
        var stream = level === 'ERROR' ? console.error : console.log;
        stream(output);
    };
    ConsoleLogger.prototype.getColorCode = function (level) {
        var _a;
        if (!this.colors)
            return '';
        var colors = {
            ERROR: '\x1b[31m', // Red
            WARN: '\x1b[33m', // Yellow
            INFO: '\x1b[32m', // Green
            HTTP: '\x1b[36m', // Cyan
            DEBUG: '\x1b[90m', // Gray
        };
        // eslint-disable-next-line security/detect-object-injection
        return (_a = colors[level]) !== null && _a !== void 0 ? _a : '';
    };
    return ConsoleLogger;
}());
exports.ConsoleLogger = ConsoleLogger;
