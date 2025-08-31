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
import { execSync } from 'child_process';

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
    let _score = 0;
    const _maxScore = 6;

    const packageJson = await this.readPackageJson();
    if (!packageJson) {
      this.addIssue('No package.json found', 'Cannot analyze dependencies for vulnerabilities');
      return;
    }

    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const depsCount = Object.keys(deps).length;

    if (depsCount === 0) {
      _score += 3;
      this.addScore(3, 6, 'No external dependencies (no vulnerability risk)');
      return;
    }

    // PHASE 1 UPGRADE: Use npm audit for real vulnerability scanning
    const auditResult = await this.runNpmAudit();
    if (auditResult.success) {
      const vulnData = auditResult.data;
      const totalVulns = vulnData.metadata?.vulnerabilities?.total || 0;
      const highVulns = vulnData.metadata?.vulnerabilities?.high || 0;
      const criticalVulns = vulnData.metadata?.vulnerabilities?.critical || 0;

      // Score based on actual vulnerability scan results
      if (totalVulns === 0) {
        _score += 4;
        this.addScore(4, 4, 'No vulnerabilities found in dependencies (npm audit)');
      } else if (criticalVulns === 0 && highVulns === 0) {
        _score += 3;
        this.addScore(3, 4, `Only low/moderate vulnerabilities found (${totalVulns} total)`);
      } else if (criticalVulns === 0) {
        _score += 2;
        this.addScore(2, 4, `High vulnerabilities found (${highVulns} high, ${totalVulns} total)`);
        this.addIssue(`${highVulns} high severity vulnerabilities`, 'Run npm audit fix to resolve security issues');
      } else {
        _score += 1;
        this.addScore(1, 4, `Critical vulnerabilities detected (${criticalVulns} critical, ${totalVulns} total)`);
        this.addIssue(`${criticalVulns} critical vulnerabilities`, 'Immediately run npm audit fix - critical security risk');
      }

      this.setDetail('npmAuditResult', {
        total: totalVulns,
        critical: criticalVulns,
        high: highVulns,
        moderate: vulnData.metadata?.vulnerabilities?.moderate || 0,
        low: vulnData.metadata?.vulnerabilities?.low || 0
      });
    } else {
      // Graceful degradation: Fallback to pattern matching with helpful guidance
      this.addScore(2, 4, 'npm audit unavailable - using pattern analysis (install npm for better accuracy)');
      this.addIssue('npm audit not available', 'For accurate vulnerability scanning, ensure npm is installed and project has package.json');
      await this.fallbackVulnerabilityAnalysis(deps, _score);
    }

    // Check for outdated package indicators (2pts remaining)
    const hasPackageLock = await this.fileExists('package-lock.json') ||
                          await this.fileExists('yarn.lock') ||
                          await this.fileExists('pnpm-lock.yaml');

    if (hasPackageLock) {
      _score += 1;
      this.addScore(1, 1, 'Lock file present (prevents dependency confusion)');
    } else {
      this.addIssue('No lock file found', 'Add package-lock.json to prevent dependency confusion attacks');
    }

    // Check for audit script
    if (packageJson.scripts && packageJson.scripts.audit) {
      _score += 1;
      this.addScore(1, 1, 'Audit script configured');
    } else {
      this.addIssue('No audit script in package.json', 'Add "audit": "npm audit" script for vulnerability checking');
    }

    this.setDetail('dependencyCount', depsCount);
    this.setDetail('hasLockFile', hasPackageLock);
  }

  /**
   * Run npm audit and parse results
   * @returns {Promise<{success: boolean, data: any}>}
   */
  async runNpmAudit() {
    try {
      // Run npm audit with JSON output
      const output = execSync('npm audit --json', {
        encoding: 'utf8',
        timeout: 30000, // 30 second timeout
        cwd: this.config.projectRoot || process.cwd()
      });

      const auditData = JSON.parse(output);
      return { success: true, data: auditData };
    } catch (error) {
      // npm audit returns non-zero exit code when vulnerabilities found
      if (error.stdout) {
        try {
          const auditData = JSON.parse(error.stdout);
          return { success: true, data: auditData };
        } catch (parseError) {
          return { success: false, error: 'Failed to parse npm audit output' };
        }
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Fallback vulnerability analysis using pattern matching
   * @param {Object} deps - Dependencies object
   * @param {number} currentScore - Current score
   */
  async fallbackVulnerabilityAnalysis(deps, _currentScore) {
    // Check for security-related packages
    const securityPackages = [
      'helmet', 'cors', 'express-rate-limit', 'bcrypt', 'bcryptjs',
      'jsonwebtoken', 'passport', 'express-validator', 'sanitize-html',
      'dompurify', 'xss', 'csrf'
    ];

    const hasSecurityPackages = securityPackages.some(pkg => deps[pkg]);
    if (hasSecurityPackages) {
      this.addScore(1, 1, 'Security-focused packages detected');
    }

    // Check for known problematic packages
    const problematicPackages = [
      'eval', 'vm2', 'serialize-javascript', 'node-serialize',
      'safer-eval'
    ];

    const hasProblematicPackages = problematicPackages.some(pkg => deps[pkg]);
    if (hasProblematicPackages) {
      this.addIssue('Potentially unsafe packages detected', 'Review usage of eval-like packages');
    } else {
      this.addScore(1, 1, 'No obviously unsafe packages detected');
    }
  }

  async analyzeSecretsManagement() {
    let _score = 0;
    const _maxScore = 4;

    const files = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx', '.json', '.env']);
    const _secretsFound = 0;
    let envUsage = 0;
    let hardcodedSecrets = 0;

    // Check for .env file and .gitignore
    const hasEnvFile = await this.fileExists('.env') || await this.fileExists('.env.example');
    const hasGitignore = await this.fileExists('.gitignore');

    if (hasEnvFile) {
      _score += 1;
      this.addScore(1, 1, 'Environment file detected');
    }

    if (hasGitignore) {
      try {
        const gitignoreContent = await this.readFile('.gitignore');
        if (gitignoreContent.includes('.env') || gitignoreContent.includes('*.env')) {
          _score += 1;
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
      _score += 2;
      this.addScore(2, 2, `Good secrets management (${envUsage} env vars, no hardcoded secrets)`);
    } else if (envUsage > 0 && hardcodedSecrets > 0) {
      _score += 1;
      this.addScore(1, 2, 'Mixed secrets management approach');
      this.addIssue('Potential hardcoded secrets detected', 'Move secrets to environment variables');
    } else if (hardcodedSecrets > 0) {
      this.addIssue('Hardcoded secrets detected', 'Never commit secrets to code - use environment variables');
    } else if (envUsage === 0) {
      // No environment usage might be fine for simple projects
      _score += 1;
      this.addScore(1, 2, 'No obvious secrets management (might be appropriate for this project)');
    }

    this.setDetail('envUsage', envUsage);
    this.setDetail('hardcodedSecrets', hardcodedSecrets);
    this.setDetail('hasEnvFile', hasEnvFile);
  }

  /**
   * PHASE 1: Enhanced error context analysis for AI debugging and security
   */
  async analyzeErrorHandling() {
    let _score = 0;
    const _maxScore = 3;

    const files = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx']);
    let tryCatchBlocks = 0;
    let errorHandlers = 0;
    let errorExposureRisk = 0;

    // PHASE 1: Enhanced error analysis metrics
    let structuredErrors = 0;
    let contextualErrors = 0;
    let gracefulDegradation = 0;
    let aiDebuggingContext = 0;
    let errorBoundariesFound = 0;

    for (const file of files.slice(0, 25)) { // Increased sample size
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

        // PHASE 1: Analyze structured error handling
        if (this.hasStructuredErrorHandling(content)) {
          structuredErrors++;
        }

        // PHASE 1: Analyze contextual error information
        if (this.hasContextualErrorHandling(content)) {
          contextualErrors++;
        }

        // PHASE 1: Check for graceful degradation patterns
        if (this.hasGracefulDegradation(content)) {
          gracefulDegradation++;
        }

        // PHASE 1: AI debugging context patterns
        if (this.hasAIDebuggingContext(content)) {
          aiDebuggingContext++;
        }

        // Check for React Error Boundaries
        if (content.includes('componentDidCatch') || content.includes('ErrorBoundary') ||
            content.includes('getDerivedStateFromError')) {
          errorBoundariesFound++;
        }

        // Enhanced information exposure detection
        if (this.hasErrorInformationExposure(content)) {
          errorExposureRisk++;
        }

      } catch (error) {
        // Skip files that can't be read
      }
    }

    // Score for try-catch usage (1.5pts)
    if (tryCatchBlocks > 0) {
      const catchScore = Math.min(tryCatchBlocks / 5, 1.5);
      _score += catchScore;
      this.addScore(catchScore, 1.5, `Error handling blocks found (${tryCatchBlocks})`);
    } else if (files.length > 5) {
      this.addIssue('Limited error handling detected', 'Add try-catch blocks for error-prone operations');
    }

    // Score for structured error handling (0.75pts)
    const structuredRatio = files.length > 0 ? structuredErrors / Math.min(files.length, 25) : 0;
    const structuredScore = Math.min(structuredRatio * 0.75, 0.75);
    if (structuredScore > 0.3) {
      _score += structuredScore;
      this.addScore(structuredScore, 0.75, `Structured error handling (${Math.round(structuredRatio * 100)}% of files)`);
    } else {
      this.addIssue('Limited structured error handling', 'Use consistent error object structures with context');
    }

    // Score for contextual error information (0.75pts)
    const contextualRatio = files.length > 0 ? contextualErrors / Math.min(files.length, 25) : 0;
    const contextualScore = Math.min(contextualRatio * 0.75, 0.75);
    if (contextualScore > 0.3) {
      _score += contextualScore;
      this.addScore(contextualScore, 0.75, `Contextual error handling (${Math.round(contextualRatio * 100)}% of files)`);
    } else if (contextualErrors > 0) {
      _score += contextualScore;
      this.addScore(contextualScore, 0.75, 'Some contextual error handling found');
      this.addIssue('Limited error context', 'Add more contextual information to error handling for better debugging');
    } else {
      this.addIssue('No contextual error handling', 'Add phase, step, and debug context to error handling');
    }

    // Bonus points for advanced error patterns
    let bonusScore = 0;
    if (gracefulDegradation > 0) {
      bonusScore += 0.2;
      this.addScore(0.2, 0.2, `Graceful degradation patterns found (${gracefulDegradation} files)`);
    }

    if (aiDebuggingContext > 0) {
      bonusScore += 0.3;
      this.addScore(0.3, 0.3, `AI debugging context patterns found (${aiDebuggingContext} files)`);
    }

    if (errorBoundariesFound > 0) {
      bonusScore += 0.2;
      this.addScore(0.2, 0.2, `Error boundaries implemented (${errorBoundariesFound} components)`);
    }

    _score += Math.min(bonusScore, 0.5); // Cap bonus at 0.5pts

    // Deduct for potential information exposure
    if (errorExposureRisk > 3) {
      this.addIssue('High error information exposure risk', 'Avoid logging sensitive error details - implement structured logging');
    } else if (errorExposureRisk > 0) {
      this.addIssue('Some error information exposure detected', 'Review error logging for sensitive information leaks');
    }

    // Add specific recommendations based on analysis
    if (structuredErrors === 0 && files.length > 5) {
      this.addIssue('No structured error handling found', 'Implement error classes with phase, step, and context information');
    }

    if (aiDebuggingContext === 0 && contextualErrors < files.length * 0.3) {
      this.addIssue('Limited AI debugging context', 'Add error context with debugContext, suggestedFix, and commonIssues');
    }

    this.setDetail('tryCatchBlocks', tryCatchBlocks);
    this.setDetail('errorHandlers', errorHandlers);
    this.setDetail('errorExposureRisk', errorExposureRisk);
    this.setDetail('structuredErrors', structuredErrors);
    this.setDetail('contextualErrors', contextualErrors);
    this.setDetail('gracefulDegradation', gracefulDegradation);
    this.setDetail('aiDebuggingContext', aiDebuggingContext);
    this.setDetail('errorBoundaries', errorBoundariesFound);
  }

  /**
   * PHASE 1: Check for structured error handling patterns
   */
  hasStructuredErrorHandling(content) {
    // Look for structured error objects with consistent properties
    const patterns = [
      /new\s+\w*Error\(/,
      /error\s*:\s*{[\s\S]*?message[\s\S]*?}/,
      /throw\s+new\s+\w+Error\(/,
      /{[\s\S]*?code[\s\S]*?message[\s\S]*?}/,
      /Error\('[^']*',\s*{/,
      /createError\(/,
      /ErrorWithContext/
    ];

    return patterns.some(pattern => pattern.test(content));
  }

  /**
   * PHASE 1: Check for contextual error handling (phase, step, debug info)
   */
  hasContextualErrorHandling(content) {
    const patterns = [
      /phase\s*:/,
      /step\s*:/,
      /context\s*:/,
      /debugContext\s*:/,
      /currentPhase/,
      /lastSuccessfulStep/,
      /operationContext/,
      /errorContext/,
      /catch\s*\([^)]*\)\s*{[\s\S]*?(?:phase|step|context)/i
    ];

    return patterns.some(pattern => pattern.test(content));
  }

  /**
   * PHASE 1: Check for graceful degradation patterns
   */
  hasGracefulDegradation(content) {
    const patterns = [
      /fallback/i,
      /graceful.*degradation/i,
      /fallbackTo/,
      /withFallback/,
      /defaultValue/,
      /catch.*return.*default/i,
      /try.*catch.*continue/i,
      /backup.*strategy/i
    ];

    return patterns.some(pattern => pattern.test(content));
  }

  /**
   * PHASE 1: Check for AI debugging context patterns
   */
  hasAIDebuggingContext(content) {
    const patterns = [
      /suggestedFix/,
      /debugContext/,
      /commonIssues/,
      /aiContext/i,
      /troubleshooting/i,
      /errorGuidance/,
      /debugInfo/,
      /contextualError/,
      /@aiContext/,
      /AI.*can.*use.*context/i
    ];

    return patterns.some(pattern => pattern.test(content));
  }

  /**
   * PHASE 1: Enhanced error information exposure detection
   */
  hasErrorInformationExposure(content) {
    const exposurePatterns = [
      /console\.error\(.*error.*\)/,
      /console\.log\(.*error.*\)/,
      /alert\(.*error.*\)/,
      /JSON\.stringify\(error\)/,
      /error\.stack/,
      /error\.message.*response/,
      /throw.*error\.message/,
      /res\.send\(.*error/,
      /response.*error\.message/
    ];

    return exposurePatterns.some(pattern => pattern.test(content));
  }

  async analyzeInputValidation() {
    let _score = 0;
    const _maxScore = 2;

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
        _score += 1;
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
      _score += validationScore;
      this.addScore(validationScore, 1, `Input validation patterns found (${validationPatterns} files)`);
    } else if (files.length > 5) {
      this.addIssue('No input validation patterns detected', 'Add input validation for user data');
    }

    this.setDetail('validationPatterns', validationPatterns);
    this.setDetail('sanitizationUsage', sanitizationUsage);
  }
}