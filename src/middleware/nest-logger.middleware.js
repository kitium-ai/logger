"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NestLoggerMiddleware = void 0;
exports.createNestExceptionFilter = createNestExceptionFilter;
exports.createNestLoggingMiddleware = createNestLoggingMiddleware;
var async_context_1 = require("../context/async-context");
var logger_1 = require("../logger/logger");
var express_middleware_1 = require("./express-middleware");
var HEADER_TRACE_ID = 'x-trace-id';
var HEADER_SPAN_ID = 'x-span-id';
var HEADER_REQUEST_ID = 'x-request-id';
var HEADER_USER_ID = 'x-user-id';
var HEADER_SESSION_ID = 'x-session-id';
var HEADER_CORRELATION_ID = 'x-correlation-id';
var NestLoggerMiddleware = /** @class */ (function () {
    function NestLoggerMiddleware() {
    }
    NestLoggerMiddleware.prototype.use = function (req, res, next) {
        var _a;
        var partialContext = {};
        var headers = (_a = req.headers) !== null && _a !== void 0 ? _a : {};
        var traceId = headers[HEADER_TRACE_ID];
        var spanId = headers[HEADER_SPAN_ID];
        var requestId = headers[HEADER_REQUEST_ID];
        var userId = headers[HEADER_USER_ID];
        var sessionId = headers[HEADER_SESSION_ID];
        var correlationId = headers[HEADER_CORRELATION_ID];
        if (traceId)
            partialContext.traceId = traceId;
        if (spanId)
            partialContext.spanId = spanId;
        if (requestId)
            partialContext.requestId = requestId;
        if (userId)
            partialContext.userId = userId;
        if (sessionId)
            partialContext.sessionId = sessionId;
        if (correlationId)
            partialContext.correlationId = correlationId;
        var context = async_context_1.contextManager.initContext(partialContext);
        async_context_1.contextManager.run(context, function () {
            var _a, _b;
            (0, express_middleware_1.addMetadata)('ip', req.ip);
            (0, express_middleware_1.addMetadata)('method', req.method);
            (0, express_middleware_1.addMetadata)('path', req.url);
            var start = Date.now();
            var logCompletion = function () {
                (0, logger_1.getLogger)().http('Nest request completed', {
                    method: req.method,
                    path: req.url,
                    statusCode: res.statusCode,
                    duration: Date.now() - start,
                });
            };
            (_a = res.once) === null || _a === void 0 ? void 0 : _a.call(res, 'finish', logCompletion);
            (_b = res.once) === null || _b === void 0 ? void 0 : _b.call(res, 'close', logCompletion);
            next();
        });
    };
    return NestLoggerMiddleware;
}());
exports.NestLoggerMiddleware = NestLoggerMiddleware;
function createNestExceptionFilter() {
    return {
        catch: function (exception, host) {
            var _a;
            var ctx = host.switchToHttp();
            var response = ctx.getResponse();
            var request = ctx.getRequest();
            (0, logger_1.getLogger)().error('Nest exception caught', {
                method: request === null || request === void 0 ? void 0 : request.method,
                path: request === null || request === void 0 ? void 0 : request.url,
                error: exception instanceof Error
                    ? { message: exception.message, stack: exception.stack }
                    : exception,
            });
            (_a = response.status) === null || _a === void 0 ? void 0 : _a.call(response, 500).json({
                statusCode: 500,
                timestamp: new Date().toISOString(),
                path: request === null || request === void 0 ? void 0 : request.url,
            });
        },
    };
}
function createNestLoggingMiddleware() {
    return new NestLoggerMiddleware();
}
