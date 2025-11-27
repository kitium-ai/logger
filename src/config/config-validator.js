"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigValidationError = void 0;
exports.validateLoggerConfig = validateLoggerConfig;
exports.parseFileSize = parseFileSize;
exports.assertValidConfig = assertValidConfig;
var logger_config_1 = require("./logger.config");
var logger_1 = require("../logger/logger");
/**
 * Configuration validation errors
 */
var ConfigValidationError = /** @class */ (function (_super) {
    __extends(ConfigValidationError, _super);
    function ConfigValidationError(field, message) {
        var _this = _super.call(this, "Configuration error in field '".concat(field, "': ").concat(message)) || this;
        _this.field = field;
        _this.name = 'ConfigValidationError';
        return _this;
    }
    return ConfigValidationError;
}(Error));
exports.ConfigValidationError = ConfigValidationError;
/**
 * Validates LoggerConfig and returns validation results
 */
/* eslint-disable max-lines-per-function, max-statements, complexity, sonarjs/cognitive-complexity */
function validateLoggerConfig(config) {
    var errors = [];
    var warnings = [];
    // Validate service name
    if (!config.serviceName || config.serviceName.trim().length === 0) {
        errors.push(new ConfigValidationError('serviceName', 'Service name cannot be empty'));
    }
    else if (config.serviceName.length > 255) {
        errors.push(new ConfigValidationError('serviceName', 'Service name must be less than 255 characters'));
    }
    // Validate environment
    var validEnvironments = ['development', 'staging', 'production'];
    if (!validEnvironments.includes(config.environment)) {
        errors.push(new ConfigValidationError('environment', "Environment must be one of: ".concat(validEnvironments.join(', '))));
    }
    // Validate log level
    var validLevels = [logger_config_1.LogLevel.DEBUG, logger_config_1.LogLevel.HTTP, logger_config_1.LogLevel.INFO, logger_config_1.LogLevel.WARN, logger_config_1.LogLevel.ERROR];
    if (!validLevels.includes(config.logLevel)) {
        errors.push(new ConfigValidationError('logLevel', "Log level must be one of: ".concat(validLevels.join(', '))));
    }
    // Validate file transport settings
    if (config.enableFileTransport) {
        if (!config.fileLogPath || config.fileLogPath.trim().length === 0) {
            errors.push(new ConfigValidationError('fileLogPath', 'File log path cannot be empty when file transport is enabled'));
        }
        if (!isValidFileSize(config.maxFileSize)) {
            errors.push(new ConfigValidationError('maxFileSize', 'Invalid file size format. Use format like "10M", "100K", "1G"'));
        }
        if (config.maxFiles < 1) {
            errors.push(new ConfigValidationError('maxFiles', 'Max files must be at least 1'));
        }
        if (config.maxFiles > 100) {
            warnings.push('Warning: maxFiles set to more than 100, which may impact performance');
        }
    }
    // Validate Loki settings
    if (config.loki.enabled) {
        validateLokiConfig(config.loki, errors, warnings);
    }
    return {
        valid: errors.length === 0,
        errors: errors,
        warnings: warnings,
    };
}
/**
 * Validates Loki configuration
 */
function validateLokiConfig(loki, errors, warnings) {
    // Validate host
    if (!loki.host || loki.host.trim().length === 0) {
        errors.push(new ConfigValidationError('loki.host', 'Loki host cannot be empty'));
    }
    // Validate port
    if (loki.port < 1 || loki.port > 65535) {
        errors.push(new ConfigValidationError('loki.port', 'Loki port must be between 1 and 65535'));
    }
    // Validate protocol
    var validProtocols = ['http', 'https'];
    if (!validProtocols.includes(loki.protocol)) {
        errors.push(new ConfigValidationError('loki.protocol', "Loki protocol must be one of: ".concat(validProtocols.join(', '))));
    }
    // Validate batch settings
    if (loki.batchSize < 1) {
        errors.push(new ConfigValidationError('loki.batchSize', 'Batch size must be at least 1'));
    }
    if (loki.batchSize > 10000) {
        warnings.push('Warning: Loki batch size is very large, which may impact memory usage');
    }
    if (loki.interval < 100) {
        warnings.push('Warning: Loki interval is less than 100ms, which may impact performance');
    }
    if (loki.timeout < 1000) {
        warnings.push('Warning: Loki timeout is less than 1000ms, which may cause timeouts');
    }
    // Validate basic auth if provided
    if (loki.basicAuth) {
        if (!loki.basicAuth.username || loki.basicAuth.username.trim().length === 0) {
            errors.push(new ConfigValidationError('loki.basicAuth.username', 'Username cannot be empty'));
        }
        if (!loki.basicAuth.password || loki.basicAuth.password.trim().length === 0) {
            errors.push(new ConfigValidationError('loki.basicAuth.password', 'Password cannot be empty'));
        }
    }
    // Validate labels
    if (loki.labels && Object.keys(loki.labels).length === 0) {
        warnings.push('Warning: No Loki labels provided, logs may be difficult to search');
    }
}
/**
 * Validates file size format (e.g., "10M", "100K", "1G")
 */
function isValidFileSize(size) {
    var sizeRegex = /^(\d+\.?\d*)\s*([KMG])?B?$/i;
    return sizeRegex.test(size);
}
/**
 * Parses file size string to bytes
 */
function parseFileSize(size) {
    var _a, _b;
    var sizeRegex = /^(\d+\.?\d*)\s*([KMG])?B?$/i;
    var match = size.match(sizeRegex);
    if (!match) {
        throw new Error("Invalid file size format: ".concat(size));
    }
    var numberStr = match[1], unit = match[2];
    if (!numberStr) {
        throw new Error("Invalid file size format: ".concat(size));
    }
    var number = parseFloat(numberStr);
    var multipliers = {
        K: 1024,
        M: 1024 * 1024,
        G: 1024 * 1024 * 1024,
    };
    var multiplier = (_b = multipliers[(_a = unit === null || unit === void 0 ? void 0 : unit.toUpperCase()) !== null && _a !== void 0 ? _a : '']) !== null && _b !== void 0 ? _b : 1;
    return Math.floor(number * multiplier);
}
/**
 * Throws error if validation fails, logs warnings
 */
function assertValidConfig(config) {
    var result = validateLoggerConfig(config);
    // Log warnings if any
    if (result.warnings.length > 0) {
        try {
            var logger_2 = (0, logger_1.getLogger)();
            result.warnings.forEach(function (warning) {
                logger_2.warn(warning);
            });
        }
        catch (_a) {
            // Logger not initialized yet, skip warning logging
            console.warn(result.warnings);
        }
    }
    // Throw if validation failed
    if (!result.valid) {
        var errorMessages = result.errors.map(function (e) { return e.message; }).join('; ');
        throw new Error("Configuration validation failed: ".concat(errorMessages));
    }
}
