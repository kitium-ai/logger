"use strict";
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
exports.HealthStatus = void 0;
exports.performHealthCheck = performHealthCheck;
exports.healthCheckMiddleware = healthCheckMiddleware;
exports.getHealthStatusMessage = getHealthStatusMessage;
var axios_1 = require("axios");
var promises_1 = require("node:fs/promises");
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var logger_1 = require("../logger/logger");
var logger_config_1 = require("../config/logger.config");
var metrics_1 = require("./metrics");
/**
 * Health check status
 */
var HealthStatus;
(function (HealthStatus) {
    HealthStatus["HEALTHY"] = "healthy";
    HealthStatus["DEGRADED"] = "degraded";
    HealthStatus["UNHEALTHY"] = "unhealthy";
})(HealthStatus || (exports.HealthStatus = HealthStatus = {}));
/**
 * Performs health checks on the logger system
 */
function performHealthCheck() {
    return __awaiter(this, arguments, void 0, function (config) {
        var now, uptime, loggerCheck, memoryCheck, transportCheck, allStatuses, overallStatus;
        if (config === void 0) { config = (0, logger_config_1.getLoggerConfig)(); }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    now = new Date();
                    uptime = process.uptime();
                    loggerCheck = checkLoggerHealth();
                    memoryCheck = checkMemoryHealth();
                    return [4 /*yield*/, checkTransportHealth(config)];
                case 1:
                    transportCheck = _a.sent();
                    allStatuses = [loggerCheck.status, memoryCheck.status, transportCheck.status];
                    overallStatus = HealthStatus.HEALTHY;
                    if (allStatuses.includes(HealthStatus.UNHEALTHY)) {
                        overallStatus = HealthStatus.UNHEALTHY;
                    }
                    else if (allStatuses.includes(HealthStatus.DEGRADED)) {
                        overallStatus = HealthStatus.DEGRADED;
                    }
                    return [2 /*return*/, {
                            status: overallStatus,
                            timestamp: now.toISOString(),
                            checks: {
                                logger: loggerCheck,
                                memory: memoryCheck,
                                transport: transportCheck,
                            },
                            uptime: uptime,
                        }];
            }
        });
    });
}
/**
 * Checks logger component health
 */
function checkLoggerHealth() {
    try {
        var logger = (0, logger_1.getLogger)();
        var status_1 = logger ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY;
        return {
            status: status_1,
            details: {
                initialized: !!logger,
                totalLogsEmitted: metrics_1.loggerMetrics.logCounter.get(),
                totalErrors: metrics_1.loggerMetrics.errorCounter.get(),
            },
        };
    }
    catch (error) {
        return {
            status: HealthStatus.UNHEALTHY,
            details: {
                error: error instanceof Error ? error.message : String(error),
            },
        };
    }
}
/**
 * Checks memory health
 */
function checkMemoryHealth() {
    try {
        var memUsage = process.memoryUsage();
        var heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
        // Consider unhealthy if heap is over 90% full
        var status_2 = HealthStatus.HEALTHY;
        if (heapUsedPercent > 90) {
            status_2 = HealthStatus.UNHEALTHY;
        }
        else if (heapUsedPercent > 75) {
            status_2 = HealthStatus.DEGRADED;
        }
        return {
            status: status_2,
            details: {
                heapUsed: memUsage.heapUsed,
                heapTotal: memUsage.heapTotal,
                heapUsedPercent: heapUsedPercent.toFixed(2),
                external: memUsage.external,
                rss: memUsage.rss,
            },
        };
    }
    catch (error) {
        return {
            status: HealthStatus.UNHEALTHY,
            details: {
                error: error instanceof Error ? error.message : String(error),
            },
        };
    }
}
/**
 * Checks transport health (simulated check for demonstration)
 */
function checkTransportHealth(config) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, loki, filesystem, status, detailStatuses;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, Promise.all([
                        checkLokiConnection(config.loki),
                        checkFilesystemAccess(config.enableFileTransport, config.fileLogPath),
                    ])];
                case 1:
                    _a = _b.sent(), loki = _a[0], filesystem = _a[1];
                    status = HealthStatus.HEALTHY;
                    detailStatuses = [loki.status, filesystem.status];
                    if (detailStatuses.includes(HealthStatus.UNHEALTHY)) {
                        status = HealthStatus.UNHEALTHY;
                    }
                    else if (detailStatuses.includes(HealthStatus.DEGRADED)) {
                        status = HealthStatus.DEGRADED;
                    }
                    return [2 /*return*/, {
                            status: status,
                            details: {
                                loki: loki,
                                filesystem: filesystem,
                            },
                        }];
            }
        });
    });
}
function checkLokiConnection(lokiConfig) {
    return __awaiter(this, void 0, void 0, function () {
        var baseUrl, start, requestConfig, response, latency, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!lokiConfig.enabled) {
                        return [2 /*return*/, {
                                status: HealthStatus.HEALTHY,
                                enabled: false,
                                message: 'Loki disabled',
                            }];
                    }
                    baseUrl = "".concat(lokiConfig.protocol, "://").concat(lokiConfig.host, ":").concat(lokiConfig.port);
                    start = Date.now();
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    requestConfig = {
                        timeout: (_a = lokiConfig.timeout) !== null && _a !== void 0 ? _a : 5000,
                        validateStatus: function () { return true; },
                    };
                    if (lokiConfig.basicAuth) {
                        requestConfig.auth = {
                            username: lokiConfig.basicAuth.username,
                            password: lokiConfig.basicAuth.password,
                        };
                    }
                    return [4 /*yield*/, axios_1.default.get("".concat(baseUrl, "/ready"), requestConfig)];
                case 2:
                    response = _b.sent();
                    latency = Date.now() - start;
                    if (response.status >= 200 && response.status < 400) {
                        return [2 /*return*/, {
                                status: HealthStatus.HEALTHY,
                                connected: true,
                                latencyMs: latency,
                                endpoint: "".concat(baseUrl, "/ready"),
                                statusCode: response.status,
                            }];
                    }
                    return [2 /*return*/, {
                            status: HealthStatus.DEGRADED,
                            connected: false,
                            latencyMs: latency,
                            statusCode: response.status,
                            message: 'Loki responded with non-OK status',
                        }];
                case 3:
                    error_1 = _b.sent();
                    return [2 /*return*/, {
                            status: HealthStatus.UNHEALTHY,
                            connected: false,
                            endpoint: "".concat(baseUrl, "/ready"),
                            error: error_1 instanceof Error ? error_1.message : String(error_1),
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function checkFilesystemAccess(enabled, logPath) {
    return __awaiter(this, void 0, void 0, function () {
        var resolvedPath, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!enabled) {
                        return [2 /*return*/, {
                                status: HealthStatus.HEALTHY,
                                enabled: false,
                                message: 'File transport disabled',
                            }];
                    }
                    resolvedPath = (0, node_path_1.resolve)(logPath !== null && logPath !== void 0 ? logPath : './logs');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, promises_1.access)(resolvedPath, node_fs_1.constants.W_OK)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, {
                            status: HealthStatus.HEALTHY,
                            path: resolvedPath,
                            writable: true,
                        }];
                case 3:
                    error_2 = _a.sent();
                    return [2 /*return*/, {
                            status: HealthStatus.UNHEALTHY,
                            path: resolvedPath,
                            writable: false,
                            error: error_2 instanceof Error ? error_2.message : String(error_2),
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Express middleware for health check endpoint
 */
function healthCheckMiddleware() {
    var _this = this;
    return function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
        var result, statusCode;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(req.path === '/health/logs' && req.method === 'GET')) return [3 /*break*/, 2];
                    return [4 /*yield*/, performHealthCheck()];
                case 1:
                    result = _a.sent();
                    statusCode = result.status === HealthStatus.HEALTHY ? 200 : 503;
                    res.status(statusCode).json(result);
                    return [2 /*return*/];
                case 2:
                    if (next) {
                        next();
                    }
                    return [2 /*return*/];
            }
        });
    }); };
}
/**
 * Get health status as human-readable string
 */
function getHealthStatusMessage(result) {
    var status = result.status, checks = result.checks;
    var parts = [];
    parts.push("Overall Status: ".concat(status.toUpperCase()));
    parts.push("Logger: ".concat(checks.logger.status.toUpperCase()));
    parts.push("Memory: ".concat(checks.memory.status.toUpperCase(), " (").concat(checks.memory.details['heapUsedPercent'], "%)"));
    parts.push("Transport: ".concat(checks.transport.status.toUpperCase()));
    return parts.join(' | ');
}
