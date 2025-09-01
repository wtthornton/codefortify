/**
 * SecurityAgent - Parallel-Safe Security and Vulnerability Analysis Agent
 *
 * Extends IAnalysisAgent with security-specific parallel capabilities:
 * - Streaming npm audit integration
 * - Concurrent vulnerability scanning
 * - Parallel secrets detection
 * - Non-blocking security analysis
 */

import { IAnalysisAgent } from './IAnalysisAgent.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class SecurityAgent extends IAnalysisAgent {
  constructor(config = {}) {
    super(config);

    this.categoryName = 'Security & Error Handling';
    this.description = 'Parallel security analysis with vulnerability scanning, secrets detection, and error handling evaluation';
    this.agentType = 'security';
    this.priority = 2; // High priority for security
    this.timeout = 45000; // Longer timeout for npm audit

    // Security-specific resource requirements
    this.resourceRequirements = {
      files: ['package.json', 'package-lock.json', '.env', '.gitignore'],
      memory: 100, // MB
      cpu: 0.3, // 30% CPU for npm audit
      network: true // npm audit needs network
    };

    // Security analysis cache
    this.auditCache = new Map();
    this.secretsCache = new Map();
    this.lastAuditRun = 0;
    this.auditCacheTimeout = 300000; // 5 minutes

    // Streaming results
    this.streamingResults = {
      vulnerabilities: [],
      secrets: [],
      errorHandling: [],
      inputValidation: []
    };
  }

  async setupResources() {
    await super.setupResources();

    // Initialize security-specific resources
    this.initializeSecurityModules();
  }

  initializeSecurityModules() {
    // Set up vulnerability patterns
    this.vulnerabilityPatterns = {
      secretPatterns: [
        /api[_-]?key['"]\s*[:=]\s*['"]\w{20,}/i,
        /secret['"]\s*[:=]\s*['"]\w{20,}/i,
        /token['"]\s*[:=]\s*['"]\w{20,}/i,
        /password['"]\s*[:=]\s*['"]\w{8,}/i,
        /private[_-]?key/i,
        /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/,
        /['"]\w*[Aa][Pp][Ii][Kk][Ee][Yy]\w*['"]\s*[:=]\s*['"]\w{20,}/,
        /[0-9a-f]{32,}/g
      ],

      errorExposurePatterns: [
        /console\.error\(.*error.*\)/,
        /console\.log\(.*error.*\)/,
        /alert\(.*error.*\)/,
        /JSON\.stringify\(error\)/,
        /error\.stack/,
        /error\.message.*response/,
        /throw.*error\.message/,
        /res\.send\(.*error/,
        /response.*error\.message/
      ]
    };

    // Initialize security scoring weights
    this.scoringWeights = {
      vulnerabilities: 6,
      secrets: 4,
      errorHandling: 3,
      inputValidation: 2
    };
  }

  async runAnalysis() {
    this.results.score = 0;
    this.results.issues = [];
    this.results.suggestions = [];

    // Run security analysis modules in parallel where possible
    const analysisPromises = [
      this.analyzeDependencyVulnerabilitiesParallel(),
      this.analyzeSecretsManagementParallel(),
      this.analyzeErrorHandlingParallel(),
      this.analyzeInputValidationParallel()
    ];

    // Emit progress events
    this.emit('analysis:progress', {
      agentId: this.agentId,
      phase: 'security_analysis',
      modules: ['vulnerabilities', 'secrets', 'error_handling', 'input_validation'],
      status: 'running'
    });

    try {
      await Promise.all(analysisPromises);

      this.emit('analysis:progress', {
        agentId: this.agentId,
        phase: 'security_analysis',
        status: 'completed',
        score: this.results.score,
        issues: this.results.issues.length
      });

    } catch (error) {
      this.emit('analysis:error', {
        agentId: this.agentId,
        phase: 'security_analysis',
        error: error.message
      });
      throw error;
    }
  }

  async analyzeDependencyVulnerabilitiesParallel() {
    let score = 0;

    try {
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

      // Run npm audit with caching and streaming
      const auditResult = await this.runNpmAuditParallel();

      if (auditResult.success) {
        const vulnData = auditResult.data;
        const totalVulns = vulnData.metadata?.vulnerabilities?.total || 0;
        const highVulns = vulnData.metadata?.vulnerabilities?.high || 0;
        const criticalVulns = vulnData.metadata?.vulnerabilities?.critical || 0;

        // Stream vulnerability results
        this.streamingResults.vulnerabilities.push({
          total: totalVulns,
          critical: criticalVulns,
          high: highVulns,
          timestamp: Date.now()
        });

        // Score based on vulnerability severity
        if (totalVulns === 0) {
          score += 4;
          this.addScore(4, 4, 'No vulnerabilities found in dependencies (npm audit)');
        } else if (criticalVulns === 0 && highVulns === 0) {
          score += 3;
          this.addScore(3, 4, `Only low/moderate vulnerabilities found (${totalVulns} total)`);
        } else if (criticalVulns === 0) {
          score += 2;
          this.addScore(2, 4, `High vulnerabilities found (${highVulns} high, ${totalVulns} total)`);
          this.addIssue(`${highVulns} high severity vulnerabilities`, 'Run npm audit fix to resolve security issues');
        } else {
          score += 1;
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
        // Graceful degradation with parallel fallback analysis
        this.addScore(2, 4, 'npm audit unavailable - using pattern analysis');
        this.addIssue('npm audit not available', 'For accurate vulnerability scanning, ensure npm is installed');
        await this.fallbackVulnerabilityAnalysisParallel(deps);
      }

      // Run parallel checks for lock files and audit scripts
      const [hasLockFile, hasAuditScript] = await Promise.all([
        this.checkLockFiles(),
        this.checkAuditScript(packageJson)
      ]);

      if (hasLockFile) {
        score += 1;
        this.addScore(1, 1, 'Lock file present (prevents dependency confusion)');
      } else {
        this.addIssue('No lock file found', 'Add package-lock.json to prevent dependency confusion attacks');
      }

      if (hasAuditScript) {
        score += 1;
        this.addScore(1, 1, 'Audit script configured');
      } else {
        this.addIssue('No audit script in package.json', 'Add "audit": "npm audit" script for vulnerability checking');
      }

      this.setDetail('dependencyCount', depsCount);
      this.setDetail('hasLockFile', hasLockFile);

    } catch (error) {
      this.addIssue('Vulnerability analysis failed', `Error during security scan: ${error.message}`);
    }
  }

  async runNpmAuditParallel() {
    const now = Date.now();

    // Check cache first
    if (this.lastAuditRun > 0 && (now - this.lastAuditRun) < this.auditCacheTimeout) {
      const cached = this.auditCache.get('npm-audit');
      if (cached) {
        this.emit('audit:cache_hit', { agentId: this.agentId });
        return cached;
      }
    }

    try {
      this.emit('audit:started', { agentId: this.agentId });

      // Use async exec for non-blocking operation
      const { stdout } = await execAsync('npm audit --json', {
        timeout: 30000,
        cwd: this.config.projectRoot || process.cwd(),
        encoding: 'utf8'
      });

      const auditData = JSON.parse(stdout);
      const result = { success: true, data: auditData };

      // Cache the result
      this.auditCache.set('npm-audit', result);
      this.lastAuditRun = now;

      this.emit('audit:completed', {
        agentId: this.agentId,
        vulnerabilities: auditData.metadata?.vulnerabilities?.total || 0
      });

      return result;

    } catch (error) {
      // Handle npm audit exit codes (non-zero when vulnerabilities found)
      if (error.stdout) {
        try {
          const auditData = JSON.parse(error.stdout);
          const result = { success: true, data: auditData };

          this.auditCache.set('npm-audit', result);
          this.lastAuditRun = now;

          return result;
        } catch (parseError) {
          this.emit('audit:parse_error', { agentId: this.agentId, error: parseError.message });
        }
      }

      this.emit('audit:failed', { agentId: this.agentId, error: error.message });
      return { success: false, error: error.message };
    }
  }

  async checkLockFiles() {
    const lockFileChecks = [
      this.fileExists('package-lock.json'),
      this.fileExists('yarn.lock'),
      this.fileExists('pnpm-lock.yaml')
    ];

    const results = await Promise.allSettled(lockFileChecks);
    return results.some(result => result.status === 'fulfilled' && result.value === true);
  }

  async checkAuditScript(packageJson) {
    return packageJson.scripts && packageJson.scripts.audit;
  }

  async fallbackVulnerabilityAnalysisParallel(deps) {
    const securityPackages = [
      'helmet', 'cors', 'express-rate-limit', 'bcrypt', 'bcryptjs',
      'jsonwebtoken', 'passport', 'express-validator', 'sanitize-html',
      'dompurify', 'xss', 'csrf'
    ];

    const problematicPackages = [
      'eval', 'vm2', 'serialize-javascript', 'node-serialize', 'safer-eval'
    ];

    const [hasSecurityPackages, hasProblematicPackages] = await Promise.all([
      Promise.resolve(securityPackages.some(pkg => deps[pkg])),
      Promise.resolve(problematicPackages.some(pkg => deps[pkg]))
    ]);

    if (hasSecurityPackages) {
      this.addScore(1, 1, 'Security-focused packages detected');
    }

    if (hasProblematicPackages) {
      this.addIssue('Potentially unsafe packages detected', 'Review usage of eval-like packages');
    } else {
      this.addScore(1, 1, 'No obviously unsafe packages detected');
    }
  }

  async analyzeSecretsManagementParallel() {
    let score = 0;

    try {
      // Get files and environment setup in parallel
      const [files, envChecks] = await Promise.all([
        this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx', '.json', '.env']),
        this.checkEnvironmentSetup()
      ]);

      const { hasEnvFile, envInGitignore } = envChecks;

      if (hasEnvFile) {
        score += 1;
        this.addScore(1, 1, 'Environment file detected');
      }

      if (envInGitignore) {
        score += 1;
        this.addScore(1, 1, 'Environment files ignored in git');
      } else if (hasEnvFile) {
        this.addIssue('.env file not in .gitignore', 'Add .env to .gitignore to prevent secret exposure');
      }

      // Analyze files for secrets in chunks for better performance
      const secretsAnalysis = await this.analyzeSecretsInFilesParallel(files.slice(0, 30));
      const { envUsage, hardcodedSecrets } = secretsAnalysis;

      // Score secrets management
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
        score += 1;
        this.addScore(1, 2, 'No obvious secrets management (might be appropriate for this project)');
      }

      // Stream secrets results
      this.streamingResults.secrets.push({
        envUsage,
        hardcodedSecrets,
        hasEnvFile,
        timestamp: Date.now()
      });

      this.setDetail('envUsage', envUsage);
      this.setDetail('hardcodedSecrets', hardcodedSecrets);
      this.setDetail('hasEnvFile', hasEnvFile);

    } catch (error) {
      this.addIssue('Secrets analysis failed', `Error during secrets scan: ${error.message}`);
    }
  }

  async checkEnvironmentSetup() {
    const [hasEnvFile, hasGitignore] = await Promise.all([
      Promise.race([
        this.fileExists('.env'),
        this.fileExists('.env.example')
      ]).then(result => result).catch(() => false),
      this.fileExists('.gitignore')
    ]);

    let envInGitignore = false;

    if (hasGitignore) {
      try {
        const gitignoreContent = await this.readFile('.gitignore');
        envInGitignore = gitignoreContent.includes('.env') || gitignoreContent.includes('*.env');
      } catch (error) {
        // Skip if can't read .gitignore
      }
    }

    return { hasEnvFile, envInGitignore };
  }

  async analyzeSecretsInFilesParallel(files) {
    const chunkSize = 10; // Process files in chunks
    const chunks = [];

    for (let i = 0; i < files.length; i += chunkSize) {
      chunks.push(files.slice(i, i + chunkSize));
    }

    const chunkPromises = chunks.map(chunk => this.analyzeSecretsChunk(chunk));
    const chunkResults = await Promise.allSettled(chunkPromises);

    // Aggregate results
    let envUsage = 0;
    let hardcodedSecrets = 0;

    chunkResults.forEach(result => {
      if (result.status === 'fulfilled') {
        envUsage += result.value.envUsage;
        hardcodedSecrets += result.value.hardcodedSecrets;
      }
    });

    return { envUsage, hardcodedSecrets };
  }

  async analyzeSecretsChunk(files) {
    let envUsage = 0;
    let hardcodedSecrets = 0;

    for (const file of files) {
      try {
        const content = await this.readFile(file);

        // Look for environment variable usage
        const envMatches = content.match(/process\.env\./g);
        if (envMatches) {
          envUsage += envMatches.length;
        }

        // Look for hardcoded secrets
        for (const pattern of this.vulnerabilityPatterns.secretPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            hardcodedSecrets += matches.length;
          }
        }

      } catch (error) {
        // Skip files that can't be read
      }
    }

    return { envUsage, hardcodedSecrets };
  }

  async analyzeErrorHandlingParallel() {
    let score = 0;

    try {
      const files = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx']);

      // Analyze error handling in parallel chunks
      const analysis = await this.analyzeErrorHandlingInFilesParallel(files.slice(0, 25));

      const {
        tryCatchBlocks,
        structuredErrors,
        contextualErrors,
        gracefulDegradation,
        aiDebuggingContext,
        errorBoundaries,
        errorExposureRisk
      } = analysis;

      // Score try-catch usage (1.5pts)
      if (tryCatchBlocks > 0) {
        const catchScore = Math.min(tryCatchBlocks / 5, 1.5);
        score += catchScore;
        this.addScore(catchScore, 1.5, `Error handling blocks found (${tryCatchBlocks})`);
      } else if (files.length > 5) {
        this.addIssue('Limited error handling detected', 'Add try-catch blocks for error-prone operations');
      }

      // Score structured error handling (0.75pts)
      const structuredRatio = files.length > 0 ? structuredErrors / Math.min(files.length, 25) : 0;
      const structuredScore = Math.min(structuredRatio * 0.75, 0.75);
      if (structuredScore > 0.3) {
        score += structuredScore;
        this.addScore(structuredScore, 0.75, `Structured error handling (${Math.round(structuredRatio * 100)}% of files)`);
      }

      // Score contextual error information (0.75pts)
      const contextualRatio = files.length > 0 ? contextualErrors / Math.min(files.length, 25) : 0;
      const contextualScore = Math.min(contextualRatio * 0.75, 0.75);
      if (contextualScore > 0.3) {
        score += contextualScore;
        this.addScore(contextualScore, 0.75, `Contextual error handling (${Math.round(contextualRatio * 100)}% of files)`);
      }

      // Bonus points for advanced patterns
      let bonusScore = 0;
      if (gracefulDegradation > 0) {
        bonusScore += 0.2;
        this.addScore(0.2, 0.2, `Graceful degradation patterns found (${gracefulDegradation} files)`);
      }
      if (aiDebuggingContext > 0) {
        bonusScore += 0.3;
        this.addScore(0.3, 0.3, `AI debugging context patterns found (${aiDebuggingContext} files)`);
      }
      if (errorBoundaries > 0) {
        bonusScore += 0.2;
        this.addScore(0.2, 0.2, `Error boundaries implemented (${errorBoundaries} components)`);
      }
      score += Math.min(bonusScore, 0.5);

      // Handle error exposure warnings
      if (errorExposureRisk > 3) {
        this.addIssue('High error information exposure risk', 'Avoid logging sensitive error details');
      } else if (errorExposureRisk > 0) {
        this.addIssue('Some error information exposure detected', 'Review error logging for sensitive information leaks');
      }

      // Stream error handling results
      this.streamingResults.errorHandling.push({
        tryCatchBlocks,
        structuredErrors,
        contextualErrors,
        gracefulDegradation,
        aiDebuggingContext,
        errorBoundaries,
        errorExposureRisk,
        timestamp: Date.now()
      });

      this.setDetail('tryCatchBlocks', tryCatchBlocks);
      this.setDetail('structuredErrors', structuredErrors);
      this.setDetail('contextualErrors', contextualErrors);
      this.setDetail('gracefulDegradation', gracefulDegradation);
      this.setDetail('aiDebuggingContext', aiDebuggingContext);
      this.setDetail('errorBoundaries', errorBoundaries);
      this.setDetail('errorExposureRisk', errorExposureRisk);

    } catch (error) {
      this.addIssue('Error handling analysis failed', `Error during analysis: ${error.message}`);
    }
  }

  async analyzeErrorHandlingInFilesParallel(files) {
    const chunkSize = 8; // Process files in chunks
    const chunks = [];

    for (let i = 0; i < files.length; i += chunkSize) {
      chunks.push(files.slice(i, i + chunkSize));
    }

    const chunkPromises = chunks.map(chunk => this.analyzeErrorHandlingChunk(chunk));
    const chunkResults = await Promise.allSettled(chunkPromises);

    // Aggregate results
    let tryCatchBlocks = 0;
    let structuredErrors = 0;
    let contextualErrors = 0;
    let gracefulDegradation = 0;
    let aiDebuggingContext = 0;
    let errorBoundaries = 0;
    let errorExposureRisk = 0;

    chunkResults.forEach(result => {
      if (result.status === 'fulfilled') {
        const r = result.value;
        tryCatchBlocks += r.tryCatchBlocks;
        structuredErrors += r.structuredErrors;
        contextualErrors += r.contextualErrors;
        gracefulDegradation += r.gracefulDegradation;
        aiDebuggingContext += r.aiDebuggingContext;
        errorBoundaries += r.errorBoundaries;
        errorExposureRisk += r.errorExposureRisk;
      }
    });

    return {
      tryCatchBlocks,
      structuredErrors,
      contextualErrors,
      gracefulDegradation,
      aiDebuggingContext,
      errorBoundaries,
      errorExposureRisk
    };
  }

  async analyzeErrorHandlingChunk(files) {
    let tryCatchBlocks = 0;
    let structuredErrors = 0;
    let contextualErrors = 0;
    let gracefulDegradation = 0;
    let aiDebuggingContext = 0;
    let errorBoundaries = 0;
    let errorExposureRisk = 0;

    for (const file of files) {
      try {
        const content = await this.readFile(file);

        // Count try-catch blocks
        const tryCatchMatches = content.match(/try\s*{[\s\S]*?catch\s*\(/g);
        if (tryCatchMatches) {tryCatchBlocks += tryCatchMatches.length;}

        // Check for structured error handling
        if (this.hasStructuredErrorHandling(content)) {structuredErrors++;}

        // Check for contextual error handling
        if (this.hasContextualErrorHandling(content)) {contextualErrors++;}

        // Check for graceful degradation
        if (this.hasGracefulDegradation(content)) {gracefulDegradation++;}

        // Check for AI debugging context
        if (this.hasAIDebuggingContext(content)) {aiDebuggingContext++;}

        // Check for React Error Boundaries
        if (content.includes('componentDidCatch') || content.includes('ErrorBoundary') ||
            content.includes('getDerivedStateFromError')) {
          errorBoundaries++;
        }

        // Check for error information exposure
        if (this.hasErrorInformationExposure(content)) {errorExposureRisk++;}

      } catch (error) {
        // Skip files that can't be read
      }
    }

    return {
      tryCatchBlocks,
      structuredErrors,
      contextualErrors,
      gracefulDegradation,
      aiDebuggingContext,
      errorBoundaries,
      errorExposureRisk
    };
  }

  async analyzeInputValidationParallel() {
    let score = 0;

    try {
      const [files, packageJson] = await Promise.all([
        this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx']),
        this.readPackageJson()
      ]);

      // Check for validation libraries
      let hasValidationLib = false;
      if (packageJson) {
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        const validationLibraries = [
          'joi', 'yup', 'express-validator', 'ajv', 'zod',
          'class-validator', 'validator', 'sanitize-html'
        ];
        hasValidationLib = validationLibraries.some(lib => deps[lib]);

        if (hasValidationLib) {
          score += 1;
          this.addScore(1, 1, 'Input validation library detected');
        }
      }

      // Analyze validation patterns in parallel
      const validation = await this.analyzeValidationPatternsParallel(files.slice(0, 15));
      const { validationPatterns, sanitizationUsage } = validation;

      // Score validation patterns
      if (validationPatterns > 0) {
        const validationScore = Math.min(validationPatterns / 5, 1);
        score += validationScore;
        this.addScore(validationScore, 1, `Input validation patterns found (${validationPatterns} files)`);
      } else if (files.length > 5) {
        this.addIssue('No input validation patterns detected', 'Add input validation for user data');
      }

      // Stream input validation results
      this.streamingResults.inputValidation.push({
        hasValidationLib,
        validationPatterns,
        sanitizationUsage,
        timestamp: Date.now()
      });

      this.setDetail('validationPatterns', validationPatterns);
      this.setDetail('sanitizationUsage', sanitizationUsage);

    } catch (error) {
      this.addIssue('Input validation analysis failed', `Error during analysis: ${error.message}`);
    }
  }

  async analyzeValidationPatternsParallel(files) {
    const chunkSize = 5; // Smaller chunks for validation analysis
    const chunks = [];

    for (let i = 0; i < files.length; i += chunkSize) {
      chunks.push(files.slice(i, i + chunkSize));
    }

    const chunkPromises = chunks.map(chunk => this.analyzeValidationChunk(chunk));
    const chunkResults = await Promise.allSettled(chunkPromises);

    let validationPatterns = 0;
    let sanitizationUsage = 0;

    chunkResults.forEach(result => {
      if (result.status === 'fulfilled') {
        validationPatterns += result.value.validationPatterns;
        sanitizationUsage += result.value.sanitizationUsage;
      }
    });

    return { validationPatterns, sanitizationUsage };
  }

  async analyzeValidationChunk(files) {
    let validationPatterns = 0;
    let sanitizationUsage = 0;

    const validationKeywords = [
      'validate', 'sanitize', 'escape', 'filter', 'trim',
      'typeof', 'instanceof', 'isArray', 'isString', 'isNumber'
    ];

    for (const file of files) {
      try {
        const content = await this.readFile(file);

        // Look for validation patterns
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

    return { validationPatterns, sanitizationUsage };
  }

  // Pattern detection methods (reused from SecurityAnalyzer)
  hasStructuredErrorHandling(content) {
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

  hasErrorInformationExposure(content) {
    return this.vulnerabilityPatterns.errorExposurePatterns.some(pattern =>
      pattern.test(content)
    );
  }

  /**
   * Get streaming security analysis results
   */
  getStreamingResults() {
    return this.streamingResults;
  }

  /**
   * Clear analysis caches
   */
  clearCaches() {
    this.auditCache.clear();
    this.secretsCache.clear();
    this.lastAuditRun = 0;
  }

  /**
   * Get security-specific metrics
   */
  getSecurityMetrics() {
    return {
      ...this.getMetrics(),
      caches: {
        auditCacheSize: this.auditCache.size,
        secretsCacheSize: this.secretsCache.size,
        lastAuditRun: this.lastAuditRun
      },
      streaming: {
        vulnerabilityResults: this.streamingResults.vulnerabilities.length,
        secretsResults: this.streamingResults.secrets.length,
        errorHandlingResults: this.streamingResults.errorHandling.length,
        inputValidationResults: this.streamingResults.inputValidation.length
      }
    };
  }
}