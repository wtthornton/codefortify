/**
 * SecurityAgent - Security Analysis and Vulnerability Detection
 * Focuses on npm audit integration, code security scanning, and dependency analysis
 */

import { IAnalysisAgent } from './IAnalysisAgent.js';
import { performance } from 'perf_hooks';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class SecurityAgent extends IAnalysisAgent {
  constructor(config = {}) {
    super(config);
    this.agentType = 'security';
    this.categoryName = 'Security & Error Handling';
    this.maxScore = 15;
    this.weight = 0.2;

    this.config = {
      enableNpmAudit: true,
      enableSecretScanning: true,
      enableDependencyAnalysis: true,
      enableErrorHandlingAnalysis: true,
      ...config
    };

    this.results = {
      score: 0,
      maxScore: this.maxScore,
      issues: [],
      suggestions: [],
      details: {},
      analysisTime: 0
    };

    // Security patterns to detect
    this.securityPatterns = [
      {
        pattern: /(password|secret|key|token|credential)\s*[:=]\s*['"]\w+['"]/gi,
        type: 'hardcoded-secret',
        severity: 'high',
        message: 'Potential hardcoded secret detected'
      },
      {
        pattern: /console\.(log|error|warn)\s*\([^)]*(?:password|secret|key|token)[^)]*\)/gi,
        type: 'secret-logging',
        severity: 'high',
        message: 'Potential secret logging detected'
      },
      {
        pattern: /eval\s*\(/gi,
        type: 'eval-usage',
        severity: 'medium',
        message: 'Use of eval() detected - potential security risk'
      }
    ];
  }

  async execute(context) {
    const startTime = performance.now();

    try {
      if (this.config.enableNpmAudit) {
        await this.analyzeNpmSecurity(context.projectRoot);
      }

      if (this.config.enableSecretScanning) {
        await this.scanForSecrets(context.projectRoot);
      }

      if (this.config.enableDependencyAnalysis) {
        await this.analyzeDependencySecurity(context.projectRoot);
      }

      if (this.config.enableErrorHandlingAnalysis) {
        await this.analyzeErrorHandling(context.projectRoot);
      }

      this.calculateFinalScore();
      this.results.analysisTime = performance.now() - startTime;

      return {
        agent: this.agentType,
        result: this.results,
        executionTime: this.results.analysisTime
      };

    } catch (error) {
      return this.handleExecutionError(error);
    }
  }

  async analyzeNpmSecurity(projectRoot) {
    const npmAudit = {
      vulnerabilities: [],
      summary: {
        total: 0,
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0
      }
    };

    try {
      const { stdout } = await execAsync('npm audit --json', {
        cwd: projectRoot,
        timeout: 10000
      });

      const auditResult = JSON.parse(stdout);
      npmAudit.summary = auditResult.metadata?.vulnerabilities || npmAudit.summary;
      npmAudit.vulnerabilities = this.extractVulnerabilities(auditResult);

    } catch (error) {
      // npm audit returns non-zero exit code when vulnerabilities found
      if (error.stdout) {
        try {
          const auditResult = JSON.parse(error.stdout);
          npmAudit.summary = auditResult.metadata?.vulnerabilities || npmAudit.summary;
          npmAudit.vulnerabilities = this.extractVulnerabilities(auditResult);
        } catch (parseError) {
          this.results.issues.push({
            type: 'npm-audit-error',
            message: `npm audit failed: ${parseError.message}`,
            severity: 'warning'
          });
        }
      }
    }

    this.results.details.npmAudit = npmAudit;
    const securityScore = this.calculateSecurityScore(npmAudit.summary);
    this.addScore(securityScore, 6, 'npm Security Audit');
  }

  async scanForSecrets(projectRoot) {
    const secretScan = {
      secretsFound: 0,
      potentialSecrets: [],
      filesScanned: 0
    };

    try {
      const jsFiles = await this.getJavaScriptFiles(projectRoot);
      secretScan.filesScanned = jsFiles.length;

      for (const filePath of jsFiles) {
        const fileSecrets = await this.scanFileForSecrets(filePath);
        secretScan.potentialSecrets.push(...fileSecrets);
        secretScan.secretsFound += fileSecrets.length;
      }

    } catch (error) {
      this.results.issues.push({
        type: 'secret-scan-error',
        message: `Secret scanning failed: ${error.message}`,
        severity: 'info'
      });
    }

    this.results.details.secretScan = secretScan;
    const secretScore = Math.max(0, 4 - (secretScan.secretsFound * 0.5));
    this.addScore(secretScore, 4, 'Secret Detection');
  }

  async analyzeDependencySecurity(projectRoot) {
    const dependencies = {
      totalCount: 0,
      outdatedCount: 0,
      securityRisk: 'low',
      riskFactors: []
    };

    try {
      const packageJsonPath = `${projectRoot}/package.json`;
      const packageJson = await this.readJsonFile(packageJsonPath);

      if (packageJson) {
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies
        };

        dependencies.totalCount = Object.keys(allDeps).length;
        dependencies.riskFactors = this.analyzeDependencyRisk(allDeps);
        dependencies.securityRisk = this.calculateOverallRisk(dependencies.riskFactors);
      }

    } catch (error) {
      this.results.issues.push({
        type: 'dependency-analysis-error',
        message: `Dependency analysis failed: ${error.message}`,
        severity: 'info'
      });
    }

    this.results.details.dependencies = dependencies;
    const depScore = this.calculateDependencyScore(dependencies);
    this.addScore(depScore, 3, 'Dependency Security');
  }

  async analyzeErrorHandling(projectRoot) {
    const errorHandling = {
      tryCatchBlocks: 0,
      errorLogging: 0,
      errorExposure: 0,
      handlingScore: 0
    };

    try {
      const jsFiles = await this.getJavaScriptFiles(projectRoot);

      for (const filePath of jsFiles) {
        const analysis = await this.analyzeFileErrorHandling(filePath);
        errorHandling.tryCatchBlocks += analysis.tryCatchCount;
        errorHandling.errorLogging += analysis.errorLogging;
        errorHandling.errorExposure += analysis.errorExposure;
      }

      errorHandling.handlingScore = this.calculateErrorHandlingScore(errorHandling);

    } catch (error) {
      this.results.issues.push({
        type: 'error-handling-analysis-error',
        message: `Error handling analysis failed: ${error.message}`,
        severity: 'info'
      });
    }

    this.results.details.errorHandling = errorHandling;
    this.addScore(errorHandling.handlingScore, 2, 'Error Handling');
  }

  calculateFinalScore() {
    this.results.score = Math.min(this.score, this.maxScore);
    this.results.percentage = Math.round((this.results.score / this.maxScore) * 100);
    this.results.grade = this.calculateGrade(this.results.percentage / 100);

    // Add security recommendations
    if (this.results.details.npmAudit?.summary.total > 0) {
      this.results.suggestions.push({
        type: 'npm-security',
        message: `Found ${this.results.details.npmAudit.summary.total} npm vulnerabilities. Run 'npm audit fix' to resolve.`,
        priority: 'high'
      });
    }

    if (this.results.details.secretScan?.secretsFound > 0) {
      this.results.suggestions.push({
        type: 'secrets',
        message: 'Potential hardcoded secrets detected. Review and move to environment variables.',
        priority: 'high'
      });
    }
  }

  calculateSecurityScore(summary) {
    if (!summary || summary.total === 0) {return 6;}

    let score = 6;
    score -= summary.critical * 2;
    score -= summary.high * 1;
    score -= summary.moderate * 0.5;
    score -= summary.low * 0.1;

    return Math.max(0, score);
  }

  extractVulnerabilities(auditResult) {
    if (!auditResult.vulnerabilities) {return [];}

    return Object.values(auditResult.vulnerabilities).map(vuln => ({
      name: vuln.name,
      severity: vuln.severity,
      range: vuln.range,
      fixAvailable: vuln.fixAvailable
    }));
  }

  async scanFileForSecrets(filePath) {
    try {
      const content = await this.readFileContent(filePath);
      const secrets = [];

      for (const pattern of this.securityPatterns) {
        const matches = content.match(pattern.pattern);
        if (matches) {
          secrets.push({
            file: filePath,
            type: pattern.type,
            severity: pattern.severity,
            message: pattern.message,
            matches: matches.length
          });
        }
      }

      return secrets;
    } catch (error) {
      return [];
    }
  }

  analyzeDependencyRisk(dependencies) {
    const riskFactors = [];
    const highRiskPackages = ['lodash', 'moment', 'request']; // Known risky packages

    for (const [pkg, version] of Object.entries(dependencies)) {
      if (highRiskPackages.includes(pkg)) {
        riskFactors.push({
          package: pkg,
          version,
          risk: 'deprecated-package',
          severity: 'medium'
        });
      }
    }

    return riskFactors;
  }

  calculateOverallRisk(riskFactors) {
    if (riskFactors.length === 0) {return 'low';}
    if (riskFactors.some(r => r.severity === 'high')) {return 'high';}
    if (riskFactors.some(r => r.severity === 'medium')) {return 'medium';}
    return 'low';
  }

  calculateDependencyScore(dependencies) {
    if (dependencies.securityRisk === 'low') {return 3;}
    if (dependencies.securityRisk === 'medium') {return 2;}
    return 1;
  }

  async analyzeFileErrorHandling(filePath) {
    try {
      const content = await this.readFileContent(filePath);

      return {
        tryCatchCount: (content.match(/try\s*\{/g) || []).length,
        errorLogging: (content.match(/console\.(error|warn)/g) || []).length,
        errorExposure: (content.match(/throw\s+new\s+Error/g) || []).length
      };
    } catch (error) {
      return { tryCatchCount: 0, errorLogging: 0, errorExposure: 0 };
    }
  }

  calculateErrorHandlingScore(errorHandling) {
    let score = 2;

    // Deduct for excessive error exposure
    if (errorHandling.errorExposure > 10) {
      score -= 0.5;
    }

    // Reward proper error handling
    if (errorHandling.tryCatchBlocks > 0) {
      score += 0.5;
    }

    return Math.max(0, Math.min(score, 2));
  }

  // Helper methods
  async getJavaScriptFiles(projectRoot) {
    // Simplified - would use proper file discovery in production
    return [`${projectRoot}/src/example.js`];
  }

  async readJsonFile(_filePath) {
    // Simplified - would read actual file in production
    return { dependencies: {}, devDependencies: {} };
  }

  async readFileContent(_filePath) {
    // Simplified - would read actual file content in production
    return '';
  }
}