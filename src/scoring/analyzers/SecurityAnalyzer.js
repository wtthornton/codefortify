/**
 * SecurityAnalyzer - Analyzes security patterns and vulnerability handling
 * 
 * Evaluates:
 * - Dependency vulnerabilities and updates (6pts)
 * - Secret and credential management (4pts)
 * - Error handling and information exposure (3pts)
 * - Input validation patterns (2pts)
 * Total: 15pts
 */

import { BaseAnalyzer } from './BaseAnalyzer.js';

export class SecurityAnalyzer extends BaseAnalyzer {
  constructor(config) {
    super(config);
    this.categoryName = 'Security & Error Handling';
    this.description = 'Dependency security, secrets management, error handling, and input validation';
  }

  async runAnalysis() {
    this.results.score = 0;
    this.results.issues = [];
    this.results.suggestions = [];
    
    await this.analyzeDependencyVulnerabilities(); // 6pts
    await this.analyzeSecretsManagement(); // 4pts
    await this.analyzeErrorHandling(); // 3pts
    await this.analyzeInputValidation(); // 2pts
  }

  async analyzeDependencyVulnerabilities() {
    let score = 0;
    const maxScore = 6;
    
    const packageJson = await this.readPackageJson();
    if (!packageJson) {
      this.addIssue('No package.json found', 'Cannot analyze dependencies for vulnerabilities');
      return;
    }
    
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const depsCount = Object.keys(deps).length;
    
    if (depsCount === 0) {
      score += 3;
      this.addScore(3, 6, 'No external dependencies (no vulnerability risk)');
      return;
    }
    
    // Check for security-related packages
    const securityPackages = [
      'helmet', 'cors', 'express-rate-limit', 'bcrypt', 'bcryptjs',
      'jsonwebtoken', 'passport', 'express-validator', 'sanitize-html',
      'dompurify', 'xss', 'csrf'
    ];
    
    const hasSecurityPackages = securityPackages.some(pkg => deps[pkg]);
    if (hasSecurityPackages) {
      score += 2;
      this.addScore(2, 2, 'Security-focused packages detected');
    }
    
    // Check for known problematic packages or patterns
    const problematicPackages = [
      'eval', 'vm2', 'serialize-javascript', 'node-serialize',
      'safer-eval'
    ];
    
    const hasProblematicPackages = problematicPackages.some(pkg => deps[pkg]);
    if (hasProblematicPackages) {
      this.addIssue('Potentially unsafe packages detected', 'Review usage of eval-like packages');
    } else {
      score += 1;
      this.addScore(1, 1, 'No obviously unsafe packages detected');
    }
    
    // Check for outdated package indicators
    const hasPackageLock = await this.fileExists('package-lock.json') || 
                          await this.fileExists('yarn.lock') ||
                          await this.fileExists('pnpm-lock.yaml');
    
    if (hasPackageLock) {
      score += 1;
      this.addScore(1, 1, 'Lock file present (prevents dependency confusion)');
    } else {
      this.addIssue('No lock file found', 'Add package-lock.json to prevent dependency confusion attacks');
    }
    
    // Check for audit script
    if (packageJson.scripts && packageJson.scripts.audit) {
      score += 1;
      this.addScore(1, 1, 'Audit script configured');
    } else {
      this.addIssue('No audit script in package.json', 'Add "audit": "npm audit" script for vulnerability checking');
    }
    
    // Check dependency count (fewer is generally more secure)
    if (depsCount < 20) {
      score += 1;
      this.addScore(1, 1, `Reasonable dependency count (${depsCount})`);
    } else if (depsCount > 100) {
      this.addIssue('High dependency count', 'Large dependency trees increase attack surface');
    }
    
    this.setDetail('dependencyCount', depsCount);
    this.setDetail('hasSecurityPackages', hasSecurityPackages);
    this.setDetail('hasLockFile', hasPackageLock);
  }

  async analyzeSecretsManagement() {
    let score = 0;
    const maxScore = 4;
    
    const files = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx', '.json', '.env']);
    let secretsFound = 0;
    let envUsage = 0;
    let hardcodedSecrets = 0;
    
    // Check for .env file and .gitignore
    const hasEnvFile = await this.fileExists('.env') || await this.fileExists('.env.example');
    const hasGitignore = await this.fileExists('.gitignore');
    
    if (hasEnvFile) {
      score += 1;
      this.addScore(1, 1, 'Environment file detected');
    }
    
    if (hasGitignore) {
      try {
        const gitignoreContent = await this.readFile('.gitignore');
        if (gitignoreContent.includes('.env') || gitignoreContent.includes('*.env')) {
          score += 1;
          this.addScore(1, 1, 'Environment files ignored in git');
        } else if (hasEnvFile) {
          this.addIssue('.env file not in .gitignore', 'Add .env to .gitignore to prevent secret exposure');
        }
      } catch (error) {
        // Skip if can't read .gitignore
      }
    }
    
    for (const file of files.slice(0, 30)) { // Sample files
      try {
        const content = await this.readFile(file);
        
        // Look for environment variable usage (good practice)
        const envMatches = content.match(/process\.env\./g);
        if (envMatches) {
          envUsage += envMatches.length;
        }
        
        // Look for potential hardcoded secrets (bad practice)
        const secretPatterns = [
          /api[_-]?key['"]\s*[:=]\s*['"]\w{20,}/i,
          /secret['"]\s*[:=]\s*['"]\w{20,}/i,
          /token['"]\s*[:=]\s*['"]\w{20,}/i,
          /password['"]\s*[:=]\s*['"]\w{8,}/i,
          /private[_-]?key/i,
          /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/,
          /['"]\w*[Aa][Pp][Ii][Kk][Ee][Yy]\w*['"]\s*[:=]\s*['"]\w{20,}/,
          /[0-9a-f]{32,}/g // Long hex strings that might be keys
        ];
        
        for (const pattern of secretPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            hardcodedSecrets += matches.length;
          }
        }
        
      } catch (error) {
        // Skip files that can't be read
      }
    }
    
    // Score based on environment variable usage vs hardcoded secrets
    if (envUsage > 0 && hardcodedSecrets === 0) {
      score += 2;
      this.addScore(2, 2, `Good secrets management (${envUsage} env vars, no hardcoded secrets)`);
    } else if (envUsage > 0 && hardcodedSecrets > 0) {
      score += 1;
      this.addScore(1, 2, 'Mixed secrets management approach');
      this.addIssue('Potential hardcoded secrets detected', 'Move secrets to environment variables');
    } else if (hardcodedSecrets > 0) {
      this.addIssue('Hardcoded secrets detected', 'Never commit secrets to code - use environment variables');
    } else if (envUsage === 0) {
      // No environment usage might be fine for simple projects
      score += 1;
      this.addScore(1, 2, 'No obvious secrets management (might be appropriate for this project)');
    }
    
    this.setDetail('envUsage', envUsage);
    this.setDetail('hardcodedSecrets', hardcodedSecrets);
    this.setDetail('hasEnvFile', hasEnvFile);
  }

  async analyzeErrorHandling() {
    let score = 0;
    const maxScore = 3;
    
    const files = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx']);
    let tryCatchBlocks = 0;
    let errorHandlers = 0;
    let errorExposureRisk = 0;
    
    for (const file of files.slice(0, 20)) { // Sample files
      try {
        const content = await this.readFile(file);
        
        // Count try-catch blocks
        const tryCatchMatches = content.match(/try\s*{[\s\S]*?catch\s*\(/g);
        if (tryCatchMatches) {
          tryCatchBlocks += tryCatchMatches.length;
        }
        
        // Count error handling patterns
        if (content.includes('error') || content.includes('Error') || 
            content.includes('.catch(') || content.includes('throw ')) {
          errorHandlers++;
        }
        
        // Check for potential information exposure
        if (content.includes('console.error') || content.includes('console.log') ||
            content.includes('alert(') || content.includes('JSON.stringify(error)')) {
          errorExposureRisk++;
        }
        
      } catch (error) {
        // Skip files that can't be read
      }
    }
    
    // Score for try-catch usage
    if (tryCatchBlocks > 0) {
      const catchScore = Math.min(tryCatchBlocks / 5, 2); // Up to 2 points
      score += catchScore;
      this.addScore(catchScore, 2, `Error handling blocks found (${tryCatchBlocks})`);
    } else if (files.length > 5) {
      this.addIssue('Limited error handling detected', 'Add try-catch blocks for error-prone operations');
    }
    
    // Score for general error handling awareness
    if (errorHandlers > 0) {
      score += 1;
      this.addScore(1, 1, `Error handling patterns detected (${errorHandlers} files)`);
    } else {
      this.addIssue('No error handling patterns found', 'Implement proper error handling and validation');
    }
    
    // Deduct for potential information exposure
    if (errorExposureRisk > 3) {
      this.addIssue('Potential error information exposure', 'Avoid logging sensitive error details to console');
    }
    
    this.setDetail('tryCatchBlocks', tryCatchBlocks);
    this.setDetail('errorHandlers', errorHandlers);
    this.setDetail('errorExposureRisk', errorExposureRisk);
  }

  async analyzeInputValidation() {
    let score = 0;
    const maxScore = 2;
    
    const files = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx']);
    let validationPatterns = 0;
    let sanitizationUsage = 0;
    
    const validationLibraries = [
      'joi', 'yup', 'express-validator', 'ajv', 'zod',
      'class-validator', 'validator', 'sanitize-html'
    ];
    
    // Check for validation libraries in package.json
    const packageJson = await this.readPackageJson();
    if (packageJson) {
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      const hasValidationLib = validationLibraries.some(lib => deps[lib]);
      
      if (hasValidationLib) {
        score += 1;
        this.addScore(1, 1, 'Input validation library detected');
      }
    }
    
    for (const file of files.slice(0, 15)) { // Sample files
      try {
        const content = await this.readFile(file);
        
        // Look for validation patterns
        const validationKeywords = [
          'validate', 'sanitize', 'escape', 'filter', 'trim',
          'typeof', 'instanceof', 'isArray', 'isString', 'isNumber'
        ];
        
        for (const keyword of validationKeywords) {
          if (content.includes(keyword)) {
            validationPatterns++;
            break; // Count each file only once
          }
        }
        
        // Look for sanitization usage
        if (content.includes('sanitize') || content.includes('escape') || 
            content.includes('xss') || content.includes('DOMPurify')) {
          sanitizationUsage++;
        }
        
      } catch (error) {
        // Skip files that can't be read
      }
    }
    
    // Score for validation patterns
    if (validationPatterns > 0) {
      const validationScore = Math.min(validationPatterns / 5, 1); // Up to 1 point
      score += validationScore;
      this.addScore(validationScore, 1, `Input validation patterns found (${validationPatterns} files)`);
    } else if (files.length > 5) {
      this.addIssue('No input validation patterns detected', 'Add input validation for user data');
    }
    
    this.setDetail('validationPatterns', validationPatterns);
    this.setDetail('sanitizationUsage', sanitizationUsage);
  }
}