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
exports.contextManager = void 0;
var async_hooks_1 = require("async_hooks");
var uuid_1 = require("uuid");
var ContextManager = /** @class */ (function () {
    function ContextManager() {
        this.asyncLocalStorage = new async_hooks_1.AsyncLocalStorage();
    }
    /**
     * Initialize context for a new trace/request
     */
    /* eslint-disable complexity */
    ContextManager.prototype.initContext = function (context) {
        var _a, _b, _c;
        var newContext = __assign(__assign(__assign(__assign({ traceId: (_a = context === null || context === void 0 ? void 0 : context.traceId) !== null && _a !== void 0 ? _a : (0, uuid_1.v4)(), spanId: (_b = context === null || context === void 0 ? void 0 : context.spanId) !== null && _b !== void 0 ? _b : (0, uuid_1.v4)(), requestId: (_c = context === null || context === void 0 ? void 0 : context.requestId) !== null && _c !== void 0 ? _c : (0, uuid_1.v4)() }, ((context === null || context === void 0 ? void 0 : context.userId) !== undefined && { userId: context.userId })), ((context === null || context === void 0 ? void 0 : context.sessionId) !== undefined && { sessionId: context.sessionId })), ((context === null || context === void 0 ? void 0 : context.correlationId) !== undefined && { correlationId: context.correlationId })), ((context === null || context === void 0 ? void 0 : context.metadata) !== undefined && { metadata: context.metadata }));
        return newContext;
    };
    /**
     * Run function within a context
     */
    ContextManager.prototype.run = function (context, fn) {
        return this.asyncLocalStorage.run(context, fn);
    };
    /**
     * Get current context or create a new one
     */
    ContextManager.prototype.getContext = function () {
        var existing = this.asyncLocalStorage.getStore();
        if (existing) {
            return existing;
        }
        return this.initContext();
    };
    /**
     * Set context values
     */
    ContextManager.prototype.setContext = function (context) {
        var existing = this.getContext();
        var updated = __assign(__assign({}, existing), context);
        return updated;
    };
    /**
     * Get specific context value
     */
    ContextManager.prototype.get = function (key) {
        // eslint-disable-next-line security/detect-object-injection
        return this.getContext()[key];
    };
    /**
     * Set specific context value
     */
    ContextManager.prototype.set = function (key, value) {
        var context = this.getContext();
        // eslint-disable-next-line security/detect-object-injection
        context[key] = value;
    };
    /**
     * Add metadata to context
     */
    ContextManager.prototype.addMetadata = function (key, value) {
        var _a;
        var context = this.getContext();
        (_a = context.metadata) !== null && _a !== void 0 ? _a : (context.metadata = {});
        // eslint-disable-next-line security/detect-object-injection
        context.metadata[key] = value;
    };
    /**
     * Clear context
     */
    ContextManager.prototype.clear = function () {
        // AsyncLocalStorage doesn't have an exitSyncScope method
        // Context is automatically cleared when exiting the async context
    };
    return ContextManager;
}());
exports.contextManager = new ContextManager();
