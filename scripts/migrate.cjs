#!/usr/bin/env node
/* eslint-disable no-unused-vars */
/**
 * Migration Script for Kitium Logger
 * Helps migrate existing projects from other loggers to @kitium-ai/centralized-logger
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { LoggerBuilder } = require('../dist/index.js');

const logger = LoggerBuilder.console('migrate');

const stats = {
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

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

function scanFile(filePath) {
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

function addFileMatch(filePath, lineNumber) {
  if (!stats.files.has(filePath)) {
    stats.files.set(filePath, []);
  }
  stats.files.get(filePath).push(lineNumber);
}

function scanDirectory(dir, exclude = ['node_modules', '.git', 'dist', 'build']) {
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

function printMigrationReport() {
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

function printMigrationGuide() {
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

async function main() {
  logger.info('\n🚀 Kitium Logger Migration Tool\n');

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

  rl.close();
}

// Run the migration tool
main().catch((error) => {
  logger.error('Error:', error);
  process.exit(1);
});
