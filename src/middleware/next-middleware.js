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
exports.withNextApiLogger = withNextApiLogger;
exports.withNextRouteLogger = withNextRouteLogger;
exports.createNextFetchWrapper = createNextFetchWrapper;
var logger_1 = require("../logger/logger");
var async_context_1 = require("../context/async-context");
var express_middleware_1 = require("./express-middleware");
var HEADER_TRACE_ID = 'x-trace-id';
var HEADER_SPAN_ID = 'x-span-id';
var HEADER_REQUEST_ID = 'x-request-id';
var HEADER_USER_ID = 'x-user-id';
var HEADER_SESSION_ID = 'x-session-id';
var HEADER_CORRELATION_ID = 'x-correlation-id';
function buildLogContextFromHeaders(headers) {
    var context = {};
    var traceId = headers.get(HEADER_TRACE_ID);
    var spanId = headers.get(HEADER_SPAN_ID);
    var requestId = headers.get(HEADER_REQUEST_ID);
    var userId = headers.get(HEADER_USER_ID);
    var sessionId = headers.get(HEADER_SESSION_ID);
    var correlationId = headers.get(HEADER_CORRELATION_ID);
    if (traceId)
        context.traceId = traceId;
    if (spanId)
        context.spanId = spanId;
    if (requestId)
        context.requestId = requestId;
    if (userId)
        context.userId = userId;
    if (sessionId)
        context.sessionId = sessionId;
    if (correlationId)
        context.correlationId = correlationId;
    return context;
}
function headersFromRecord(raw) {
    var headers = new Headers();
    if (!raw)
        return headers;
    var _loop_1 = function (key, value) {
        if (Array.isArray(value)) {
            value.forEach(function (entry) { return headers.append(key, entry); });
        }
        else if (typeof value === 'string') {
            headers.set(key, value);
        }
    };
    for (var _i = 0, _a = Object.entries(raw); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], value = _b[1];
        _loop_1(key, value);
    }
    return headers;
}
function withNextApiLogger(handler) {
    var _this = this;
    return function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var headers, partialContext, fallbackRequestId, context;
        var _this = this;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            headers = headersFromRecord(req.headers);
            partialContext = buildLogContextFromHeaders(headers);
            if (!partialContext.requestId) {
                fallbackRequestId = (_a = headers.get(HEADER_TRACE_ID)) !== null && _a !== void 0 ? _a : (typeof ((_b = req.query) === null || _b === void 0 ? void 0 : _b['requestId']) === 'string' ? (_c = req.query) === null || _c === void 0 ? void 0 : _c['requestId'] : undefined);
                if (fallbackRequestId) {
                    partialContext.requestId = fallbackRequestId;
                }
            }
            context = async_context_1.contextManager.initContext(partialContext);
            return [2 /*return*/, async_context_1.contextManager.run(context, function () { return __awaiter(_this, void 0, void 0, function () {
                    var start, result, error_1;
                    var _a;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                start = Date.now();
                                _b.label = 1;
                            case 1:
                                _b.trys.push([1, 3, , 4]);
                                (0, express_middleware_1.addMetadata)('ip', (_a = req.socket) === null || _a === void 0 ? void 0 : _a.remoteAddress);
                                (0, express_middleware_1.addMetadata)('method', req.method);
                                (0, express_middleware_1.addMetadata)('path', req.url);
                                return [4 /*yield*/, handler(req, res)];
                            case 2:
                                result = _b.sent();
                                (0, logger_1.getLogger)().http('Next API request completed', {
                                    method: req.method,
                                    path: req.url,
                                    statusCode: res.statusCode,
                                    duration: Date.now() - start,
                                });
                                return [2 /*return*/, result];
                            case 3:
                                error_1 = _b.sent();
                                (0, logger_1.getLogger)().error('Next API handler error', { method: req.method, path: req.url }, error_1);
                                throw error_1;
                            case 4: return [2 /*return*/];
                        }
                    });
                }); })];
        });
    }); };
}
function withNextRouteLogger(handler) {
    var _this = this;
    return function (request) { return __awaiter(_this, void 0, void 0, function () {
        var partialContext, fallbackRequestId, context;
        var _this = this;
        var _a;
        return __generator(this, function (_b) {
            partialContext = buildLogContextFromHeaders(request.headers);
            if (!partialContext.requestId) {
                fallbackRequestId = (_a = request.headers.get(HEADER_TRACE_ID)) !== null && _a !== void 0 ? _a : request.headers.get(HEADER_REQUEST_ID);
                if (fallbackRequestId) {
                    partialContext.requestId = fallbackRequestId;
                }
            }
            context = async_context_1.contextManager.initContext(partialContext);
            return [2 /*return*/, async_context_1.contextManager.run(context, function () { return __awaiter(_this, void 0, void 0, function () {
                    var start, response, error_2;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                start = Date.now();
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 3, , 4]);
                                return [4 /*yield*/, handler(request)];
                            case 2:
                                response = _a.sent();
                                (0, logger_1.getLogger)().http('Next route completed', {
                                    method: request.method,
                                    path: request.nextUrl.pathname,
                                    duration: Date.now() - start,
                                });
                                return [2 /*return*/, response];
                            case 3:
                                error_2 = _a.sent();
                                (0, logger_1.getLogger)().error('Next route handler error', { method: request.method, path: request.nextUrl.pathname }, error_2);
                                throw error_2;
                            case 4: return [2 /*return*/];
                        }
                    });
                }); })];
        });
    }); };
}
function createNextFetchWrapper(fetchFn) {
    var _this = this;
    return function (input, init) { return __awaiter(_this, void 0, void 0, function () {
        var context, headers;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            context = async_context_1.contextManager.getContext();
            headers = new Headers((_a = init === null || init === void 0 ? void 0 : init.headers) !== null && _a !== void 0 ? _a : {});
            headers.set(HEADER_TRACE_ID, context.traceId);
            headers.set(HEADER_SPAN_ID, (_b = context.spanId) !== null && _b !== void 0 ? _b : '');
            headers.set(HEADER_REQUEST_ID, (_c = context.requestId) !== null && _c !== void 0 ? _c : context.traceId);
            if (context.userId)
                headers.set(HEADER_USER_ID, context.userId);
            if (context.sessionId)
                headers.set(HEADER_SESSION_ID, context.sessionId);
            if (context.correlationId)
                headers.set(HEADER_CORRELATION_ID, context.correlationId);
            return [2 /*return*/, fetchFn(input, __assign(__assign({}, init), { headers: headers }))];
        });
    }); };
}
