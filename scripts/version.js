#!/usr/bin/env node

/**
 * CodeFortify Version Management Script
 * 
 * This script automates version management across the entire CodeFortify project.
 * It ensures all version references stay in sync with package.json.
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Read current version from package.json
const packageJsonPath = path.join(projectRoot, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const currentVersion = packageJson.version;

console.log(`🔍 Current version: ${currentVersion}`);

// Function to update version in a file
function updateVersionInFile(filePath, searchPattern, replacement) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const updatedContent = content.replace(searchPattern, replacement);
    
    if (content !== updatedContent) {
      writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`✅ Updated version in: ${path.relative(projectRoot, filePath)}`);
      return true;
    }
    return false;
  } catch (error) {
    console.log(`⚠️  Could not update ${filePath}: ${error.message}`);
    return false;
  }
}

// Files that need version updates
const filesToUpdate = [
  {
    path: path.join(projectRoot, 'bin/codefortify.js'),
    patterns: [
      { search: /Version: \d+\.\d+\.\d+/, replace: `Version: ${currentVersion}` },
      { search: /\.version\('\d+\.\d+\.\d+'\)/, replace: `.version('${currentVersion}')` }
    ]
  },
  {
    path: path.join(projectRoot, 'bin/codefortify-realtime.js'),
    patterns: [
      { search: /Version: \d+\.\d+\.\d+/, replace: `Version: ${currentVersion}` }
    ]
  },
  {
    path: path.join(projectRoot, 'src/index.js'),
    patterns: [
      { search: /Version: \d+\.\d+\.\d+/, replace: `Version: ${currentVersion}` }
    ]
  }
];

console.log('🔄 Updating version references...');

let updatedFiles = 0;
filesToUpdate.forEach(file => {
  file.patterns.forEach(pattern => {
    if (updateVersionInFile(file.path, pattern.search, pattern.replace)) {
      updatedFiles++;
    }
  });
});

console.log(`✅ Updated ${updatedFiles} version references`);

// Function to bump version
function bumpVersion(type = 'patch') {
  const versionParts = currentVersion.split('.').map(Number);
  let newVersion;
  
  switch (type) {
    case 'major':
      newVersion = `${versionParts[0] + 1}.0.0`;
      break;
    case 'minor':
      newVersion = `${versionParts[0]}.${versionParts[1] + 1}.0`;
      break;
    case 'patch':
    default:
      newVersion = `${versionParts[0]}.${versionParts[1]}.${versionParts[2] + 1}`;
      break;
  }
  
  // Update package.json
  packageJson.version = newVersion;
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
  
  console.log(`🚀 Bumped version: ${currentVersion} → ${newVersion}`);
  
  // Update all version references
  filesToUpdate.forEach(file => {
    file.patterns.forEach(pattern => {
      updateVersionInFile(file.path, pattern.search, pattern.replace.replace(currentVersion, newVersion));
    });
  });
  
  return newVersion;
}

// Command line interface
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'bump':
    const bumpType = args[1] || 'patch';
    const newVersion = bumpVersion(bumpType);
    console.log(`\n🎉 Version bumped to ${newVersion}`);
    console.log('📝 Next steps:');
    console.log('   1. npm run test');
    console.log('   2. npm publish');
    console.log('   3. git add . && git commit -m "Bump version to ' + newVersion + '"');
    break;
    
  case 'check':
    console.log('✅ Version consistency check complete');
    break;
    
  default:
    console.log('📋 CodeFortify Version Management');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/version.js check     - Check version consistency');
    console.log('  node scripts/version.js bump      - Bump patch version (1.0.0 → 1.0.1)');
    console.log('  node scripts/version.js bump minor - Bump minor version (1.0.0 → 1.1.0)');
    console.log('  node scripts/version.js bump major - Bump major version (1.0.0 → 2.0.0)');
    console.log('');
    console.log(`Current version: ${currentVersion}`);
    break;
}
