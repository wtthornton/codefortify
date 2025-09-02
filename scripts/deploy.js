#!/usr/bin/env node

/**
 * CodeFortify Deployment Script
 * Handles deployment to npm and GitHub Packages
 */

import { execSync } from 'child_process';
import fs from 'fs';

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const version = packageJson.version;

console.log(`🚀 Deploying CodeFortify v${version}`);

try {
  // Pre-deployment checks
  console.log('📋 Running pre-deployment checks...');

  // Run tests
  console.log('🧪 Running tests...');
  execSync('npm run test', { stdio: 'inherit' });

  // Run quality checks
  console.log('🔍 Running quality checks...');
  execSync('npm run score', { stdio: 'inherit' });

  // Validate CodeFortify compliance
  console.log('✅ Validating CodeFortify compliance...');
  execSync('npm run validate', { stdio: 'inherit' });

  // Security audit
  console.log('🔒 Running security audit...');
  execSync('npm audit --audit-level=moderate', { stdio: 'inherit' });

  // Generate documentation
  console.log('📚 Generating documentation...');
  execSync('npm run score:detailed --format html --output final-report.html', { stdio: 'inherit' });

  console.log('✅ All pre-deployment checks passed!');
  console.log('🎯 Ready for deployment to npm registry');
  console.log('');
  console.log('To complete deployment:');
  console.log('1. Ensure you are logged into npm: npm login');
  console.log('2. Run: npm publish');
  console.log('3. Create GitHub release: gh release create v' + version);

} catch (error) {
  console.error('❌ Deployment checks failed:', error.message);
  process.exit(1);
}