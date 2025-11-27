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
