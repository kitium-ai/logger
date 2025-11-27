"use strict";
/**
 * Prometheus-compatible metrics collector
 * This module provides metrics collection for observability
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggerMetrics = exports.MetricsRegistry = exports.Histogram = exports.Counter = exports.Gauge = void 0;
exports.getMetricsRegistry = getMetricsRegistry;
var Gauge = /** @class */ (function () {
    function Gauge(name, help) {
        this.name = name;
        this.help = help;
        this.value = 0;
        this.labelsMap = new Map();
    }
    Gauge.prototype.set = function (value, labels) {
        if (labels) {
            var key = this.labelsToKey(labels);
            this.labelsMap.set(key, value);
        }
        else {
            this.value = value;
        }
    };
    Gauge.prototype.inc = function (amount, labels) {
        var _a;
        if (amount === void 0) { amount = 1; }
        if (labels) {
            var key = this.labelsToKey(labels);
            this.labelsMap.set(key, ((_a = this.labelsMap.get(key)) !== null && _a !== void 0 ? _a : 0) + amount);
        }
        else {
            this.value += amount;
        }
    };
    Gauge.prototype.dec = function (amount, labels) {
        if (amount === void 0) { amount = 1; }
        this.inc(-amount, labels);
    };
    Gauge.prototype.get = function () {
        return this.value;
    };
    Gauge.prototype.labelsToKey = function (labels) {
        return JSON.stringify(labels);
    };
    Gauge.prototype.toString = function () {
        var output = "# HELP ".concat(this.name, " ").concat(this.help, "\n");
        output += "# TYPE ".concat(this.name, " gauge\n");
        output += "".concat(this.name, " ").concat(this.value, "\n");
        for (var _i = 0, _a = this.labelsMap.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            var labels = JSON.parse(key);
            var labelsStr = Object.entries(labels)
                .map(function (_a) {
                var k = _a[0], v = _a[1];
                return "".concat(k, "=\"").concat(v, "\"");
            })
                .join(',');
            output += "".concat(this.name, "{").concat(labelsStr, "} ").concat(value, "\n");
        }
        return output;
    };
    return Gauge;
}());
exports.Gauge = Gauge;
var Counter = /** @class */ (function () {
    function Counter(name, help) {
        this.name = name;
        this.help = help;
        this.value = 0;
        this.labelsMap = new Map();
    }
    Counter.prototype.inc = function (amount, labels) {
        var _a;
        if (amount === void 0) { amount = 1; }
        if (amount < 0) {
            throw new Error('Counter can only be incremented, not decremented');
        }
        if (labels) {
            var key = this.labelsToKey(labels);
            this.labelsMap.set(key, ((_a = this.labelsMap.get(key)) !== null && _a !== void 0 ? _a : 0) + amount);
        }
        else {
            this.value += amount;
        }
    };
    Counter.prototype.get = function () {
        return this.value;
    };
    Counter.prototype.labelsToKey = function (labels) {
        return JSON.stringify(labels);
    };
    Counter.prototype.toString = function () {
        var output = "# HELP ".concat(this.name, " ").concat(this.help, "\n");
        output += "# TYPE ".concat(this.name, " counter\n");
        output += "".concat(this.name, " ").concat(this.value, "\n");
        for (var _i = 0, _a = this.labelsMap.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            var labels = JSON.parse(key);
            var labelsStr = Object.entries(labels)
                .map(function (_a) {
                var k = _a[0], v = _a[1];
                return "".concat(k, "=\"").concat(v, "\"");
            })
                .join(',');
            output += "".concat(this.name, "{").concat(labelsStr, "} ").concat(value, "\n");
        }
        return output;
    };
    return Counter;
}());
exports.Counter = Counter;
var Histogram = /** @class */ (function () {
    function Histogram(name, help, buckets) {
        var _this = this;
        this.name = name;
        this.help = help;
        this.buckets = [];
        this.sum = 0;
        this.count = 0;
        this.bucketCounts = new Map();
        this.buckets = buckets !== null && buckets !== void 0 ? buckets : [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
        // Initialize bucket counts
        this.buckets.forEach(function (bucket) {
            _this.bucketCounts.set(bucket, 0);
        });
        // Add +Inf bucket
        this.bucketCounts.set(Number.POSITIVE_INFINITY, 0);
    }
    Histogram.prototype.observe = function (value) {
        var _a, _b;
        this.sum += value;
        this.count += 1;
        // Count observations in each bucket
        var foundBucket = false;
        for (var _i = 0, _c = this.buckets; _i < _c.length; _i++) {
            var bucket = _c[_i];
            if (value <= bucket) {
                var currentCount = (_a = this.bucketCounts.get(bucket)) !== null && _a !== void 0 ? _a : 0;
                this.bucketCounts.set(bucket, currentCount + 1);
                foundBucket = true;
                break;
            }
        }
        // If value exceeds all buckets, increment +Inf bucket
        if (!foundBucket) {
            var infCount = (_b = this.bucketCounts.get(Number.POSITIVE_INFINITY)) !== null && _b !== void 0 ? _b : 0;
            this.bucketCounts.set(Number.POSITIVE_INFINITY, infCount + 1);
        }
    };
    Histogram.prototype.toString = function () {
        var _a, _b;
        var output = "# HELP ".concat(this.name, " ").concat(this.help, "\n");
        output += "# TYPE ".concat(this.name, " histogram\n");
        output += "".concat(this.name, "_sum ").concat(this.sum, "\n");
        output += "".concat(this.name, "_count ").concat(this.count, "\n");
        // Output bucket metrics
        var cumulativeCount = 0;
        for (var _i = 0, _c = this.buckets; _i < _c.length; _i++) {
            var bucket = _c[_i];
            var bucketCount = (_a = this.bucketCounts.get(bucket)) !== null && _a !== void 0 ? _a : 0;
            cumulativeCount += bucketCount;
            output += "".concat(this.name, "_bucket{le=\"").concat(bucket, "\"} ").concat(cumulativeCount, "\n");
        }
        // Add +Inf bucket (total count)
        var infCount = (_b = this.bucketCounts.get(Number.POSITIVE_INFINITY)) !== null && _b !== void 0 ? _b : 0;
        cumulativeCount += infCount;
        output += "".concat(this.name, "_bucket{le=\"+Inf\"} ").concat(cumulativeCount, "\n");
        return output;
    };
    return Histogram;
}());
exports.Histogram = Histogram;
/**
 * Global metrics registry
 */
var MetricsRegistry = /** @class */ (function () {
    function MetricsRegistry() {
        this.metrics = new Map();
    }
    MetricsRegistry.prototype.registerGauge = function (name, help) {
        var gauge = new Gauge(name, help);
        this.metrics.set(name, gauge);
        return gauge;
    };
    MetricsRegistry.prototype.registerCounter = function (name, help) {
        var counter = new Counter(name, help);
        this.metrics.set(name, counter);
        return counter;
    };
    MetricsRegistry.prototype.registerHistogram = function (name, help, buckets) {
        var histogram = new Histogram(name, help, buckets);
        this.metrics.set(name, histogram);
        return histogram;
    };
    MetricsRegistry.prototype.getMetric = function (name) {
        return this.metrics.get(name);
    };
    MetricsRegistry.prototype.getMetrics = function () {
        return this.metrics;
    };
    MetricsRegistry.prototype.toString = function () {
        var output = '';
        for (var _i = 0, _a = this.metrics.values(); _i < _a.length; _i++) {
            var metric = _a[_i];
            output += "".concat(metric.toString(), "\n");
        }
        return output;
    };
    MetricsRegistry.prototype.reset = function () {
        this.metrics.clear();
    };
    return MetricsRegistry;
}());
exports.MetricsRegistry = MetricsRegistry;
// Global registry instance
var globalRegistry = new MetricsRegistry();
// Logger-specific metrics
exports.loggerMetrics = {
    logCounter: globalRegistry.registerCounter('logger_logs_total', 'Total number of log entries created'),
    errorCounter: globalRegistry.registerCounter('logger_errors_total', 'Total number of error logs'),
    lokiBatchLatency: globalRegistry.registerHistogram('logger_loki_batch_latency_seconds', 'Latency of Loki batch uploads in seconds'),
    memoryUsage: globalRegistry.registerGauge('logger_memory_usage_bytes', 'Logger memory usage in bytes'),
    dropgedLogs: globalRegistry.registerCounter('logger_dropped_logs_total', 'Total number of dropped logs due to load'),
};
function getMetricsRegistry() {
    return globalRegistry;
}
