#!/usr/bin/env node
/**
 * Build script that compiles TypeScript and copies scripts folder
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const distDir = path.join(__dirname, 'dist');
const scriptsDir = path.join(__dirname, 'scripts');
const distScriptsDir = path.join(distDir, 'scripts');

try {
  // Run TypeScript compilation
  console.log('📦 Compiling TypeScript...');
  execSync('tsc', { stdio: 'inherit' });

  // Copy scripts folder to dist
  console.log('📋 Copying scripts folder...');

  // Create scripts directory in dist if it doesn't exist
  if (!fs.existsSync(distScriptsDir)) {
    fs.mkdirSync(distScriptsDir, { recursive: true });
  }

  // Copy all files from scripts to dist/scripts
  const files = fs.readdirSync(scriptsDir);
  files.forEach((file) => {
    const src = path.join(scriptsDir, file);
    const dst = path.join(distScriptsDir, file);
    const stat = fs.statSync(src);

    if (stat.isFile()) {
      fs.copyFileSync(src, dst);
      console.log(`  ✓ Copied ${file}`);
    }
  });

  console.log('✅ Build complete!');
  process.exit(0);
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
