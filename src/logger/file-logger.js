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
exports.FileLogger = void 0;
var winston = require("winston");
var winston_daily_rotate_file_1 = require("winston-daily-rotate-file");
var async_context_1 = require("../context/async-context");
/**
 * File-based logger with rotation support
 * Stores logs to disk in JSON format
 */
var DATE_PATTERN = 'YYYY-MM-DD';
var TIMESTAMP_FORMAT = 'YYYY-MM-DD HH:mm:ss';
var FileLogger = /** @class */ (function () {
    /* eslint-disable max-lines-per-function */
    function FileLogger(options) {
        if (options === void 0) { options = {}; }
        var _a, _b, _c, _d, _e, _f, _g;
        this.serviceName = (_a = options.serviceName) !== null && _a !== void 0 ? _a : 'app';
        var transports = [];
        // Daily rotating file
        transports.push(new winston_daily_rotate_file_1.default({
            filename: "".concat((_b = options.logPath) !== null && _b !== void 0 ? _b : './logs', "/%DATE%.log"),
            datePattern: DATE_PATTERN,
            maxSize: (_c = options.maxSize) !== null && _c !== void 0 ? _c : '100m',
            maxFiles: (_d = options.maxFiles) !== null && _d !== void 0 ? _d : '14d',
            format: winston.format.combine(winston.format.timestamp({ format: TIMESTAMP_FORMAT }), winston.format.errors({ stack: true }), winston.format.json()),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }));
        // Separate error log
        transports.push(new winston_daily_rotate_file_1.default({
            filename: "".concat((_e = options.logPath) !== null && _e !== void 0 ? _e : './logs', "/error-%DATE%.log"),
            datePattern: DATE_PATTERN,
            level: 'error',
            maxSize: (_f = options.maxSize) !== null && _f !== void 0 ? _f : '100m',
            maxFiles: (_g = options.maxFiles) !== null && _g !== void 0 ? _g : '14d',
            format: winston.format.combine(winston.format.timestamp({ format: TIMESTAMP_FORMAT }), winston.format.errors({ stack: true }), winston.format.json()),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }));
        // Optional console output
        if (options.includeConsole !== false) {
            transports.push(new winston.transports.Console({
                format: winston.format.combine(winston.format.timestamp({ format: TIMESTAMP_FORMAT }), winston.format.colorize(), winston.format.printf(function (_a) {
                    var level = _a.level, message = _a.message, timestamp = _a.timestamp;
                    return "".concat(timestamp, " [").concat(level, "] ").concat(message);
                })),
            }));
        }
        this.logger = winston.createLogger({
            level: 'debug',
            format: winston.format.json(),
            defaultMeta: {
                service: this.serviceName,
            },
            transports: transports,
        });
    }
    FileLogger.prototype.error = function (message, meta, error) {
        var logData = this.enrichLogData(meta);
        if (error) {
            logData['error'] = __assign({ message: error.message }, (error.stack && { stack: error.stack }));
        }
        this.logger.error(message, logData);
    };
    FileLogger.prototype.warn = function (message, meta) {
        var logData = this.enrichLogData(meta);
        this.logger.warn(message, logData);
    };
    FileLogger.prototype.info = function (message, meta) {
        var logData = this.enrichLogData(meta);
        this.logger.info(message, logData);
    };
    FileLogger.prototype.http = function (message, meta) {
        var logData = this.enrichLogData(meta);
        this.logger.log('info', message, logData);
    };
    FileLogger.prototype.debug = function (message, meta) {
        var logData = this.enrichLogData(meta);
        this.logger.debug(message, logData);
    };
    FileLogger.prototype.withContext = function (context, fn) {
        var fullContext = async_context_1.contextManager.initContext(context);
        return async_context_1.contextManager.run(fullContext, function () { return fn(); });
    };
    FileLogger.prototype.child = function (_metadata) {
        // Return new instance with additional metadata
        return this;
    };
    FileLogger.prototype.close = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
                        _this.logger.on('finish', resolve);
                        _this.logger.end();
                    })];
            });
        });
    };
    FileLogger.prototype.enrichLogData = function (meta) {
        var context = async_context_1.contextManager.getContext();
        return __assign(__assign({}, (typeof meta === 'object' && meta !== null ? meta : {})), { traceId: context.traceId, userId: context.userId, requestId: context.requestId, sessionId: context.sessionId, correlationId: context.correlationId });
    };
    return FileLogger;
}());
exports.FileLogger = FileLogger;
