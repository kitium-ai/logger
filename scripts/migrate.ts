/* eslint-disable no-console */
#!/usr/bin/env node
/**
 * Migration Script for Kitium Logger - TypeScript Version
 * Helps migrate existing projects from other loggers to @kitium-ai/centralized-logger
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

interface MigrationStats {
  console_log: number;
  winston: number;
  bunyan: number;
  pino: number;
  debug: number;
  files: Map<string, number[]>;
}

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

function scanDirectory(dir: string, exclude: string[] = ['node_modules', '.git', 'dist', 'build']): void {
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
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         Kitium Logger Migration Report                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('📊 Logger Usage Summary:');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`  console.log/error/warn/info/debug:  ${stats.console_log} occurrences`);
  console.log(`  Winston logger:                      ${stats.winston} occurrences`);
  console.log(`  Bunyan logger:                       ${stats.bunyan} occurrences`);
  console.log(`  Pino logger:                         ${stats.pino} occurrences`);
  console.log(`  Debug module:                        ${stats.debug} occurrences`);
  console.log('─────────────────────────────────────────────────────────────\n');

  const totalOccurrences = stats.console_log + stats.winston + stats.bunyan + stats.pino + stats.debug;
  console.log(`📈 Total logging statements found: ${totalOccurrences}\n`);

  if (stats.files.size > 0) {
    console.log('📁 Files that need migration:');
    console.log('─────────────────────────────────────────────────────────────');
    Array.from(stats.files.entries()).forEach(([file, lines]) => {
      const relPath = path.relative(process.cwd(), file);
      console.log(`  ${relPath}`);
      console.log(`    Lines: ${lines.join(', ')}`);
    });
    console.log('');
  }
}

function printMigrationGuide(): void {
  console.log('\n📚 Migration Guide');
  console.log('═════════════════════════════════════════════════════════════\n');

  console.log('1️⃣  Install the package:');
  console.log('   npm install @kitium-ai/centralized-logger\n');

  console.log('2️⃣  Basic setup in your app entry point:\n');
  console.log('   TypeScript:');
  console.log('   ┌─────────────────────────────────────────────────────────┐');
  console.log('   │ import { LoggerBuilder, LoggerType } from                │');
  console.log('   │   "@kitium-ai/centralized-logger";                      │');
  console.log('   │                                                           │');
  console.log('   │ const logger = LoggerBuilder.console("my-app");          │');
  console.log('   │ // or for file logging:                                 │');
  console.log('   │ const logger = LoggerBuilder.file("my-app", "./logs");  │');
  console.log('   │                                                           │');
  console.log('   │ // use it                                               │');
  console.log('   │ logger.info("App started", { version: "1.0.0" });       │');
  console.log('   └─────────────────────────────────────────────────────────┘\n');

  console.log('3️⃣  Available logger types:\n');
  console.log('   • ConsoleLogger  - Simple console output (development)');
  console.log('   • FileLogger     - File-based with rotation (production)');
  console.log('   • InMemoryLogger - In-memory storage (testing)');
  console.log('   • CentralLogger  - Cloud-native with Loki (cloud)\n');

  console.log('📖 For more examples and migration details, see:');
  console.log('   MIGRATION.md in the project root\n');
}

async function main(): Promise<void> {
  console.log('\n🚀 Kitium Logger Migration Tool (TypeScript)\n');

  const targetDir = await question('Enter the project directory to scan (default: current directory): ');
  const dir = targetDir.trim() || process.cwd();

  if (!fs.existsSync(dir)) {
    console.error(`❌ Directory not found: ${dir}`);
    process.exit(1);
  }

  console.log(`\n📂 Scanning directory: ${dir}\n`);
  console.log('Scanning files...');

  scanDirectory(dir);

  printMigrationReport();
  printMigrationGuide();

  rl.close();
}

// Run the migration tool
main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
