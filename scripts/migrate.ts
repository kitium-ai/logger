#!/usr/bin/env node
/**
 * Migration Script for Kitium Logger
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
  custom: number;
  files: Map<string, number[]>;
}

const stats: MigrationStats = {
  console_log: 0,
  winston: 0,
  bunyan: 0,
  pino: 0,
  debug: 0,
  custom: 0,
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
  } catch (error) {
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
  } catch (error) {
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

  console.log('3️⃣  Migration examples:\n');

  console.log('   ❌ Before (console.log):');
  console.log('   ┌─────────────────────────────────────────────────────────┐');
  console.log('   │ console.log("User logged in", userId);                  │');
  console.log('   │ console.error("Database error", err);                   │');
  console.log('   └─────────────────────────────────────────────────────────┘\n');

  console.log('   ✅ After (kitium logger):');
  console.log('   ┌─────────────────────────────────────────────────────────┐');
  console.log('   │ logger.info("User logged in", { userId });              │');
  console.log('   │ logger.error("Database error", {}, err);                │');
  console.log('   └─────────────────────────────────────────────────────────┘\n');

  console.log('   ❌ Before (Winston):');
  console.log('   ┌─────────────────────────────────────────────────────────┐');
  console.log('   │ logger.info("Request handled", {                        │');
  console.log('   │   method: req.method,                                   │');
  console.log('   │   path: req.path,                                       │');
  console.log('   │ });                                                      │');
  console.log('   └─────────────────────────────────────────────────────────┘\n');

  console.log('   ✅ After (kitium logger):');
  console.log('   ┌─────────────────────────────────────────────────────────┐');
  console.log('   │ logger.info("Request handled", {                        │');
  console.log('   │   method: req.method,                                   │');
  console.log('   │   path: req.path,                                       │');
  console.log('   │ });                                                      │');
  console.log('   └─────────────────────────────────────────────────────────┘\n');

  console.log('4️⃣  Available logger types:\n');
  console.log('   • ConsoleLogger  - Simple console output (development)');
  console.log('   • FileLogger     - File-based with rotation (production)');
  console.log('   • InMemoryLogger - In-memory storage (testing)');
  console.log('   • CentralLogger  - Cloud-native with Loki (cloud)\n');

  console.log('5️⃣  Express.js middleware integration:\n');
  console.log('   ┌─────────────────────────────────────────────────────────┐');
  console.log('   │ import {                                                 │');
  console.log('   │   tracingMiddleware,                                     │');
  console.log('   │   errorLoggingMiddleware,                               │');
  console.log('   │   bodyLoggingMiddleware,                                │');
  console.log('   │   performanceMetricsMiddleware,                         │');
  console.log('   │ } from "@kitium-ai/centralized-logger";                 │');
  console.log('   │                                                           │');
  console.log('   │ app.use(tracingMiddleware());                            │');
  console.log('   │ app.use(bodyLoggingMiddleware());                        │');
  console.log('   │ app.use(performanceMetricsMiddleware());                │');
  console.log('   │ app.use(errorLoggingMiddleware());                       │');
  console.log('   └─────────────────────────────────────────────────────────┘\n');

  console.log('6️⃣  Log levels available:');
  console.log('   • logger.error(message, metadata, error)');
  console.log('   • logger.warn(message, metadata)');
  console.log('   • logger.info(message, metadata)');
  console.log('   • logger.http(message, metadata)');
  console.log('   • logger.debug(message, metadata)\n');

  console.log('📖 For more examples, see:');
  console.log('   https://github.com/kitium-ai/logger/src/examples/\n');
}

async function main(): Promise<void> {
  console.log('\n🚀 Kitium Logger Migration Tool\n');

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

  const generateScript = await question(
    '\n🤖 Would you like me to generate a migration script? (yes/no): '
  );

  if (generateScript.toLowerCase() === 'yes' || generateScript.toLowerCase() === 'y') {
    await generateMigrationScript();
  }

  rl.close();
}

async function generateMigrationScript(): Promise<void> {
  const outputFile = await question(
    '\nEnter output file path (default: ./migrate-logger.ts): '
  );
  const filePath = outputFile.trim() || './migrate-logger.ts';

  const script = generateMigrationScriptContent();
  fs.writeFileSync(filePath, script);

  console.log(`\n✅ Migration script generated: ${filePath}`);
  console.log('\nNext steps:');
  console.log('  1. Review the generated script');
  console.log('  2. Run it in a version-controlled environment');
  console.log('  3. Test your application thoroughly');
  console.log('  4. Commit changes\n');
}

function generateMigrationScriptContent(): string {
  return `/**
 * Auto-generated Logger Migration Script
 *
 * This script helps migrate from various loggers to @kitium-ai/centralized-logger
 *
 * WARNING: Always test in a development environment first!
 */

import * as fs from 'fs';
import * as path from 'path';

interface FilePattern {
  from: RegExp;
  to: string;
}

const patterns: FilePattern[] = [
  // console.log -> logger.info
  {
    from: /console\\.log\\(([^)]+)\\)/g,
    to: 'logger.info($1)',
  },
  // console.error -> logger.error
  {
    from: /console\\.error\\(([^)]+)\\)/g,
    to: 'logger.error($1)',
  },
  // console.warn -> logger.warn
  {
    from: /console\\.warn\\(([^)]+)\\)/g,
    to: 'logger.warn($1)',
  },
  // console.debug -> logger.debug
  {
    from: /console\\.debug\\(([^)]+)\\)/g,
    to: 'logger.debug($1)',
  },
];

function migrateFile(filePath: string): boolean {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    patterns.forEach(({ from, to }) => {
      if (from.test(content)) {
        content = content.replace(from, to);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(\`✅ Migrated: \${filePath}\`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(\`❌ Error migrating \${filePath}:\`, error);
    return false;
  }
}

function migrateDirectory(
  dir: string,
  exclude: string[] = ['node_modules', '.git', 'dist', 'build', 'coverage']
): number {
  let count = 0;

  try {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      if (exclude.includes(file)) return;

      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        count += migrateDirectory(filePath, exclude);
      } else if (stat.isFile() && /\\.(js|ts|jsx|tsx)$/.test(filePath)) {
        if (migrateFile(filePath)) {
          count++;
        }
      }
    });
  } catch (error) {
    console.error(\`Error reading directory \${dir}:\`, error);
  }

  return count;
}

// Main execution
const projectDir = process.argv[2] || process.cwd();
console.log(\`📂 Migrating project in: \${projectDir}\\n\`);

const migratedCount = migrateDirectory(projectDir);

console.log(\`\\n✨ Migration complete! Migrated \${migratedCount} files.\\n\`);
console.log('⚠️  Important:');
console.log('  1. Add import for logger in files that were modified');
console.log('  2. Verify all log calls have correct parameters');
console.log('  3. Test your application thoroughly');
console.log('  4. Update error handling if needed\\n');
`;
}

// Run the migration tool
main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
