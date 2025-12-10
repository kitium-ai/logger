/**
 * Enhanced Security Features - High Priority Implementation
 * PII detection, classification, and audit log tamper-proofing
 */

import { createHash } from 'node:crypto';

import { detectPIITypes, PIIPatterns } from './pii-patterns';

export type PIIDetectionResult = {
  hasPII: boolean;
  piiFields: string[];
  classification: 'none' | 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
};

export type SecurityConfig = {
  enablePIIDetection: boolean;
  enableEncryption: boolean;
  enableAuditSigning: boolean;
  piiFields: string[];
  encryptionKey?: string;
  auditKey?: string;
};

export type AuditEntry = {
  id: string;
  timestamp: number;
  level: string;
  message: string;
  metadata: Record<string, unknown>;
  signature?: string;
  hash: string;
};

export class EnhancedSecurityManager {
  private readonly config: SecurityConfig;

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
      if (piiFields.some((field) => field.includes('ssn') || field.includes('social'))) {
        classification = 'critical';
      } else if (piiFields.some((field) => field.includes('password') || field.includes('token'))) {
        classification = 'high';
      } else if (piiFields.some((field) => field.includes('email') || field.includes('phone'))) {
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
  createAuditEntry(level: string, message: string, metadata: Record<string, unknown>): AuditEntry {
    const entry: AuditEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      level,
      message,
      metadata: { ...metadata },
      hash: '',
    };

    // Create content hash
    entry.hash = this.createHash(
      JSON.stringify({
        id: entry.id,
        timestamp: entry.timestamp,
        level: entry.level,
        message: entry.message,
        metadata: entry.metadata,
      })
    );

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
    const expectedHash = this.createHash(
      JSON.stringify({
        id: entry.id,
        timestamp: entry.timestamp,
        level: entry.level,
        message: entry.message,
        metadata: entry.metadata,
      })
    );

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
    for (let index = 0; index < data.length; index++) {
      // eslint-disable-next-line no-bitwise
      encrypted += String.fromCharCode(data.charCodeAt(index) ^ (key[index % key.length] || 0));
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
    for (let index = 0; index < encrypted.length; index++) {
      decrypted += String.fromCharCode(
        encrypted.charCodeAt(index) ^ (key[index % key.length] || 0)
      );
    }

    return decrypted;
  }

  private scanObject(
    object: unknown,
    path: string,
    piiFields: string[],
    recommendations: string[]
  ): void {
    if (!object || typeof object !== 'object') {
      return;
    }

    if (Array.isArray(object)) {
      object.forEach((item, index) => {
        this.scanObject(item, `${path}[${index}]`, piiFields, recommendations);
      });
      return;
    }

    const record = object as Record<string, unknown>;

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
    return PIIPatterns.isSensitiveField(fieldName, this.config.piiFields);
  }

  private containsPIIPattern(value: string): boolean {
    // Use centralized PII detection
    return detectPIITypes(value).length > 0;
  }

  private maskPII(data: unknown): unknown {
    // Use centralized sanitization logic
    return PIIPatterns.sanitizeObject(data, {
      sensitiveFields: this.config.piiFields,
      redactionText: '[REDACTED]',
      deep: true,
    });
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
    return createHash('sha256')
      .update(data + key)
      .digest('hex');
  }

  private verifySignature(entry: AuditEntry, key: string): boolean {
    if (!entry.signature) {
      return false;
    }

    const data = JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp,
      hash: entry.hash,
    });
    const expectedSignature = createHash('sha256')
      .update(data + key)
      .digest('hex');

    return entry.signature === expectedSignature;
  }
}
