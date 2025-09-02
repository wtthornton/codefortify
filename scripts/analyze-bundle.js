#!/usr/bin/env node
/**
 * Bundle Analysis Script for Context7 MCP Package
 *
 * Analyzes package size, dependencies, and performance metrics
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

async function analyzeBundle() {
  console.log(chalk.blue('📊 Analyzing Context7 MCP Package Bundle\n'));

  try {
    // Read package.json
    const packageJson = JSON.parse(
      await fs.readFile(path.join(projectRoot, 'package.json'), 'utf-8')
    );

    // Analyze package size
    await analyzePackageSize();

    // Analyze dependencies
    await analyzeDependencies(packageJson);

    // Analyze source files
    await analyzeSourceFiles();

    // Performance recommendations
    await provideRecommendations();

  } catch (error) {
    console.error(chalk.red('❌ Bundle analysis failed:'), error.message);
    process.exit(1);
  }
}

async function analyzePackageSize() {
  console.log(chalk.cyan('📦 Package Size Analysis'));
  console.log('─'.repeat(40));

  const sizes = await calculateDirectorySizes();

  Object.entries(sizes).forEach(([dir, size]) => {
    const sizeKB = (size / 1024).toFixed(1);
    const color = size > 100000 ? 'red' : size > 50000 ? 'yellow' : 'green';
    console.log(`${dir.padEnd(20)} ${chalk[color](sizeKB + ' KB')}`);
  });

  console.log();
}

async function calculateDirectorySizes() {
  const sizes = {};
  const directories = ['src', 'bin', 'tests', 'templates'];

  for (const dir of directories) {
    const dirPath = path.join(projectRoot, dir);
    try {
      sizes[dir] = await getDirectorySize(dirPath);
    } catch (error) {
      sizes[dir] = 0;
    }
  }

  return sizes;
}

async function getDirectorySize(dirPath) {
  let totalSize = 0;

  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });

    for (const item of items) {
      const itemPath = path.join(dirPath, item.name);

      if (item.isDirectory()) {
        totalSize += await getDirectorySize(itemPath);
      } else {
        const stats = await fs.stat(itemPath);
        totalSize += stats.size;
      }
    }
  } catch (error) {
    // Directory doesn't exist or is inaccessible
    return 0;
  }

  return totalSize;
}

async function analyzeDependencies(packageJson) {
  console.log(chalk.cyan('📋 Dependency Analysis'));
  console.log('─'.repeat(40));

  const prodDeps = Object.keys(packageJson.dependencies || {});
  const _devDeps = Object.keys(packageJson.devDependencies || {});

  console.log('Production dependencies: ${chalk.green(prodDeps.length)}');
  console.log('Development dependencies: ${chalk.blue(_devDeps.length)}');
  console.log('Total dependencies: ${chalk.yellow(prodDeps.length + _devDeps.length)}');

  // Heavy dependencies check
  const heavyDeps = [
    '@modelcontextprotocol/sdk',
    'inquirer',
    'commander',
    'chalk',
    'ora'
  ];

  console.log();
  console.log(chalk.cyan('🏋️  Heavy Dependencies:'));
  prodDeps.forEach(dep => {
    if (heavyDeps.includes(dep)) {
      console.log('  ⚠️  ${dep} - Consider lazy loading');
    }
  });

  console.log();
}

async function analyzeSourceFiles() {
  console.log(chalk.cyan('📁 Source File Analysis'));
  console.log('─'.repeat(40));

  const srcPath = path.join(projectRoot, 'src');
  const fileStats = await getFileStatistics(srcPath);

  console.log('Total files: ${chalk.green(fileStats.totalFiles)}');
  console.log('Total lines: ${chalk.green(fileStats.totalLines.toLocaleString())}');
  console.log('Average file size: ${chalk.yellow((fileStats.totalLines / fileStats.totalFiles).toFixed(0))} lines');

  // Large files
  console.log();
  console.log(chalk.cyan('📄 Large Files (>500 lines):'));
  fileStats.largeFiles.forEach(file => {
    const _color = file.lines > 1000 ? 'red' : 'yellow';
    console.log('  ${chalk[_color](\'📄\')} ${file.name} (${file.lines} lines)');
  });

  console.log();
}

async function getFileStatistics(dirPath) {
  let totalFiles = 0;
  let totalLines = 0;
  const largeFiles = [];

  async function processDirectory(currentPath) {
    const items = await fs.readdir(currentPath, { withFileTypes: true });

    for (const item of items) {
      const itemPath = path.join(currentPath, item.name);

      if (item.isDirectory()) {
        await processDirectory(itemPath);
      } else if (item.name.endsWith('.js') || item.name.endsWith('.ts')) {
        totalFiles++;

        const content = await fs.readFile(itemPath, 'utf-8');
        const lines = content.split('\\n').length;
        totalLines += lines;

        if (lines > 500) {
          largeFiles.push({
            name: path.relative(dirPath, itemPath),
            lines
          });
        }
      }
    }
  }

  await processDirectory(dirPath);

  return {
    totalFiles,
    totalLines,
    largeFiles: largeFiles.sort((a, b) => b.lines - a.lines)
  };
}

async function provideRecommendations() {
  console.log(chalk.cyan('💡 Performance Recommendations'));
  console.log('─'.repeat(40));

  const recommendations = [
    '🔧 Use dynamic imports for CLI commands to reduce startup time',
    '📦 Consider splitting large analyzer files into smaller modules',
    '⚡ Implement lazy loading for scoring analyzers',
    '🗜️  Use compression for large pattern templates',
    '🚀 Add tree-shaking optimization for unused exports',
    '📊 Monitor bundle size in CI/CD pipeline'
  ];

  recommendations.forEach(_rec => console.log('  ${_rec}'));

  console.log();
  console.log(chalk.green('✅ Bundle analysis complete!'));
  console.log(chalk.gray('💡 Run `npm run size-check` for size monitoring'));
}

// Run the analysis
if (import.meta.url === 'file://${process.argv[1]}') {
  analyzeBundle().catch(console.error);
}