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
exports.getLoggerConfig = exports.LogLevel = void 0;
var dotenv = require("dotenv");
dotenv.config();
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["HTTP"] = "http";
    LogLevel["DEBUG"] = "debug";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
/* eslint-disable complexity */
var getLoggerConfig = function () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    var environment = ((_a = process.env['NODE_ENV']) !== null && _a !== void 0 ? _a : 'development');
    var logLevel = ((_b = process.env['LOG_LEVEL']) !== null && _b !== void 0 ? _b : LogLevel.INFO);
    var lokiConfig = __assign(__assign({ enabled: process.env['LOKI_ENABLED'] !== 'false', host: (_c = process.env['LOKI_HOST']) !== null && _c !== void 0 ? _c : 'localhost', port: parseInt((_d = process.env['LOKI_PORT']) !== null && _d !== void 0 ? _d : '3100', 10), protocol: ((_e = process.env['LOKI_PROTOCOL']) !== null && _e !== void 0 ? _e : 'http'), labels: __assign({ service: (_f = process.env['SERVICE_NAME']) !== null && _f !== void 0 ? _f : 'default-service', environment: environment }, parseLokiLabels(process.env['LOKI_LABELS'])) }, (process.env['LOKI_USERNAME'] &&
        process.env['LOKI_PASSWORD'] && {
        basicAuth: {
            username: process.env['LOKI_USERNAME'],
            password: process.env['LOKI_PASSWORD'],
        },
    })), { batchSize: parseInt((_g = process.env['LOKI_BATCH_SIZE']) !== null && _g !== void 0 ? _g : '100', 10), interval: parseInt((_h = process.env['LOKI_INTERVAL']) !== null && _h !== void 0 ? _h : '5000', 10), timeout: parseInt((_j = process.env['LOKI_TIMEOUT']) !== null && _j !== void 0 ? _j : '10000', 10) });
    return {
        serviceName: (_k = process.env['SERVICE_NAME']) !== null && _k !== void 0 ? _k : 'default-service',
        environment: environment,
        logLevel: logLevel,
        loki: lokiConfig,
        enableConsoleTransport: process.env['LOG_CONSOLE'] !== 'false',
        enableFileTransport: process.env['LOG_FILE_ENABLED'] === 'true',
        fileLogPath: (_l = process.env['LOG_FILE_PATH']) !== null && _l !== void 0 ? _l : './logs',
        maxFileSize: (_m = process.env['LOG_MAX_FILE_SIZE']) !== null && _m !== void 0 ? _m : '100m',
        maxFiles: parseInt((_o = process.env['LOG_MAX_FILES']) !== null && _o !== void 0 ? _o : '14', 10),
        includeTimestamp: process.env['LOG_INCLUDE_TIMESTAMP'] !== 'false',
        includeMeta: process.env['LOG_INCLUDE_META'] !== 'false',
    };
};
exports.getLoggerConfig = getLoggerConfig;
function parseLokiLabels(labelsStr) {
    if (!labelsStr)
        return {};
    try {
        return JSON.parse(labelsStr);
    }
    catch (_a) {
        // Try parsing as comma-separated key=value pairs
        var labels_1 = {};
        labelsStr.split(',').forEach(function (pair) {
            var _a = pair.split('='), key = _a[0], value = _a[1];
            if (key && value) {
                labels_1[key.trim()] = value.trim();
            }
        });
        return labels_1;
    }
}
