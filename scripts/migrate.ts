#!/usr/bin/env node
/**
 * Migration Script for Kitium Logger - TypeScript Version
 * Helps migrate existing projects from other loggers to @kitium-ai/centralized-logger
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { glob } from 'glob';
import { LoggerBuilder } from '../index.js';

type LoggerCategory = 'console_log' | 'winston' | 'bunyan' | 'pino' | 'debug';

interface MigrationStats {
  counts: Record<LoggerCategory, number>;
  files: Map<string, Array<{ line: number; category: LoggerCategory }>>;
}

const logger = LoggerBuilder.console('migrate');

const stats: MigrationStats = {
  counts: {
    console_log: 0,
    winston: 0,
    bunyan: 0,
    pino: 0,
    debug: 0,
  },
  files: new Map(),
};

const patterns: Record<LoggerCategory, RegExp> = {
  console_log: /console\.(log|error|warn|info|debug)\(/g,
  winston: /(winston|createLogger)\.(log|error|warn|info|debug)\(/g,
  bunyan: /(bunyan|createLogger)\.(log|error|warn|info|debug)\(/g,
  pino: /(pino|createLogger)\.(log|error|warn|info|debug)\(/g,
  debug: /debug\(['"`].*?['"`]\)/g,
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
      (Object.keys(patterns) as LoggerCategory[]).forEach((category) => {
        patterns[category].lastIndex = 0;
        if (patterns[category].test(line)) {
          stats.counts[category]++;
          addFileMatch(filePath, index + 1, category);
        }
      });
    });
  } catch (_error) {
    // Skip files that can't be read
  }
}

function addFileMatch(filePath: string, lineNumber: number, category: LoggerCategory): void {
  if (!stats.files.has(filePath)) {
    stats.files.set(filePath, []);
  }
  stats.files.get(filePath)!.push({ line: lineNumber, category });
}

async function scanDirectory(dir: string, ignoreGlobs: string[]): Promise<void> {
  const matchers = ignoreGlobs.length ? { ignore: ignoreGlobs } : {};
  const files = await glob('**/*.{js,ts,jsx,tsx}', {
    cwd: dir,
    nodir: true,
    ...matchers,
  });

  files.forEach((relativePath) => {
    const filePath = path.join(dir, relativePath);
    scanFile(filePath);
  });
}

function printMigrationReport(): void {
  logger.info('\n╔════════════════════════════════════════════════════════════╗');
  logger.info('║         Kitium Logger Migration Report                      ║');
  logger.info('╚════════════════════════════════════════════════════════════╝\n');

  logger.info('📊 Logger Usage Summary:');
  logger.info('─────────────────────────────────────────────────────────────');
  logger.info(`  console.log/error/warn/info/debug:  ${stats.counts.console_log} occurrences`);
  logger.info(`  Winston logger:                      ${stats.counts.winston} occurrences`);
  logger.info(`  Bunyan logger:                       ${stats.counts.bunyan} occurrences`);
  logger.info(`  Pino logger:                         ${stats.counts.pino} occurrences`);
  logger.info(`  Debug module:                        ${stats.counts.debug} occurrences`);
  logger.info('─────────────────────────────────────────────────────────────\n');

  const totalOccurrences = Object.values(stats.counts).reduce((sum, value) => sum + value, 0);
  logger.info(`📈 Total logging statements found: ${totalOccurrences}\n`);

  if (stats.files.size > 0) {
    logger.info('📁 Files that need migration:');
    logger.info('─────────────────────────────────────────────────────────────');
    Array.from(stats.files.entries()).forEach(([file, matches]) => {
      const relPath = path.relative(process.cwd(), file);
      logger.info(`  ${relPath}`);
      const summary = matches.map((match) => `${match.line} (${match.category})`).join(', ');
      logger.info(`    Lines: ${summary}`);
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

function ensureKitiumImport(content: string): string {
  if (content.includes('@kitiumai/logger')) {
    return content;
  }
  const importStatement = "import { LoggerBuilder } from '@kitiumai/logger';\n";
  const lastImportIndex = content.lastIndexOf('import ');
  if (lastImportIndex !== -1) {
    const lineEnd = content.indexOf('\n', lastImportIndex);
    return content.slice(0, lineEnd + 1) + importStatement + content.slice(lineEnd + 1);
  }
  return importStatement + content;
}

function ensureLoggerInit(content: string): string {
  if (content.includes('const logger = LoggerBuilder')) {
    return content;
  }
  const importEnd = content.lastIndexOf('import ');
  if (importEnd !== -1) {
    const lineEnd = content.indexOf('\n', importEnd);
    const initStatement = "\nconst logger = LoggerBuilder.console('app');\n";
    return content.slice(0, lineEnd + 1) + initStatement + content.slice(lineEnd + 1);
  }
  return "const logger = LoggerBuilder.console('app');\n" + content;
}

function replaceLoggingStatements(content: string): string {
  content = ensureKitiumImport(content);
  content = ensureLoggerInit(content);

  content = content.replace(/console\.log\(/g, 'logger.info(');
  content = content.replace(/console\.error\(/g, 'logger.error(');
  content = content.replace(/console\.warn\(/g, 'logger.warn(');
  content = content.replace(/console\.info\(/g, 'logger.info(');
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
    'Enter the project directory to scan (default: current directory): '
  );
  const dir = targetDir.trim() || process.cwd();

  if (!fs.existsSync(dir)) {
    logger.error(`❌ Directory not found: ${dir}`);
    process.exit(1);
  }

  const ignoreInput = await question(
    'Enter comma-separated globs to ignore (default: node_modules,dist,build,.git): '
  );
  const ignoreGlobs = ignoreInput
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  const defaultIgnore = ['node_modules', 'dist', 'build', '.git'];
  const combinedIgnore = ignoreGlobs.length ? defaultIgnore.concat(ignoreGlobs) : defaultIgnore;

  logger.info(`\n📂 Scanning directory: ${dir}\n`);
  logger.info('Scanning files...');

  await scanDirectory(dir, combinedIgnore);

  printMigrationReport();
  printMigrationGuide();

  // Ask if user wants to perform migration
  const shouldMigrate = await question(
    '\nWould you like to automatically migrate the files? (yes/no): '
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
