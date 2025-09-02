#!/usr/bin/env node

/**
 * CodeFortify JSDoc Auto-Generator
 *
 * Systematically adds JSDoc documentation to improve maintainability
 * Following DEVELOPMENT_GUIDELINES.md mission-critical priorities
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { glob } = require('glob');

console.log('📚 CodeFortify JSDoc Auto-Generator');
console.log('===================================');

const stats = {
  filesProcessed: 0,
  classesDocumented: 0,
  methodsDocumented: 0,
  functionsDocumented: 0
};

/**
 * Extract function/method signature and generate JSDoc
 */
function generateJSDoc(signature, isMethod = false) {
  const params = extractParameters(signature);
  const returnType = inferReturnType(signature);

  let jsdoc = '  /**\n';

  // Add description based on function name
  const functionName = extractFunctionName(signature);
  const description = generateDescription(functionName, isMethod);
  jsdoc += `   * ${description}\n`;

  // Add parameters
  params.forEach(param => {
    const type = inferParameterType(param);
    jsdoc += `   * @param {${type}} ${param.name}${param.optional ? ' - Optional parameter' : ''}\n`;
  });

  // Add return type
  if (returnType) {
    jsdoc += `   * @returns {${returnType}} ${generateReturnDescription(functionName, returnType)}\n`;
  }

  jsdoc += '   */\n';
  return jsdoc;
}

function extractParameters(signature) {
  const params = [];
  const match = signature.match(/\(([^)]*)\)/);
  if (!match) {return params;}

  const paramString = match[1].trim();
  if (!paramString) {return params;}

  const paramParts = paramString.split(',');
  paramParts.forEach(param => {
    const trimmed = param.trim();
    if (trimmed) {
      const optional = trimmed.includes('=');
      const name = trimmed.split('=')[0].trim();
      params.push({ name, optional });
    }
  });

  return params;
}

function extractFunctionName(signature) {
  const match = signature.match(/(?:function\s+|async\s+|static\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)/);
  return match ? match[1] : 'function';
}

function generateDescription(functionName, isMethod) {
  // Common patterns for description generation
  const patterns = {
    'constructor': 'Creates a new instance',
    'init': 'Initialize the component',
    'create': 'Creates a new resource',
    'get': 'Retrieves data',
    'set': 'Sets configuration',
    'add': 'Adds an item',
    'remove': 'Removes an item',
    'delete': 'Deletes a resource',
    'update': 'Updates existing data',
    'validate': 'Validates input data',
    'analyze': 'Analyzes the provided data',
    'process': 'Processes the input',
    'execute': 'Executes the operation',
    'run': 'Runs the specified task',
    'load': 'Loads data from source',
    'save': 'Saves data to storage',
    'read': 'Reads data from file',
    'write': 'Writes data to file',
    'parse': 'Parses the input data',
    'format': 'Formats the data',
    'calculate': 'Calculates the result',
    'generate': 'Generates new data',
    'handle': 'Handles the specified event',
    'check': 'Checks the condition',
    'test': 'Tests the functionality'
  };

  for (const [pattern, description] of Object.entries(patterns)) {
    if (functionName.toLowerCase().includes(pattern)) {
      return description;
    }
  }

  return isMethod ? 'Performs the specified operation' : 'Function implementation';
}

function inferParameterType(param) {
  const name = param.name.toLowerCase();

  if (name.includes('config') || name.includes('options')) {return 'Object';}
  if (name.includes('callback') || name.includes('fn')) {return 'Function';}
  if (name.includes('path') || name.includes('url')) {return 'string';}
  if (name.includes('count') || name.includes('index') || name.includes('id')) {return 'number';}
  if (name.includes('is') || name.includes('has') || name.includes('should')) {return 'boolean';}
  if (name.includes('array') || name.includes('list') || name.includes('items')) {return 'Array';}

  return 'any';
}

function inferReturnType(signature) {
  if (signature.includes('async ') || signature.includes('Promise')) {return 'Promise';}
  if (signature.includes('constructor')) {return null;}
  if (signature.includes('boolean') || signature.includes('check') || signature.includes('is')) {return 'boolean';}
  if (signature.includes('string') || signature.includes('get') || signature.includes('read')) {return 'string';}
  if (signature.includes('number') || signature.includes('count') || signature.includes('calculate')) {return 'number';}
  if (signature.includes('array') || signature.includes('Array')) {return 'Array';}

  return 'any';
}

function generateReturnDescription(functionName, returnType) {
  if (returnType === 'Promise') {return 'Promise that resolves with the result';}
  if (returnType === 'boolean') {return 'True if successful, false otherwise';}
  if (functionName.includes('get') || functionName.includes('read')) {return 'The retrieved data';}
  if (functionName.includes('create') || functionName.includes('generate')) {return 'The created resource';}
  if (functionName.includes('calculate')) {return 'The calculated result';}

  return 'The operation result';
}

async function addJSDocToFile(filePath) {
  try {
    let content = await fs.promises.readFile(filePath, 'utf8');
    let modified = false;

    // Find classes without JSDoc
    const classPattern = /^(\s*)(export\s+)?(class\s+[a-zA-Z_$][a-zA-Z0-9_$]*.*?\{)/gm;
    content = content.replace(classPattern, (match, spaces, exportKeyword, classDecl) => {
      // Check if already has JSDoc
      const beforeMatch = content.substring(0, content.indexOf(match));
      const lines = beforeMatch.split('\n');
      const prevLine = lines[lines.length - 1] || '';

      if (!prevLine.trim().endsWith('*/')) {
        stats.classesDocumented++;
        modified = true;
        const className = classDecl.match(/class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/)[1];
        const jsdoc = `${spaces}/**\n${spaces} * ${className} class implementation\n${spaces} * \n${spaces} * Provides functionality for ${className.toLowerCase()} operations\n${spaces} */\n`;
        return jsdoc + match;
      }
      return match;
    });

    // Find methods and functions without JSDoc
    const methodPattern = /^(\s*)(async\s+|static\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{/gm;
    content = content.replace(methodPattern, (match, spaces, modifiers, methodName) => {
      // Skip constructors and common utility functions
      if (methodName === 'constructor' || methodName.startsWith('_')) {return match;}

      // Check if already has JSDoc
      const beforeMatch = content.substring(0, content.indexOf(match));
      const lines = beforeMatch.split('\n');
      const prevLine = lines[lines.length - 1] || '';

      if (!prevLine.trim().endsWith('*/')) {
        const signature = match;
        const jsdoc = generateJSDoc(signature, true);

        if (methodName === 'constructor') {
          stats.classesDocumented++;
        } else {
          stats.methodsDocumented++;
        }

        modified = true;
        return jsdoc + match;
      }
      return match;
    });

    // Find exported functions without JSDoc
    const functionPattern = /^(\s*)(export\s+)?(async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{/gm;
    content = content.replace(functionPattern, (match, _spaces, _exportKeyword, _asyncKeyword, _functionName) => {
      // Check if already has JSDoc
      const beforeMatch = content.substring(0, content.indexOf(match));
      const lines = beforeMatch.split('\n');
      const prevLine = lines[lines.length - 1] || '';

      if (!prevLine.trim().endsWith('*/')) {
        const signature = match;
        const jsdoc = generateJSDoc(signature, false);

        stats.functionsDocumented++;
        modified = true;
        return jsdoc + match;
      }
      return match;
    });

    if (modified) {
      await fs.promises.writeFile(filePath, content);
      console.log(`✅ Added JSDoc to: ${path.relative(process.cwd(), filePath)}`);
      stats.filesProcessed++;
    }

    return modified;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  try {
    const jsFiles = await new Promise((resolve, reject) => {
      glob('src/**/*.js', (err, files) => err ? reject(err) : resolve(files));
    });

    console.log(`\n📁 Found ${jsFiles.length} JavaScript files to process`);

    for (const file of jsFiles) {
      await addJSDocToFile(file);
    }

    console.log('\n📊 JSDoc Generation Summary:');
    console.log(`   Files processed: ${stats.filesProcessed}/${jsFiles.length}`);
    console.log(`   Classes documented: ${stats.classesDocumented}`);
    console.log(`   Methods documented: ${stats.methodsDocumented}`);
    console.log(`   Functions documented: ${stats.functionsDocumented}`);
    console.log(`   Total documentation added: ${stats.classesDocumented + stats.methodsDocumented + stats.functionsDocumented}`);

  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

main();