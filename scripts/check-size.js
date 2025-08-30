#!/usr/bin/env node
/**
 * Package Size Monitoring Script
 * 
 * Checks if package size exceeds recommended limits
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Size limits (in bytes)
const LIMITS = {
  src: 500 * 1024,      // 500 KB
  bin: 100 * 1024,      // 100 KB  
  tests: 1000 * 1024,   // 1 MB
  templates: 50 * 1024, // 50 KB
  total: 2 * 1024 * 1024 // 2 MB total
};

async function checkPackageSize() {
  console.log(chalk.blue('🔍 Package Size Monitor\n'));

  try {
    const sizes = await calculateSizes();
    const totalSize = Object.values(sizes).reduce((sum, size) => sum + size, 0);
    
    console.log(chalk.cyan('📊 Size Report'));
    console.log('─'.repeat(40));
    
    let hasWarnings = false;
    
    // Check individual directories
    Object.entries(sizes).forEach(([dir, size]) => {
      const limit = LIMITS[dir];
      const sizeKB = (size / 1024).toFixed(1);
      const limitKB = (limit / 1024).toFixed(0);
      const percentage = ((size / limit) * 100).toFixed(1);
      
      let status = '✅';
      let color = 'green';
      
      if (size > limit) {
        status = '❌';
        color = 'red';
        hasWarnings = true;
      } else if (size > limit * 0.8) {
        status = '⚠️';
        color = 'yellow';
        hasWarnings = true;
      }
      
      console.log(
        `\${status} \${dir.padEnd(12)} \${chalk[color](sizeKB + ' KB')} / \${limitKB} KB (\${percentage}%)`
      );
    });
    
    // Check total size
    const totalKB = (totalSize / 1024).toFixed(1);
    const totalLimitKB = (LIMITS.total / 1024).toFixed(0);
    const totalPercentage = ((totalSize / LIMITS.total) * 100).toFixed(1);
    
    console.log('─'.repeat(40));
    
    let totalStatus = '✅';
    let totalColor = 'green';
    
    if (totalSize > LIMITS.total) {
      totalStatus = '❌';
      totalColor = 'red';
      hasWarnings = true;
    } else if (totalSize > LIMITS.total * 0.8) {
      totalStatus = '⚠️';
      totalColor = 'yellow';
      hasWarnings = true;
    }
    
    console.log(
      `\${totalStatus} Total Size    \${chalk[totalColor](totalKB + ' KB')} / \${totalLimitKB} KB (\${totalPercentage}%)`
    );
    
    console.log();
    
    if (hasWarnings) {
      console.log(chalk.yellow('⚠️  Size Warnings Detected'));
      console.log();
      console.log(chalk.cyan('Recommended Actions:'));
      console.log('• Split large files into smaller modules');
      console.log('• Remove unused code and dependencies');
      console.log('• Use dynamic imports for optional features');
      console.log('• Compress large static content');
      console.log();
      
      // Exit with warning code
      process.exit(1);
    } else {
      console.log(chalk.green('✅ All size checks passed!'));
      console.log(chalk.gray('Package size is within recommended limits.'));
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Size check failed:'), error.message);
    process.exit(1);
  }
}

async function calculateSizes() {
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
    return 0;
  }
  
  return totalSize;
}

// Run the size check
if (import.meta.url === `file://\${process.argv[1]}`) {
  checkPackageSize().catch(console.error);
}