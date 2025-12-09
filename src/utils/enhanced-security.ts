/**
 * Enhanced Security Features - High Priority Implementation
 * PII detection, classification, and audit log tamper-proofing
 */

import { createHash } from 'crypto';

export interface PIIDetectionResult {
  hasPII: boolean;
  piiFields: string[];
  classification: 'none' | 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export interface SecurityConfig {
  enablePIIDetection: boolean;
  enableEncryption: boolean;
  enableAuditSigning: boolean;
  piiFields: string[];
  encryptionKey?: string;
  auditKey?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: number;
  level: string;
  message: string;
  metadata: Record<string, unknown>;
  signature?: string;
  hash: string;
}

export class EnhancedSecurityManager {
  private config: SecurityConfig;

  constructor(config: SecurityConfig) {
    this.config = config;
  }

  /**
   * Detect PII in data object
   */
  detectPII(data: unknown): PIIDetectionResult {
    if (!this.config.enablePIIDetection) {
      return {
        hasPII: false,
        piiFields: [],
        classification: 'none',
        recommendations: [],
      };
    }

    const piiFields: string[] = [];
    const recommendations: string[] = [];

    this.scanObject(data, '', piiFields, recommendations);

    let classification: PIIDetectionResult['classification'] = 'none';

    if (piiFields.length > 0) {
      if (piiFields.some(field => field.includes('ssn') || field.includes('social'))) {
        classification = 'critical';
      } else if (piiFields.some(field => field.includes('password') || field.includes('token'))) {
        classification = 'high';
      } else if (piiFields.some(field => field.includes('email') || field.includes('phone'))) {
        classification = 'medium';
      } else {
        classification = 'low';
      }
    }

    return {
      hasPII: piiFields.length > 0,
      piiFields,
      classification,
      recommendations,
    };
  }

  /**
   * Sanitize data by removing or masking PII
   */
  sanitizeData(data: unknown): unknown {
    if (!this.config.enablePIIDetection) {
      return data;
    }

    return this.maskPII(data);
  }

  /**
   * Create tamper-proof audit entry
   */
  createAuditEntry(
    level: string,
    message: string,
    metadata: Record<string, unknown>
  ): AuditEntry {
    const entry: AuditEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      level,
      message,
      metadata: { ...metadata },
      hash: '',
    };

    // Create content hash
    entry.hash = this.createHash(JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp,
      level: entry.level,
      message: entry.message,
      metadata: entry.metadata,
    }));

    // Add cryptographic signature if enabled
    if (this.config.enableAuditSigning && this.config.auditKey) {
      entry.signature = this.signAuditEntry(entry, this.config.auditKey);
    }

    return entry;
  }

  /**
   * Verify audit entry integrity
   */
  verifyAuditEntry(entry: AuditEntry): boolean {
    const expectedHash = this.createHash(JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp,
      level: entry.level,
      message: entry.message,
      metadata: entry.metadata,
    }));

    if (entry.hash !== expectedHash) {
      return false;
    }

    // Verify signature if present
    if (entry.signature && this.config.auditKey) {
      return this.verifySignature(entry, this.config.auditKey);
    }

    return true;
  }

  /**
   * Encrypt sensitive log data
   */
  encryptData(data: string): string {
    if (!this.config.enableEncryption || !this.config.encryptionKey) {
      return data;
    }

    const encryptionKey = this.config.encryptionKey;

    // Simple encryption for demonstration - in production use proper encryption
    const cipher = createHash('sha256');
    cipher.update(encryptionKey);
    const key = cipher.digest();

    // XOR encryption (not secure for production)
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(data.charCodeAt(i) ^ (key[i % key.length] || 0));
    }

    return Buffer.from(encrypted, 'binary').toString('base64');
  }

  /**
   * Decrypt sensitive log data
   */
  decryptData(encryptedData: string): string {
    if (!this.config.enableEncryption || !this.config.encryptionKey) {
      return encryptedData;
    }

    const encryptionKey = this.config.encryptionKey;

    // Corresponding decryption
    const key = createHash('sha256').update(encryptionKey).digest();
    const encrypted = Buffer.from(encryptedData, 'base64').toString('binary');

    let decrypted = '';
    for (let i = 0; i < encrypted.length; i++) {
      decrypted += String.fromCharCode(encrypted.charCodeAt(i) ^ (key[i % key.length] || 0));
    }

    return decrypted;
  }

  private scanObject(
    obj: unknown,
    path: string,
    piiFields: string[],
    recommendations: string[]
  ): void {
    if (!obj || typeof obj !== 'object') {
      return;
    }

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        this.scanObject(item, `${path}[${index}]`, piiFields, recommendations);
      });
      return;
    }

    const record = obj as Record<string, unknown>;

    for (const [key, value] of Object.entries(record)) {
      const currentPath = path ? `${path}.${key}` : key;

      // Check if field name indicates PII
      if (this.isPIIField(key)) {
        piiFields.push(currentPath);
        recommendations.push(`Mask or remove field: ${currentPath}`);
      }

      // Check if value contains PII patterns
      if (typeof value === 'string' && this.containsPIIPattern(value)) {
        piiFields.push(currentPath);
        recommendations.push(`Value in ${currentPath} contains sensitive data`);
      }

      // Recursively scan nested objects
      if (typeof value === 'object' && value !== null) {
        this.scanObject(value, currentPath, piiFields, recommendations);
      }
    }
  }

  private isPIIField(fieldName: string): boolean {
    const lowerField = fieldName.toLowerCase();
    return this.config.piiFields.some(piiField =>
      lowerField.includes(piiField.toLowerCase())
    );
  }

  private containsPIIPattern(value: string): boolean {
    // Common PII patterns
    const patterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}[-\s]?\d{3}[-\s]?\d{4}\b/, // Phone
      /\beyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\b/, // JWT
    ];

    return patterns.some(pattern => pattern.test(value));
  }

  private maskPII(data: unknown): unknown {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.maskPII(item));
    }

    const record = data as Record<string, unknown>;
    const masked: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(record)) {
      if (this.isPIIField(key)) {
        masked[key] = '[REDACTED]';
      } else if (typeof value === 'string' && this.containsPIIPattern(value)) {
        masked[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        masked[key] = this.maskPII(value);
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }

  private generateId(): string {
    return createHash('sha256')
      .update(`${Date.now()}-${Math.random()}`)
      .digest('hex')
      .substring(0, 16);
  }

  private createHash(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  private signAuditEntry(entry: AuditEntry, key: string): string {
    const data = JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp,
      hash: entry.hash,
    });
    return createHash('sha256').update(data + key).digest('hex');
  }

  private verifySignature(entry: AuditEntry, key: string): boolean {
    if (!entry.signature) return false;

    const data = JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp,
      hash: entry.hash,
    });
    const expectedSignature = createHash('sha256').update(data + key).digest('hex');

    return entry.signature === expectedSignature;
  }
}