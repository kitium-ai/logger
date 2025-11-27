"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchLogger = exports.LoggableError = void 0;
exports.createTimer = createTimer;
exports.withErrorLogging = withErrorLogging;
exports.withErrorLoggingSync = withErrorLoggingSync;
exports.logFunctionCall = logFunctionCall;
exports.withLoggingContext = withLoggingContext;
exports.auditLog = auditLog;
var logger_1 = require("../logger/logger");
var async_context_1 = require("../context/async-context");
/**
 * Create a performance timer for measuring operation duration
 */
function createTimer(label) {
    if (label === void 0) { label = 'Operation'; }
    var startTime = Date.now();
    var startMemory = process.memoryUsage().heapUsed;
    return {
        end: function (metadata) {
            var duration = Date.now() - startTime;
            var memoryUsed = process.memoryUsage().heapUsed - startMemory;
            var logLevel = duration > 1000 ? 'warn' : 'debug';
            var message = "".concat(label, " completed in ").concat(duration, "ms");
            if (logLevel === 'warn') {
                (0, logger_1.getLogger)().warn(message, __assign({ duration: duration, memoryUsed: memoryUsed }, metadata));
            }
            else {
                (0, logger_1.getLogger)().debug(message, __assign({ duration: duration, memoryUsed: memoryUsed }, metadata));
            }
            return { duration: duration, memoryUsed: memoryUsed };
        },
    };
}
/**
 * Wrap async function with automatic error logging
 */
function withErrorLogging(fn, context) {
    return __awaiter(this, void 0, void 0, function () {
        var operation, timer, result, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    operation = (_a = context === null || context === void 0 ? void 0 : context.operation) !== null && _a !== void 0 ? _a : 'Operation';
                    timer = createTimer(operation);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fn()];
                case 2:
                    result = _b.sent();
                    timer.end(context === null || context === void 0 ? void 0 : context.metadata);
                    return [2 /*return*/, result];
                case 3:
                    error_1 = _b.sent();
                    (0, logger_1.getLogger)().error("".concat(operation, " failed"), context === null || context === void 0 ? void 0 : context.metadata, error_1);
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Wrap sync function with automatic error logging
 */
function withErrorLoggingSync(fn, context) {
    var _a;
    var operation = (_a = context === null || context === void 0 ? void 0 : context.operation) !== null && _a !== void 0 ? _a : 'Operation';
    var timer = createTimer(operation);
    try {
        var result = fn();
        timer.end(context === null || context === void 0 ? void 0 : context.metadata);
        return result;
    }
    catch (error) {
        (0, logger_1.getLogger)().error("".concat(operation, " failed"), context === null || context === void 0 ? void 0 : context.metadata, error);
        throw error;
    }
}
/**
 * Log function entry and exit (useful for debugging)
 */
function logFunctionCall(fn, fnName) {
    var _a;
    if (fnName === void 0) { fnName = (_a = fn.name) !== null && _a !== void 0 ? _a : 'anonymous'; }
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        (0, logger_1.getLogger)().debug("Entering ".concat(fnName), { args: args });
        try {
            var result = fn.apply(void 0, args);
            (0, logger_1.getLogger)().debug("Exiting ".concat(fnName), { result: result });
            return result;
        }
        catch (error) {
            (0, logger_1.getLogger)().error("Error in ".concat(fnName), { args: args }, error);
            throw error;
        }
    };
}
/**
 * Create structured error with context
 */
var LoggableError = /** @class */ (function (_super) {
    __extends(LoggableError, _super);
    function LoggableError(message, code, metadata) {
        var _this = _super.call(this, message) || this;
        _this.code = code;
        _this.metadata = metadata;
        _this.name = 'LoggableError';
        Object.setPrototypeOf(_this, LoggableError.prototype);
        return _this;
    }
    LoggableError.prototype.log = function (level) {
        if (level === void 0) { level = 'error'; }
        var logger = (0, logger_1.getLogger)();
        var logData = __assign({ code: this.code }, this.metadata);
        if (level === 'error') {
            logger.error(this.message, logData, this);
        }
        else if (level === 'warn') {
            logger.warn(this.message, logData);
        }
        else {
            logger.info(this.message, logData);
        }
    };
    return LoggableError;
}(Error));
exports.LoggableError = LoggableError;
/**
 * Create batch logger for logging multiple operations
 */
var BatchLogger = /** @class */ (function () {
    function BatchLogger() {
        this.logs = [];
    }
    BatchLogger.prototype.add = function (level, message, metadata) {
        this.logs.push({ level: level, message: message, metadata: metadata });
        return this;
    };
    BatchLogger.prototype.error = function (message, metadata) {
        return this.add('error', message, metadata);
    };
    BatchLogger.prototype.warn = function (message, metadata) {
        return this.add('warn', message, metadata);
    };
    BatchLogger.prototype.info = function (message, metadata) {
        return this.add('info', message, metadata);
    };
    BatchLogger.prototype.debug = function (message, metadata) {
        return this.add('debug', message, metadata);
    };
    BatchLogger.prototype.flush = function () {
        var logger = (0, logger_1.getLogger)();
        for (var _i = 0, _a = this.logs; _i < _a.length; _i++) {
            var log = _a[_i];
            if (log.level === 'error') {
                logger.error(log.message, log.metadata);
            }
            else if (log.level === 'warn') {
                logger.warn(log.message, log.metadata);
            }
            else if (log.level === 'info') {
                logger.info(log.message, log.metadata);
            }
            else {
                logger.debug(log.message, log.metadata);
            }
        }
        this.logs = [];
    };
    BatchLogger.prototype.clear = function () {
        this.logs = [];
    };
    return BatchLogger;
}());
exports.BatchLogger = BatchLogger;
/**
 * Helper to wrap async handlers with logging context (framework-agnostic)
 */
function withLoggingContext(context, handler) {
    return __awaiter(this, void 0, void 0, function () {
        var derivedContext;
        return __generator(this, function (_a) {
            derivedContext = async_context_1.contextManager.initContext(context);
            return [2 /*return*/, async_context_1.contextManager.run(derivedContext, handler)];
        });
    });
}
/**
 * Create audit log entry (for compliance and security auditing)
 */
function auditLog(action, resource, actor, details) {
    var logger = (0, logger_1.getLogger)();
    logger.info("Audit: ".concat(action, " on ").concat(resource), __assign({ auditAction: action, auditResource: resource, actor: actor }, details));
}
