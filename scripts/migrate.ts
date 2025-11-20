#!/usr/bin/env node
/**
 * Migration Script for Kitium Logger - TypeScript Version
 * Helps migrate existing projects from other loggers to @kitium-ai/centralized-logger
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { LoggerBuilder } from '../index.js';

interface MigrationStats {
  console_log: number;
  winston: number;
  bunyan: number;
  pino: number;
  debug: number;
  files: Map<string, number[]>;
}

const logger = LoggerBuilder.console('migrate');

const stats: MigrationStats = {
  console_log: 0,
  winston: 0,
  bunyan: 0,
  pino: 0,
  debug: 0,
  files: new Map(),
};

const patterns = {
  console_log: /console\.(log|error|warn|info|debug)\(/g,
  winston: /logger\.(log|error|warn|info|debug)\(/g,
  bunyan: /log\.(log|error|warn|info|debug)\(/g,
  pino: /logger\.(log|error|warn|info|debug)\(/g,
  debug: /debug\('.*?'\)/g,
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

function scanFile(filePath: string): void {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      if (patterns.console_log.test(line)) {
        stats.console_log++;
        addFileMatch(filePath, index + 1);
      }
      if (patterns.winston.test(line)) {
        stats.winston++;
        addFileMatch(filePath, index + 1);
      }
      if (patterns.bunyan.test(line)) {
        stats.bunyan++;
        addFileMatch(filePath, index + 1);
      }
      if (patterns.pino.test(line)) {
        stats.pino++;
        addFileMatch(filePath, index + 1);
      }
      if (patterns.debug.test(line)) {
        stats.debug++;
        addFileMatch(filePath, index + 1);
      }
    });
  } catch (_error) {
    // Skip files that can't be read
  }
}

function addFileMatch(filePath: string, lineNumber: number): void {
  if (!stats.files.has(filePath)) {
    stats.files.set(filePath, []);
  }
  stats.files.get(filePath)!.push(lineNumber);
}

function scanDirectory(
  dir: string,
  exclude: string[] = ['node_modules', '.git', 'dist', 'build'],
): void {
  try {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      if (exclude.includes(file)) return;

      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        scanDirectory(filePath, exclude);
      } else if (stat.isFile() && /\.(js|ts|jsx|tsx)$/.test(filePath)) {
        scanFile(filePath);
      }
    });
  } catch (_error) {
    // Skip directories that can't be read
  }
}

function printMigrationReport(): void {
  logger.info('\n╔════════════════════════════════════════════════════════════╗');
  logger.info('║         Kitium Logger Migration Report                      ║');
  logger.info('╚════════════════════════════════════════════════════════════╝\n');

  logger.info('📊 Logger Usage Summary:');
  logger.info('─────────────────────────────────────────────────────────────');
  logger.info(`  console.log/error/warn/info/debug:  ${stats.console_log} occurrences`);
  logger.info(`  Winston logger:                      ${stats.winston} occurrences`);
  logger.info(`  Bunyan logger:                       ${stats.bunyan} occurrences`);
  logger.info(`  Pino logger:                         ${stats.pino} occurrences`);
  logger.info(`  Debug module:                        ${stats.debug} occurrences`);
  logger.info('─────────────────────────────────────────────────────────────\n');

  const totalOccurrences =
    stats.console_log + stats.winston + stats.bunyan + stats.pino + stats.debug;
  logger.info(`📈 Total logging statements found: ${totalOccurrences}\n`);

  if (stats.files.size > 0) {
    logger.info('📁 Files that need migration:');
    logger.info('─────────────────────────────────────────────────────────────');
    Array.from(stats.files.entries()).forEach(([file, lines]) => {
      const relPath = path.relative(process.cwd(), file);
      logger.info(`  ${relPath}`);
      logger.info(`    Lines: ${lines.join(', ')}`);
    });
    logger.info('');
  }
}

function printMigrationGuide(): void {
  logger.info('\n📚 Migration Guide');
  logger.info('═════════════════════════════════════════════════════════════\n');

  logger.info('1️⃣  Install the package:');
  logger.info('   npm install @kitium-ai/centralized-logger\n');

  logger.info('2️⃣  Basic setup in your app entry point:\n');
  logger.info('   TypeScript:');
  logger.info('   ┌─────────────────────────────────────────────────────────┐');
  logger.info('   │ import { LoggerBuilder, LoggerType } from                │');
  logger.info('   │   "@kitium-ai/centralized-logger";                      │');
  logger.info('   │                                                           │');
  logger.info('   │ const logger = LoggerBuilder.console("my-app");          │');
  logger.info('   │ // or for file logging:                                 │');
  logger.info('   │ const logger = LoggerBuilder.file("my-app", "./logs");  │');
  logger.info('   │                                                           │');
  logger.info('   │ // use it                                               │');
  logger.info('   │ logger.info("App started", { version: "1.0.0" });       │');
  logger.info('   └─────────────────────────────────────────────────────────┘\n');

  logger.info('3️⃣  Available logger types:\n');
  logger.info('   • ConsoleLogger  - Simple console output (development)');
  logger.info('   • FileLogger     - File-based with rotation (production)');
  logger.info('   • InMemoryLogger - In-memory storage (testing)');
  logger.info('   • CentralLogger  - Cloud-native with Loki (cloud)\n');

  logger.info('📖 For more examples and migration details, see:');
  logger.info('   MIGRATION.md in the project root\n');
}

function replaceLoggingStatements(content: string): string {
  // Add import if not present
  if (!content.includes('LoggerBuilder')) {
    const importStatement = "import { LoggerBuilder } from '@kitium-ai/logger';\n";
    const lastImport = content.lastIndexOf('import ');
    if (lastImport !== -1) {
      const lineEnd = content.indexOf('\n', lastImport);
      content = content.slice(0, lineEnd + 1) + importStatement + content.slice(lineEnd + 1);
    } else {
      content = importStatement + content;
    }
  }

  // Initialize logger if not present
  if (!content.includes('const logger = LoggerBuilder')) {
    const importEnd = content.lastIndexOf('import ');
    const lineEnd = content.indexOf('\n', importEnd);
    const initStatement = "\nconst logger = LoggerBuilder.console('app');\n";
    content = content.slice(0, lineEnd + 1) + initStatement + content.slice(lineEnd + 1);
  }

  // Replace console.log with logger.info
  content = content.replace(/console\.log\(/g, 'logger.info(');
  // Replace console.error with logger.error
  content = content.replace(/console\.error\(/g, 'logger.error(');
  // Replace console.warn with logger.warn
  content = content.replace(/console\.warn\(/g, 'logger.warn(');
  // Replace console.info with logger.info
  content = content.replace(/console\.info\(/g, 'logger.info(');
  // Replace console.debug with logger.debug
  content = content.replace(/console\.debug\(/g, 'logger.debug(');

  return content;
}

function performMigration(dir: string): void {
  const filesToMigrate = Array.from(stats.files.keys());
  let migratedCount = 0;

  filesToMigrate.forEach((filePath) => {
    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      const originalContent = content;

      content = replaceLoggingStatements(content);

      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        migratedCount++;
        logger.info(`✅ Migrated: ${path.relative(dir, filePath)}`);
      }
    } catch (error) {
      logger.error(`❌ Failed to migrate: ${filePath}`, error as Error);
    }
  });

  logger.info(`\n✨ Migration complete! ${migratedCount} files updated.\n`);
}

async function main(): Promise<void> {
  logger.info('\n🚀 Kitium Logger Migration Tool (TypeScript)\n');

  const targetDir = await question(
    'Enter the project directory to scan (default: current directory): ',
  );
  const dir = targetDir.trim() || process.cwd();

  if (!fs.existsSync(dir)) {
    logger.error(`❌ Directory not found: ${dir}`);
    process.exit(1);
  }

  logger.info(`\n📂 Scanning directory: ${dir}\n`);
  logger.info('Scanning files...');

  scanDirectory(dir);

  printMigrationReport();
  printMigrationGuide();

  // Ask if user wants to perform migration
  const shouldMigrate = await question(
    '\nWould you like to automatically migrate the files? (yes/no): ',
  );
  if (shouldMigrate.toLowerCase() === 'yes' || shouldMigrate.toLowerCase() === 'y') {
    logger.info('\n🔄 Starting migration...\n');
    performMigration(dir);
  } else {
    logger.info('\nℹ️  Migration skipped. You can run this script again anytime.\n');
  }

  rl.close();
}

// Run the migration tool
main().catch((error) => {
  logger.error('Error:', error as Error);
  process.exit(1);
});
