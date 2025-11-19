# Migration Scripts

This directory contains scripts to help migrate existing projects to use **@kitium-ai/centralized-logger**.

## Available Scripts

### 1. `migrate.js` (Interactive Migration Tool)

A Node.js script that analyzes your project and provides migration guidance.

**Usage:**
```bash
npm run migrate
# or
node scripts/migrate.js
```

**Features:**
- Scans project for existing logging patterns
- Detects console.log, Winston, Bunyan, Pino, and Debug usage
- Generates migration report with statistics
- Provides interactive migration guide
- Identifies files that need updates

**Example Output:**
```
🚀 Kitium Logger Migration Tool

📊 Logger Usage Summary:
  console.log/error/warn/info/debug:  245 occurrences
  Winston logger:                      89 occurrences
  Total logging statements found: 334

📁 Files that need migration:
  src/index.ts
  src/utils/helpers.ts
  src/services/api.ts
```

### 2. `migrate.ts` (TypeScript Version)

A TypeScript version of the migration script for advanced use cases.

**Usage:**
```bash
ts-node scripts/migrate.ts
```

## How to Use the Migration Tool

### Step 1: Run the Scanner

```bash
npm run migrate
```

### Step 2: Review the Report

The tool will show:
- Total logging statements found
- Types of loggers detected
- Files that need updating
- Line numbers for each occurrence

### Step 3: Follow the Guide

The tool provides:
- Installation instructions
- Code examples for your use case
- Migration patterns
- Best practices

### Step 4: Apply Changes

Apply the suggested changes to your codebase:

```typescript
// Before
console.log('User logged in', userId);

// After
logger.info('User logged in', { userId });
```

### Step 5: Test & Verify

```bash
npm run test
npm run build
npm run lint
```

## Migration Patterns

The tool helps identify these common patterns:

### Pattern 1: Direct console usage
```typescript
console.log('message');
console.error('error');
```

### Pattern 2: Winston logger
```typescript
logger.info('message', metadata);
logger.error('error', metadata);
```

### Pattern 3: Pino logger
```typescript
logger.info({ userId: '123' }, 'message');
```

### Pattern 4: Bunyan logger
```typescript
log.info({ context }, 'message');
```

### Pattern 5: Debug module
```typescript
debug('namespace:message');
```

## Output Files

After scanning, the tool shows:

1. **Migration Report** - Statistics about your project's logging
2. **Migration Guide** - Step-by-step instructions
3. **File List** - Which files need changes with line numbers

## Options

### Scan specific directory

```bash
npm run migrate -- /path/to/project
```

### Get help

```bash
npm run migrate:help
```

## Integration with CI/CD

Add to your pre-commit hook or CI pipeline:

```bash
# In your CI/CD configuration
npm run migrate -- --ci

# Or generate a report
npm run migrate -- --report migration-report.json
```

## Troubleshooting

### Script not found
```bash
# Make sure scripts are executable
chmod +x scripts/migrate.js

# Or use node directly
node scripts/migrate.js
```

### Permission denied
```bash
# On Windows, you might need to use:
node scripts/migrate.js

# On Unix/Linux/Mac:
npm run migrate
```

### No loggers detected
Your project might already be using other logging methods or have custom loggers. The tool will still provide recommendations.

## Advanced Usage

### Generate migration script

The tool can optionally generate an automated migration script:

```bash
npm run migrate
# Answer 'yes' to "Would you like me to generate a migration script?"
```

This creates a script that automatically replaces common patterns.

## Next Steps

After migration:

1. Update your logger initialization
2. Import logger where needed
3. Replace logging calls
4. Run tests
5. Deploy with confidence

See [MIGRATION.md](../MIGRATION.md) for detailed examples and patterns.

## Support

For issues or questions:
- Check [MIGRATION.md](../MIGRATION.md)
- Review [examples](../src/examples/)
- Open an issue on GitHub
