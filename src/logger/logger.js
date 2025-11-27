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
exports.CentralLogger = void 0;
exports.initializeLogger = initializeLogger;
exports.getLogger = getLogger;
var winston = require("winston");
var winston_loki_1 = require("winston-loki");
var async_context_1 = require("../context/async-context");
var customLevels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        debug: 4,
    },
    colors: {
        error: 'red',
        warn: 'yellow',
        info: 'green',
        http: 'cyan',
        debug: 'gray',
    },
};
var CentralLogger = /** @class */ (function () {
    function CentralLogger(config, existingLogger) {
        this.config = config;
        this.logger = existingLogger !== null && existingLogger !== void 0 ? existingLogger : this.createLogger();
    }
    /* eslint-disable max-lines-per-function */
    CentralLogger.prototype.createLogger = function () {
        var transports = [];
        // Console transport
        if (this.config.enableConsoleTransport) {
            transports.push(new winston.transports.Console({
                format: winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.colorize(), winston.format.printf(this.formatConsoleLog.bind(this))),
            }));
        }
        // File transport (optional)
        if (this.config.enableFileTransport) {
            transports.push(new winston.transports.File({
                filename: "".concat(this.config.fileLogPath, "/error.log"),
                level: 'error',
                maxsize: this.parseFileSize(this.config.maxFileSize),
                maxFiles: this.config.maxFiles,
                format: winston.format.json(),
            }));
            transports.push(new winston.transports.File({
                filename: "".concat(this.config.fileLogPath, "/combined.log"),
                maxsize: this.parseFileSize(this.config.maxFileSize),
                maxFiles: this.config.maxFiles,
                format: winston.format.json(),
            }));
        }
        // Loki transport
        if (this.config.loki.enabled) {
            transports.push(new winston_loki_1.default(__assign(__assign({ host: "".concat(this.config.loki.protocol, "://").concat(this.config.loki.host), port: this.config.loki.port, labels: this.config.loki.labels, json: true, batching: true, batchSize: this.config.loki.batchSize, interval: this.config.loki.interval, timeout: this.config.loki.timeout }, (this.config.loki.basicAuth && {
                basicAuth: "".concat(this.config.loki.basicAuth.username, ":").concat(this.config.loki.basicAuth.password),
            })), { format: winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.errors({ stack: true }), this.enrichWithContext(), winston.format.json()) })));
        }
        return winston.createLogger({
            levels: customLevels.levels,
            level: this.config.logLevel,
            defaultMeta: {
                service: this.config.serviceName,
                environment: this.config.environment,
                pid: process.pid,
                hostname: require('os').hostname(),
            },
            transports: transports,
            exceptionHandlers: [
                new winston.transports.Console({
                    format: winston.format.simple(),
                }),
            ],
            rejectionHandlers: [
                new winston.transports.Console({
                    format: winston.format.simple(),
                }),
            ],
        });
    };
    CentralLogger.prototype.enrichWithContext = function () {
        return winston.format(function (info) {
            var context = async_context_1.contextManager.getContext();
            info['traceId'] = context.traceId;
            if (context.spanId)
                info['spanId'] = context.spanId;
            if (context.userId)
                info['userId'] = context.userId;
            if (context.requestId)
                info['requestId'] = context.requestId;
            if (context.sessionId)
                info['sessionId'] = context.sessionId;
            if (context.correlationId)
                info['correlationId'] = context.correlationId;
            if (context.metadata && Object.keys(context.metadata).length > 0) {
                info['metadata'] = context.metadata;
            }
            return info;
        })();
    };
    CentralLogger.prototype.formatConsoleLog = function (info) {
        var context = async_context_1.contextManager.getContext();
        var timestamp = this.config.includeTimestamp ? "".concat(info['timestamp'], " ") : '';
        var level = "[".concat(info.level.toUpperCase(), "]");
        var service = "[".concat(this.config.serviceName, "]");
        var trace = context.traceId ? " [".concat(context.traceId.substring(0, 8), "]") : '';
        var message = "".concat(timestamp).concat(level, " ").concat(service).concat(trace, " ").concat(info.message);
        if (info['error'] && info['error'] instanceof Error) {
            message += "\n  Error: ".concat(info['error'].message);
            if (info['stack']) {
                message += "\n".concat(info['stack']);
            }
        }
        if (this.config.includeMeta && info['meta'] && Object.keys(info['meta']).length > 0) {
            message += "\n  Meta: ".concat(JSON.stringify(info['meta'], null, 2));
        }
        return message;
    };
    CentralLogger.prototype.parseFileSize = function (sizeStr) {
        var _a, _b;
        var units = { k: 1024, m: 1024 * 1024, g: 1024 * 1024 * 1024 };
        var match = sizeStr.toLowerCase().match(/^(\d+)([kmg])?b?$/);
        if (!(match === null || match === void 0 ? void 0 : match[1]))
            return 100 * 1024 * 1024; // Default 100MB
        var value = parseInt(match[1], 10);
        var unit = (_a = match[2]) !== null && _a !== void 0 ? _a : 'b';
        // eslint-disable-next-line security/detect-object-injection
        return value * ((_b = units[unit]) !== null && _b !== void 0 ? _b : 1);
    };
    CentralLogger.prototype.error = function (message, meta, error) {
        var errorInfo = { message: message };
        if (error) {
            errorInfo['error'] = error;
            errorInfo['stack'] = error.stack;
        }
        if (meta) {
            errorInfo['meta'] = meta;
        }
        this.logger.error(errorInfo);
    };
    CentralLogger.prototype.warn = function (message, meta) {
        this.logger.warn({ message: message, meta: meta });
    };
    CentralLogger.prototype.info = function (message, meta) {
        this.logger.info({ message: message, meta: meta });
    };
    CentralLogger.prototype.http = function (message, meta) {
        this.logger.log('http', { message: message, meta: meta });
    };
    CentralLogger.prototype.debug = function (message, meta) {
        this.logger.debug({ message: message, meta: meta });
    };
    /**
     * Log with context initialization
     */
    CentralLogger.prototype.withContext = function (context, fn) {
        var fullContext = async_context_1.contextManager.initContext(context);
        return async_context_1.contextManager.run(fullContext, function () { return fn(); });
    };
    /**
     * Create child logger with additional metadata
     */
    CentralLogger.prototype.child = function (metadata) {
        var winstonChild = this.logger.child(metadata);
        return new CentralLogger(this.config, winstonChild);
    };
    /**
     * Close logger and flush buffers (important for Loki)
     */
    CentralLogger.prototype.close = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
                        // If logger is already closed, resolve immediately
                        if (!_this.logger || _this.logger.closed) {
                            resolve();
                            return;
                        }
                        var timeout = setTimeout(function () {
                            resolve();
                        }, 1000);
                        _this.logger.once('finish', function () {
                            clearTimeout(timeout);
                            resolve();
                        });
                        try {
                            _this.logger.end();
                        }
                        catch (_a) {
                            clearTimeout(timeout);
                            resolve();
                        }
                    })];
            });
        });
    };
    return CentralLogger;
}());
exports.CentralLogger = CentralLogger;
var globalLogger;
function initializeLogger(config) {
    globalLogger = new CentralLogger(config);
    return globalLogger;
}
function getLogger() {
    if (!globalLogger) {
        throw new Error('Logger not initialized. Call initializeLogger first.');
    }
    return globalLogger;
}
exports.default = globalLogger;
