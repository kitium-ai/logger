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
exports.LoggerBuilder = exports.LoggerFactory = exports.LoggerType = void 0;
exports.initGlobalLogger = initGlobalLogger;
exports.getGlobalLogger = getGlobalLogger;
var logger_1 = require("./logger");
var in_memory_logger_1 = require("./in-memory-logger");
var console_logger_1 = require("./console-logger");
var file_logger_1 = require("./file-logger");
/**
 * Logger type enumeration
 */
var LoggerType;
(function (LoggerType) {
    LoggerType["CENTRAL"] = "central";
    LoggerType["IN_MEMORY"] = "in-memory";
    LoggerType["CONSOLE"] = "console";
    LoggerType["FILE"] = "file";
})(LoggerType || (exports.LoggerType = LoggerType = {}));
/**
 * Factory for creating different logger types
 */
var LoggerFactory = /** @class */ (function () {
    function LoggerFactory() {
    }
    /**
     * Create a logger based on type
     */
    LoggerFactory.create = function (options) {
        var _a, _b, _c, _d, _e;
        var serviceName = (_a = options.serviceName) !== null && _a !== void 0 ? _a : 'app';
        switch (options.type) {
            case LoggerType.IN_MEMORY:
                return new in_memory_logger_1.InMemoryLogger({
                    maxSize: (_b = options.maxInMemoryLogs) !== null && _b !== void 0 ? _b : 10000,
                    serviceName: serviceName,
                });
            case LoggerType.CONSOLE:
                return new console_logger_1.ConsoleLogger({
                    serviceName: serviceName,
                    includeTimestamp: options.includeTimestamp !== false,
                    colors: options.colors !== false,
                });
            case LoggerType.FILE:
                return new file_logger_1.FileLogger(__assign({ logPath: (_c = options.logPath) !== null && _c !== void 0 ? _c : './logs', maxSize: (_d = options.maxSize) !== null && _d !== void 0 ? _d : '100m', maxFiles: (_e = options.maxFiles) !== null && _e !== void 0 ? _e : '14d', serviceName: serviceName }, (options.includeConsole !== undefined && { includeConsole: options.includeConsole })));
            case LoggerType.CENTRAL:
            default:
                // For Central logger, we need the full config
                // This is handled by the LoggerBuilder
                throw new Error('Central logger requires full config. Use LoggerBuilder.createCentralLogger()');
        }
    };
    /**
     * Create a logger from type string
     */
    LoggerFactory.createFromString = function (type, options) {
        var loggerType = Object.values(LoggerType).includes(type.toLowerCase())
            ? type.toLowerCase()
            : LoggerType.CENTRAL;
        return this.create(__assign(__assign({}, options), { type: loggerType }));
    };
    return LoggerFactory;
}());
exports.LoggerFactory = LoggerFactory;
/**
 * Builder pattern for creating loggers with fluent API
 */
var LoggerBuilder = /** @class */ (function () {
    function LoggerBuilder() {
        this.type = LoggerType.CENTRAL;
        this.serviceName = 'app';
        this.logPath = './logs';
        this.maxSize = '100m';
        this.maxFiles = 14;
        this.maxInMemoryLogs = 10000;
        this.includeConsole = true;
        this.includeTimestamp = true;
        this.colors = true;
    }
    /**
     * Set logger type
     */
    LoggerBuilder.prototype.withType = function (type) {
        this.type = type;
        return this;
    };
    /**
     * Set service name
     */
    LoggerBuilder.prototype.withServiceName = function (serviceName) {
        this.serviceName = serviceName;
        return this;
    };
    /**
     * Set log file path
     */
    LoggerBuilder.prototype.withLogPath = function (path) {
        this.logPath = path;
        return this;
    };
    /**
     * Set max file size
     */
    LoggerBuilder.prototype.withMaxFileSize = function (size) {
        this.maxSize = size;
        return this;
    };
    /**
     * Set max number of files
     */
    LoggerBuilder.prototype.withMaxFiles = function (count) {
        this.maxFiles = count;
        return this;
    };
    /**
     * Set max in-memory logs
     */
    LoggerBuilder.prototype.withMaxInMemoryLogs = function (count) {
        this.maxInMemoryLogs = count;
        return this;
    };
    /**
     * Enable/disable console output
     */
    LoggerBuilder.prototype.withConsole = function (enabled) {
        this.includeConsole = enabled;
        return this;
    };
    /**
     * Enable/disable timestamps
     */
    LoggerBuilder.prototype.withTimestamps = function (enabled) {
        this.includeTimestamp = enabled;
        return this;
    };
    /**
     * Enable/disable colored output
     */
    LoggerBuilder.prototype.withColors = function (enabled) {
        this.colors = enabled;
        return this;
    };
    /**
     * Set full config (for central logger)
     */
    LoggerBuilder.prototype.withConfig = function (config) {
        this.config = config;
        return this;
    };
    /**
     * Build the logger
     */
    LoggerBuilder.prototype.build = function () {
        if (this.type === LoggerType.CENTRAL) {
            if (!this.config) {
                throw new Error('Central logger requires config. Use .withConfig()');
            }
            return new logger_1.CentralLogger(this.config);
        }
        return LoggerFactory.create({
            type: this.type,
            serviceName: this.serviceName,
            logPath: this.logPath,
            maxSize: this.maxSize,
            maxFiles: this.maxFiles,
            maxInMemoryLogs: this.maxInMemoryLogs,
            includeConsole: this.includeConsole,
            includeTimestamp: this.includeTimestamp,
            colors: this.colors,
        });
    };
    /**
     * Build console logger (convenience method)
     */
    LoggerBuilder.console = function (serviceName) {
        if (serviceName === void 0) { serviceName = 'app'; }
        return new LoggerBuilder().withType(LoggerType.CONSOLE).withServiceName(serviceName).build();
    };
    /**
     * Build file logger (convenience method)
     */
    LoggerBuilder.file = function (serviceName, logPath) {
        if (serviceName === void 0) { serviceName = 'app'; }
        if (logPath === void 0) { logPath = './logs'; }
        return new LoggerBuilder()
            .withType(LoggerType.FILE)
            .withServiceName(serviceName)
            .withLogPath(logPath)
            .build();
    };
    /**
     * Build in-memory logger (convenience method)
     */
    LoggerBuilder.inMemory = function (serviceName, maxLogs) {
        if (serviceName === void 0) { serviceName = 'app'; }
        if (maxLogs === void 0) { maxLogs = 10000; }
        return new LoggerBuilder()
            .withType(LoggerType.IN_MEMORY)
            .withServiceName(serviceName)
            .withMaxInMemoryLogs(maxLogs)
            .build();
    };
    /**
     * Build central logger (convenience method)
     */
    LoggerBuilder.central = function (config) {
        return new LoggerBuilder().withType(LoggerType.CENTRAL).withConfig(config).build();
    };
    return LoggerBuilder;
}());
exports.LoggerBuilder = LoggerBuilder;
/**
 * Global logger instance
 */
var globalLogger = null;
/**
 * Initialize global logger with automatic type selection
 */
function initGlobalLogger(options) {
    if (options.type === LoggerType.CENTRAL && !options.config) {
        throw new Error('Central logger requires config option');
    }
    if (options.type === LoggerType.CENTRAL && options.config) {
        globalLogger = new logger_1.CentralLogger(options.config);
    }
    else {
        globalLogger = LoggerFactory.create(options);
    }
    return globalLogger;
}
/**
 * Get global logger instance
 */
function getGlobalLogger() {
    if (!globalLogger) {
        throw new Error('Global logger not initialized. Call initGlobalLogger() or initializeLogger() first.');
    }
    return globalLogger;
}
