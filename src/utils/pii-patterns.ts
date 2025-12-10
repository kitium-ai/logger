/**
 * PII Detection Patterns
 * Centralized patterns for detecting and sanitizing Personally Identifiable Information
 */

/**
 * Sensitive field names that should be redacted
 */
export const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'apikey',
  'api-key',
  'authorization',
  'cookie',
  'set-cookie',
  'jwt',
  'session',
  'credential',
  'email',
  'phone',
  'ssn',
  'ssn',
  'social',
  'credit',
  'card',
  'cvv',
  'pin',
  'account',
] as const;

/**
 * Regex patterns for detecting sensitive values
 */
export const SENSITIVE_VALUE_PATTERNS = {
  bearer: /bearer\s+[a-z0-9.-_]+/i,
  jwt: /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/,
  creditCard: /\b(?:\d[ -]*?){13,16}\b/,
  accessToken: /\b[A-Fa-f0-9]{64}\b/,
  email: /[\w._%+-]+@[\w.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  uuid: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
  ipv4: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
  url: /https?:\/\/[^\s]+/g,
  timestamp: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g,
} as const;

/**
 * Array of all sensitive value patterns for iteration
 */
export const SENSITIVE_VALUE_PATTERNS_ARRAY: RegExp[] = [
  SENSITIVE_VALUE_PATTERNS.bearer,
  SENSITIVE_VALUE_PATTERNS.jwt,
  SENSITIVE_VALUE_PATTERNS.creditCard,
  SENSITIVE_VALUE_PATTERNS.accessToken,
];

/**
 * Check if a field name is sensitive and should be redacted
 */
export function isSensitiveField(fieldName: string, customSensitiveFields?: string[]): boolean {
  const normalizedKey = fieldName.toLowerCase();
  const fields = customSensitiveFields ?? SENSITIVE_FIELDS;
  return fields.some((field) => normalizedKey.includes(field.toLowerCase()));
}

/**
 * Check if a value matches any sensitive value pattern
 */
export function isSensitiveValue(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  return SENSITIVE_VALUE_PATTERNS_ARRAY.some((pattern) => pattern.test(value));
}

/**
 * Detect PII types present in a string value
 * @returns Array of detected PII types
 */
export function detectPIITypes(value: string): string[] {
  const detected: string[] = [];

  for (const [type, pattern] of Object.entries(SENSITIVE_VALUE_PATTERNS)) {
    if (pattern.test(value)) {
      detected.push(type);
    }
  }

  return detected;
}

/**
 * Redact sensitive information from a value
 */
export function redactValue(value: unknown, redactionText = '[REDACTED]'): unknown {
  if (typeof value !== 'string') {
    if (isSensitiveValue(value)) {
      return redactionText;
    }
    return value;
  }

  let redacted = value;

  // Redact each pattern type
  for (const pattern of Object.values(SENSITIVE_VALUE_PATTERNS)) {
    if (pattern.test(redacted)) {
      redacted = redacted.replace(pattern, redactionText);
    }
  }

  return redacted;
}

/**
 * Sanitize a primitive value
 */
function sanitizePrimitive(value: unknown, redactionText: string): unknown {
  if (isSensitiveValue(value)) {
    return redactionText;
  }
  return value;
}

/**
 * Sanitize an array
 */
function sanitizeArray(
  data: unknown[],
  options: {
    sensitiveFields?: string[];
    redactionText?: string;
    deep?: boolean;
  }
): unknown[] {
  if (!options.deep) {
    return data;
  }
  return data.map((item) => sanitizeObject(item, options));
}

/**
 * Sanitize a single key-value pair
 */
function sanitizeEntry(
  key: string,
  value: unknown,
  sensitiveFields: string[],
  redactionText: string,
  deep: boolean,
  options: {
    sensitiveFields?: string[];
    redactionText?: string;
    deep?: boolean;
  }
): unknown {
  if (isSensitiveField(key, sensitiveFields) || isSensitiveValue(value)) {
    return redactionText;
  }
  if (deep && typeof value === 'object' && value !== null) {
    return sanitizeObject(value, options);
  }
  return value;
}

/**
 * Sanitize an object by redacting sensitive fields and values
 */
export function sanitizeObject(
  data: unknown,
  options: {
    sensitiveFields?: string[];
    redactionText?: string;
    deep?: boolean;
  } = {}
): unknown {
  const {
    sensitiveFields = SENSITIVE_FIELDS as unknown as string[],
    redactionText = '[REDACTED]',
    deep = true,
  } = options;

  if (typeof data !== 'object' || data === null) {
    return sanitizePrimitive(data, redactionText);
  }

  if (Array.isArray(data)) {
    return sanitizeArray(data, options);
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    sanitized[key] = sanitizeEntry(key, value, sensitiveFields, redactionText, deep, options);
  }

  return sanitized;
}

/**
 * PIIPatterns - Static utility class for PII detection and sanitization
 */
export class PIIPatterns {
  static readonly sensitiveFields = SENSITIVE_FIELDS;
  static readonly patterns = SENSITIVE_VALUE_PATTERNS;

  static isSensitiveField = isSensitiveField;
  static isSensitiveValue = isSensitiveValue;
  static detectPIITypes = detectPIITypes;
  static redactValue = redactValue;
  static sanitizeObject = sanitizeObject;
}
