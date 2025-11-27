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
exports.CircuitBreaker = void 0;
exports.retryWithBackoff = retryWithBackoff;
exports.safeAsync = safeAsync;
exports.withGracefulDegradation = withGracefulDegradation;
var logger_1 = require("../logger/logger");
/**
 * Retry an async function with exponential backoff
 */
/* eslint-disable complexity */
function retryWithBackoff(fn_1) {
    return __awaiter(this, arguments, void 0, function (fn, config) {
        var _a, maxRetries, _b, initialDelayMs, _c, maxDelayMs, _d, backoffMultiplier, lastError, delay, _loop_1, attempt, state_1;
        if (config === void 0) { config = {}; }
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _a = config.maxRetries, maxRetries = _a === void 0 ? 3 : _a, _b = config.initialDelayMs, initialDelayMs = _b === void 0 ? 100 : _b, _c = config.maxDelayMs, maxDelayMs = _c === void 0 ? 10000 : _c, _d = config.backoffMultiplier, backoffMultiplier = _d === void 0 ? 2 : _d;
                    delay = initialDelayMs;
                    _loop_1 = function (attempt) {
                        var _f, error_1, jitter, actualDelay_1;
                        return __generator(this, function (_g) {
                            switch (_g.label) {
                                case 0:
                                    _g.trys.push([0, 2, , 4]);
                                    _f = {};
                                    return [4 /*yield*/, fn()];
                                case 1: return [2 /*return*/, (_f.value = _g.sent(), _f)];
                                case 2:
                                    error_1 = _g.sent();
                                    lastError = error_1 instanceof Error ? error_1 : new Error(String(error_1));
                                    if (attempt === maxRetries) {
                                        return [2 /*return*/, "break"];
                                    }
                                    jitter = Math.random() * 0.1 * delay;
                                    actualDelay_1 = Math.min(delay + jitter, maxDelayMs);
                                    (0, logger_1.getLogger)().debug("Retry attempt ".concat(attempt + 1, "/").concat(maxRetries, " after ").concat(actualDelay_1, "ms"), {
                                        error: lastError.message,
                                        attempt: attempt + 1,
                                        delay: actualDelay_1,
                                    });
                                    // Wait before retrying
                                    return [4 /*yield*/, new Promise(function (resolve) {
                                            setTimeout(function () {
                                                resolve();
                                            }, actualDelay_1);
                                        })];
                                case 3:
                                    // Wait before retrying
                                    _g.sent();
                                    // Increase delay for next iteration
                                    delay = Math.min(delay * backoffMultiplier, maxDelayMs);
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    };
                    attempt = 0;
                    _e.label = 1;
                case 1:
                    if (!(attempt <= maxRetries)) return [3 /*break*/, 4];
                    return [5 /*yield**/, _loop_1(attempt)];
                case 2:
                    state_1 = _e.sent();
                    if (typeof state_1 === "object")
                        return [2 /*return*/, state_1.value];
                    if (state_1 === "break")
                        return [3 /*break*/, 4];
                    _e.label = 3;
                case 3:
                    attempt++;
                    return [3 /*break*/, 1];
                case 4:
                    // All retries failed
                    (0, logger_1.getLogger)().error('All retry attempts failed', {
                        maxRetries: maxRetries,
                        lastError: lastError === null || lastError === void 0 ? void 0 : lastError.message,
                    });
                    throw lastError !== null && lastError !== void 0 ? lastError : new Error('Failed after all retries');
            }
        });
    });
}
/**
 * Circuit breaker for handling cascading failures
 */
var CircuitBreaker = /** @class */ (function () {
    function CircuitBreaker(fn, config) {
        if (config === void 0) { config = {}; }
        this.fn = fn;
        this.config = config;
        this.failureCount = 0;
        this.lastFailureTime = null;
        this.state = 'closed';
    }
    CircuitBreaker.prototype.execute = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, failureThreshold, _c, resetTimeoutMs, result, error_2;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _a = this.config, _b = _a.failureThreshold, failureThreshold = _b === void 0 ? 5 : _b, _c = _a.resetTimeoutMs, resetTimeoutMs = _c === void 0 ? 60000 : _c;
                        // Check if circuit should be reset
                        if (this.state === 'open' &&
                            this.lastFailureTime &&
                            Date.now() - this.lastFailureTime > resetTimeoutMs) {
                            this.setState('half-open');
                        }
                        // If circuit is open, throw error immediately
                        if (this.state === 'open') {
                            throw new Error('Circuit breaker is open - service temporarily unavailable');
                        }
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.fn()];
                    case 2:
                        result = _d.sent();
                        // Reset on success
                        if (this.state === 'half-open') {
                            this.setState('closed');
                            this.failureCount = 0;
                        }
                        return [2 /*return*/, result];
                    case 3:
                        error_2 = _d.sent();
                        this.failureCount++;
                        this.lastFailureTime = Date.now();
                        if (this.failureCount >= failureThreshold) {
                            this.setState('open');
                            (0, logger_1.getLogger)().error('Circuit breaker opened due to repeated failures', {
                                failureCount: this.failureCount,
                                threshold: failureThreshold,
                            });
                        }
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    CircuitBreaker.prototype.setState = function (newState) {
        var _a, _b;
        var oldState = this.state;
        this.state = newState;
        if (oldState !== newState) {
            (0, logger_1.getLogger)().info("Circuit breaker state changed: ".concat(oldState, " -> ").concat(newState), {
                state: newState,
            });
            (_b = (_a = this.config).onStateChange) === null || _b === void 0 ? void 0 : _b.call(_a, newState);
        }
    };
    CircuitBreaker.prototype.getState = function () {
        return this.state;
    };
    return CircuitBreaker;
}());
exports.CircuitBreaker = CircuitBreaker;
/**
 * Safe error handler for async operations
 */
function safeAsync(fn, errorHandler) {
    return __awaiter(this, void 0, void 0, function () {
        var error_3, err;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fn()];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_3 = _a.sent();
                    err = error_3 instanceof Error ? error_3 : new Error(String(error_3));
                    errorHandler === null || errorHandler === void 0 ? void 0 : errorHandler(err);
                    (0, logger_1.getLogger)().error('Error in async operation', { error: err.message });
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Graceful degradation handler
 */
function withGracefulDegradation(primaryFn, fallbackFn, context) {
    return __awaiter(this, void 0, void 0, function () {
        var operationName, primaryError_1, fallbackError_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    operationName = (_a = context === null || context === void 0 ? void 0 : context.operation) !== null && _a !== void 0 ? _a : 'Operation';
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 8]);
                    return [4 /*yield*/, primaryFn()];
                case 2: return [2 /*return*/, _b.sent()];
                case 3:
                    primaryError_1 = _b.sent();
                    (0, logger_1.getLogger)().warn("".concat(operationName, " primary operation failed, attempting fallback"), __assign(__assign({}, context === null || context === void 0 ? void 0 : context.metadata), { error: primaryError_1 instanceof Error ? primaryError_1.message : String(primaryError_1) }));
                    _b.label = 4;
                case 4:
                    _b.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, fallbackFn()];
                case 5: return [2 /*return*/, _b.sent()];
                case 6:
                    fallbackError_1 = _b.sent();
                    (0, logger_1.getLogger)().error("".concat(operationName, " failed in both primary and fallback operations"), __assign(__assign({}, context === null || context === void 0 ? void 0 : context.metadata), { primaryError: primaryError_1 instanceof Error ? primaryError_1.message : String(primaryError_1), fallbackError: fallbackError_1 instanceof Error ? fallbackError_1.message : String(fallbackError_1) }));
                    throw fallbackError_1;
                case 7: return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
