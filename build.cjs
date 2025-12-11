#!/usr/bin/env node
/**
 * Build script that compiles TypeScript and copies scripts folder
 * Uses @kitiumai/scripts utilities for better error handling and logging
 */

const path = require('path');
const { promises: fsPromises } = require('fs');

const distDir = path.join(__dirname, 'dist');
const scriptsDir = path.join(__dirname, 'scripts');
const distScriptsDir = path.join(distDir, 'scripts');

async function compileTypeScript() {
  const { exec, log } = await import('@kitiumai/scripts/utils');

  log('info', '📦 Compiling TypeScript (ESM)...');
  await exec('tsc', ['-p', 'tsconfig.esm.json'], { verbose: true, throwOnError: true });

  log('info', '📦 Compiling TypeScript (CJS)...');
  await exec('tsc', ['-p', 'tsconfig.cjs.json'], { verbose: true, throwOnError: true });
}

async function rewriteEsmImports() {
  const { log } = await import('@kitiumai/scripts/utils');
  log('info', '🔧 Rewriting ESM imports...');

  const { readdir, readFile, writeFile, stat } = await import('fs/promises');
  const path = await import('path');

  const esmDir = path.join(__dirname, 'dist', 'esm');

  async function processDirectory(dirPath) {
    const entries = await readdir(dirPath, { withFileTypes: true });

    await Promise.all(
      entries.map(async (entry) => {
        const entryPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          await processDirectory(entryPath);
          return;
        }

        if (entry.isFile() && entry.name.endsWith('.js')) {
          console.log(`Processing file: ${entryPath}`);
          const content = await readFile(entryPath, 'utf8');
          console.log(`Content length: ${content.length}, first 200 chars: ${content.substring(0, 200)}`);
          let updatedContent = content;

          // Find all import and export from statements and update them
          const importRegex = /(?:import|export\s+.*?\s+from)\s+['"](\.\/[^'"]*?)['"]/g;
          let match;
          let matchCount = 0;
          while ((match = importRegex.exec(content)) !== null) {
            matchCount++;
            console.log(`Found match ${matchCount}: ${match[0]}, path: ${match[1]}`);
            const importPath = match[1];

            // Skip if it already ends with .js
            if (importPath.endsWith('.js')) {
              continue;
            }

            // Check if this points to a directory with index.js
            const fullPath = path.join(dirPath, importPath);
            try {
              const stats = await stat(fullPath);
              if (stats.isDirectory()) {
                const indexPath = path.join(fullPath, 'index.js');
                const indexStats = await stat(indexPath);
                if (indexStats.isFile()) {
                  updatedContent = updatedContent.replace(
                    `from '${importPath}'`,
                    `from '${importPath}/index.js'`
                  );
                  continue;
                }
              }
            } catch {
              // Not a directory or doesn't exist
            }

            // If it's not a directory, add .js extension
            updatedContent = updatedContent.replace(
              `from '${importPath}'`,
              `from '${importPath}.js'`
            );
          }

          console.log(`Found ${matchCount} matches in ${entryPath}`);

          if (updatedContent !== content) {
            console.log(`Updated content for ${entryPath}`);
            await writeFile(entryPath, updatedContent, 'utf8');
          }
        }
      })
    );
  }

  await processDirectory(esmDir);
  log('info', '  ✓ Rewrote ESM imports');
}

async function copyScripts() {
  const { log, pathExists } = await import('@kitiumai/scripts/utils');
  log('info', '📋 Copying scripts folder...');

  if (!(await pathExists(distScriptsDir))) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    await fsPromises.mkdir(distScriptsDir, { recursive: true });
  }

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const files = await fsPromises.readdir(scriptsDir);
  for (const file of files) {
    const src = path.join(scriptsDir, file);
    const dst = path.join(distScriptsDir, file);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const stat = await fsPromises.stat(src);

    if (stat.isFile()) {
      await fsPromises.copyFile(src, dst);
      log('info', `  ✓ Copied ${file}`);
    }
  }
}

async function createPackageJsonFiles() {
  const { log } = await import('@kitiumai/scripts/utils');
  log('info', '📝 Creating package.json files for module types...');

  // ESM package.json
  const esmPackageJson = JSON.stringify({ type: 'module' }, null, 2);
  const esmPath = path.join(distDir, 'esm', 'package.json');
  await fsPromises.writeFile(esmPath, esmPackageJson, 'utf-8');
  log('info', '  ✓ Created esm/package.json');

  // CJS package.json
  const cjsPackageJson = JSON.stringify({ type: 'commonjs' }, null, 2);
  const cjsPath = path.join(distDir, 'cjs', 'package.json');
  await fsPromises.writeFile(cjsPath, cjsPackageJson, 'utf-8');
  log('info', '  ✓ Created cjs/package.json');
}

async function build() {
  try {
    await compileTypeScript();
    await rewriteEsmImports();
    await createPackageJsonFiles();
    await copyScripts();
    const { log } = await import('@kitiumai/scripts/utils');
    log('success', '✅ Build complete!');
    log('info', '📊 Output:');
    log('info', '  - dist/esm/ (ES Modules - tree-shakable)');
    log('info', '  - dist/cjs/ (CommonJS - backward compatible)');
    log('info', '  - dist/types/ (TypeScript declarations)');
    process.exit(0);
  } catch (error) {
    if (error.code === 'ERR_REQUIRE_ESM' || error.message?.includes('Cannot use import')) {
      console.error('❌ Build failed:', error.message);
      console.error('Note: Using fallback logging. @kitiumai/scripts may not be available.');
    } else {
      console.error('❌ Build failed:', error.message);
    }
    process.exit(1);
  }
}

build();
