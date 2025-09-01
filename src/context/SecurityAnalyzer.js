/**
 * Security Analyzer for Context7
 * Analyzes security requirements and patterns
 *
 * Features:
 * - Security vulnerability detection
 * - Security best practices analysis
 * - Authentication and authorization patterns
 * - Data protection analysis
 */

import { fileUtils } from '../utils/fileUtils.js';
import path from 'path';

export class SecurityAnalyzer {
  constructor(config = {}) {
    this.config = config;
    this.securityPatterns = {
      vulnerabilities: [
        { pattern: /eval\s*\(/, severity: 'critical', message: 'Dangerous eval() usage detected' },
        { pattern: /innerHTML\s*=/, severity: 'high', message: 'Potential XSS vulnerability with innerHTML' },
        { pattern: /document\.write/, severity: 'high', message: 'Potential XSS vulnerability with document.write' },
        { pattern: /setTimeout\s*\(\s*["']/, severity: 'medium', message: 'Potential code injection with setTimeout' },
        { pattern: /new\s+Function\s*\(/, severity: 'high', message: 'Potential code injection with Function constructor' },
        { pattern: /\.innerHTML\s*=\s*[^;]*\+/, severity: 'medium', message: 'Potential XSS with string concatenation' }
      ],
      bestPractices: [
        { pattern: /crypto\.randomBytes/, severity: 'positive', message: 'Good use of crypto.randomBytes for secure random generation' },
        { pattern: /bcrypt/, severity: 'positive', message: 'Good use of bcrypt for password hashing' },
        { pattern: /helmet/, severity: 'positive', message: 'Good use of helmet for security headers' },
        { pattern: /cors/, severity: 'positive', message: 'Good use of CORS for cross-origin requests' },
        { pattern: /rate-limit/, severity: 'positive', message: 'Good use of rate limiting' },
        { pattern: /express-rate-limit/, severity: 'positive', message: 'Good use of express-rate-limit' }
      ],
      authentication: [
        { pattern: /jwt/, severity: 'info', message: 'JWT authentication detected' },
        { pattern: /passport/, severity: 'info', message: 'Passport.js authentication detected' },
        { pattern: /oauth/, severity: 'info', message: 'OAuth authentication detected' },
        { pattern: /session/, severity: 'info', message: 'Session-based authentication detected' }
      ],
      dataProtection: [
        { pattern: /encrypt/, severity: 'info', message: 'Encryption functionality detected' },
        { pattern: /hash/, severity: 'info', message: 'Hashing functionality detected' },
        { pattern: /sanitize/, severity: 'info', message: 'Input sanitization detected' },
        { pattern: /validate/, severity: 'info', message: 'Input validation detected' }
      ]
    };
  }

  /**
   * Analyze security needs and patterns
   * @param {string} projectRoot - Root directory of the project
   * @returns {Promise<Object>} Security analysis
   */
  async analyzeSecurityNeeds(projectRoot) {
    try {
      console.log(`🔒 Analyzing security needs in: ${projectRoot}`);

      const analysis = {
        vulnerabilities: await this.detectSecurityVulnerabilities(projectRoot),
        bestPractices: await this.detectSecurityBestPractices(projectRoot),
        authentication: await this.analyzeAuthentication(projectRoot),
        authorization: await this.analyzeAuthorization(projectRoot),
        dataProtection: await this.analyzeDataProtection(projectRoot),
        dependencies: await this.analyzeSecurityDependencies(projectRoot),
        configuration: await this.analyzeSecurityConfiguration(projectRoot),
        recommendations: []
      };

      analysis.recommendations = await this.generateSecurityRecommendations(analysis);

      console.log(`✅ Security analysis completed for: ${projectRoot}`);
      return analysis;

    } catch (error) {
      console.error(`❌ Error analyzing security needs: ${error.message}`);
      return {
        vulnerabilities: [],
        bestPractices: [],
        authentication: {},
        authorization: {},
        dataProtection: {},
        dependencies: {},
        configuration: {},
        recommendations: []
      };
    }
  }

  /**
   * Detect security vulnerabilities
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Array>} Security vulnerabilities found
   */
  async detectSecurityVulnerabilities(projectRoot) {
    const vulnerabilities = [];
    const codeSamples = await this.extractCodeSamples(projectRoot);

    for (const sample of codeSamples) {
      for (const vuln of this.securityPatterns.vulnerabilities) {
        const matches = sample.content.match(vuln.pattern);
        if (matches) {
          vulnerabilities.push({
            file: sample.file,
            pattern: vuln.pattern.toString(),
            severity: vuln.severity,
            message: vuln.message,
            line: this.findLineNumber(sample.content, vuln.pattern),
            matches: matches.length
          });
        }
      }
    }

    return vulnerabilities;
  }

  /**
   * Detect security best practices
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Array>} Security best practices found
   */
  async detectSecurityBestPractices(projectRoot) {
    const bestPractices = [];
    const codeSamples = await this.extractCodeSamples(projectRoot);

    for (const sample of codeSamples) {
      for (const practice of this.securityPatterns.bestPractices) {
        const matches = sample.content.match(practice.pattern);
        if (matches) {
          bestPractices.push({
            file: sample.file,
            pattern: practice.pattern.toString(),
            severity: practice.severity,
            message: practice.message,
            line: this.findLineNumber(sample.content, practice.pattern),
            matches: matches.length
          });
        }
      }
    }

    return bestPractices;
  }

  /**
   * Analyze authentication patterns
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Object>} Authentication analysis
   */
  async analyzeAuthentication(projectRoot) {
    const authentication = {
      methods: [],
      libraries: [],
      patterns: [],
      security: 'unknown'
    };

    try {
      // Check package.json for authentication libraries
      const packageJsonPath = path.join(projectRoot, 'package.json');
      if (await fileUtils.fileExists(packageJsonPath)) {
        const packageContent = await fileUtils.readFile(packageJsonPath);
        const packageData = JSON.parse(packageContent);
        const deps = { ...packageData.dependencies, ...packageData.devDependencies };

        if (deps['jsonwebtoken']) {authentication.libraries.push('jsonwebtoken');}
        if (deps['passport']) {authentication.libraries.push('passport');}
        if (deps['bcrypt']) {authentication.libraries.push('bcrypt');}
        if (deps['argon2']) {authentication.libraries.push('argon2');}
        if (deps['express-session']) {authentication.libraries.push('express-session');}
        if (deps['cookie-session']) {authentication.libraries.push('cookie-session');}
      }

      // Analyze code for authentication patterns
      const codeSamples = await this.extractCodeSamples(projectRoot);
      for (const sample of codeSamples) {
        for (const authPattern of this.securityPatterns.authentication) {
          const matches = sample.content.match(authPattern.pattern);
          if (matches) {
            authentication.patterns.push({
              file: sample.file,
              pattern: authPattern.pattern.toString(),
              message: authPattern.message,
              matches: matches.length
            });
          }
        }
      }

      // Determine authentication security level
      if (authentication.libraries.includes('bcrypt') || authentication.libraries.includes('argon2')) {
        authentication.security = 'high';
      } else if (authentication.libraries.length > 0) {
        authentication.security = 'medium';
      } else {
        authentication.security = 'low';
      }

    } catch (error) {
      console.error(`Error analyzing authentication: ${error.message}`);
    }

    return authentication;
  }

  /**
   * Analyze authorization patterns
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Object>} Authorization analysis
   */
  async analyzeAuthorization(projectRoot) {
    const authorization = {
      methods: [],
      patterns: [],
      security: 'unknown'
    };

    try {
      // Check package.json for authorization libraries
      const packageJsonPath = path.join(projectRoot, 'package.json');
      if (await fileUtils.fileExists(packageJsonPath)) {
        const packageContent = await fileUtils.readFile(packageJsonPath);
        const packageData = JSON.parse(packageContent);
        const deps = { ...packageData.dependencies, ...packageData.devDependencies };

        if (deps['casl']) {authorization.methods.push('casl');}
        if (deps['accesscontrol']) {authorization.methods.push('accesscontrol');}
        if (deps['rbac']) {authorization.methods.push('rbac');}
      }

      // Analyze code for authorization patterns
      const codeSamples = await this.extractCodeSamples(projectRoot);
      for (const sample of codeSamples) {
        if (sample.content.includes('role') || sample.content.includes('permission')) {
          authorization.patterns.push({
            file: sample.file,
            pattern: 'role-based',
            message: 'Role-based authorization detected'
          });
        }
        if (sample.content.includes('middleware') && sample.content.includes('auth')) {
          authorization.patterns.push({
            file: sample.file,
            pattern: 'middleware',
            message: 'Authentication middleware detected'
          });
        }
      }

      // Determine authorization security level
      if (authorization.methods.length > 0) {
        authorization.security = 'high';
      } else if (authorization.patterns.length > 0) {
        authorization.security = 'medium';
      } else {
        authorization.security = 'low';
      }

    } catch (error) {
      console.error(`Error analyzing authorization: ${error.message}`);
    }

    return authorization;
  }

  /**
   * Analyze data protection patterns
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Object>} Data protection analysis
   */
  async analyzeDataProtection(projectRoot) {
    const dataProtection = {
      encryption: [],
      hashing: [],
      sanitization: [],
      validation: [],
      security: 'unknown'
    };

    try {
      // Check package.json for data protection libraries
      const packageJsonPath = path.join(projectRoot, 'package.json');
      if (await fileUtils.fileExists(packageJsonPath)) {
        const packageContent = await fileUtils.readFile(packageJsonPath);
        const packageData = JSON.parse(packageContent);
        const deps = { ...packageData.dependencies, ...packageData.devDependencies };

        if (deps['crypto']) {dataProtection.encryption.push('crypto');}
        if (deps['bcrypt']) {dataProtection.hashing.push('bcrypt');}
        if (deps['argon2']) {dataProtection.hashing.push('argon2');}
        if (deps['joi']) {dataProtection.validation.push('joi');}
        if (deps['yup']) {dataProtection.validation.push('yup');}
        if (deps['validator']) {dataProtection.sanitization.push('validator');}
        if (deps['dompurify']) {dataProtection.sanitization.push('dompurify');}
      }

      // Analyze code for data protection patterns
      const codeSamples = await this.extractCodeSamples(projectRoot);
      for (const sample of codeSamples) {
        for (const protectionPattern of this.securityPatterns.dataProtection) {
          const matches = sample.content.match(protectionPattern.pattern);
          if (matches) {
            const category = protectionPattern.pattern.toString().includes('encrypt') ? 'encryption' :
              protectionPattern.pattern.toString().includes('hash') ? 'hashing' :
                protectionPattern.pattern.toString().includes('sanitize') ? 'sanitization' :
                  protectionPattern.pattern.toString().includes('validate') ? 'validation' : 'other';

            dataProtection[category].push({
              file: sample.file,
              pattern: protectionPattern.pattern.toString(),
              message: protectionPattern.message,
              matches: matches.length
            });
          }
        }
      }

      // Determine data protection security level
      const totalProtections = dataProtection.encryption.length + dataProtection.hashing.length +
                              dataProtection.sanitization.length + dataProtection.validation.length;

      if (totalProtections > 5) {
        dataProtection.security = 'high';
      } else if (totalProtections > 2) {
        dataProtection.security = 'medium';
      } else {
        dataProtection.security = 'low';
      }

    } catch (error) {
      console.error(`Error analyzing data protection: ${error.message}`);
    }

    return dataProtection;
  }

  /**
   * Analyze security dependencies
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Object>} Security dependencies analysis
   */
  async analyzeSecurityDependencies(projectRoot) {
    const securityDeps = {
      libraries: [],
      vulnerabilities: [],
      outdated: [],
      security: 'unknown'
    };

    try {
      // Check package.json for security-related dependencies
      const packageJsonPath = path.join(projectRoot, 'package.json');
      if (await fileUtils.fileExists(packageJsonPath)) {
        const packageContent = await fileUtils.readFile(packageJsonPath);
        const packageData = JSON.parse(packageContent);
        const deps = { ...packageData.dependencies, ...packageData.devDependencies };

        // Check for security libraries
        const securityLibs = ['helmet', 'cors', 'express-rate-limit', 'express-validator', 'bcrypt', 'jsonwebtoken'];
        for (const lib of securityLibs) {
          if (deps[lib]) {
            securityDeps.libraries.push(lib);
          }
        }
      }

      // Check for security audit results
      const auditPath = path.join(projectRoot, 'audit-results.json');
      if (await fileUtils.fileExists(auditPath)) {
        try {
          const auditContent = await fileUtils.readFile(auditPath);
          const auditData = JSON.parse(auditContent);
          securityDeps.vulnerabilities = auditData.vulnerabilities || [];
        } catch (error) {
          // Ignore audit file parsing errors
        }
      }

      // Determine security dependency level
      if (securityDeps.libraries.length > 3) {
        securityDeps.security = 'high';
      } else if (securityDeps.libraries.length > 1) {
        securityDeps.security = 'medium';
      } else {
        securityDeps.security = 'low';
      }

    } catch (error) {
      console.error(`Error analyzing security dependencies: ${error.message}`);
    }

    return securityDeps;
  }

  /**
   * Analyze security configuration
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Object>} Security configuration analysis
   */
  async analyzeSecurityConfiguration(projectRoot) {
    const securityConfig = {
      headers: [],
      cors: [],
      rateLimit: [],
      ssl: [],
      security: 'unknown'
    };

    try {
      // Check for security configuration files
      const configFiles = [
        'security.config.js',
        'helmet.config.js',
        'cors.config.js',
        'rate-limit.config.js'
      ];

      for (const configFile of configFiles) {
        const configPath = path.join(projectRoot, configFile);
        if (await fileUtils.fileExists(configPath)) {
          securityConfig.headers.push(configFile);
        }
      }

      // Analyze code for security configuration
      const codeSamples = await this.extractCodeSamples(projectRoot);
      for (const sample of codeSamples) {
        if (sample.content.includes('helmet')) {
          securityConfig.headers.push('helmet');
        }
        if (sample.content.includes('cors')) {
          securityConfig.cors.push('cors');
        }
        if (sample.content.includes('rateLimit') || sample.content.includes('rate-limit')) {
          securityConfig.rateLimit.push('rate-limit');
        }
        if (sample.content.includes('https') || sample.content.includes('ssl')) {
          securityConfig.ssl.push('ssl');
        }
      }

      // Determine security configuration level
      const totalConfigs = securityConfig.headers.length + securityConfig.cors.length +
                          securityConfig.rateLimit.length + securityConfig.ssl.length;

      if (totalConfigs > 3) {
        securityConfig.security = 'high';
      } else if (totalConfigs > 1) {
        securityConfig.security = 'medium';
      } else {
        securityConfig.security = 'low';
      }

    } catch (error) {
      console.error(`Error analyzing security configuration: ${error.message}`);
    }

    return securityConfig;
  }

  // Private methods

  async extractCodeSamples(projectRoot) {
    const samples = [];

    try {
      const jsFiles = await fileUtils.getFilesByExtension(projectRoot, ['.js', '.jsx', '.ts', '.tsx']);
      const filesToAnalyze = jsFiles.slice(0, 20); // Limit for performance

      for (const file of filesToAnalyze) {
        try {
          const content = await fileUtils.readFile(file);
          samples.push({
            file,
            content,
            extension: path.extname(file)
          });
        } catch (error) {
          console.error(`Error reading file ${file}: ${error.message}`);
        }
      }
    } catch (error) {
      console.error(`Error extracting code samples: ${error.message}`);
    }

    return samples;
  }

  findLineNumber(content, pattern) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        return i + 1;
      }
    }
    return -1;
  }

  async generateSecurityRecommendations(analysis) {
    const recommendations = [];

    // Vulnerability recommendations
    if (analysis.vulnerabilities.length > 0) {
      const criticalVulns = analysis.vulnerabilities.filter(v => v.severity === 'critical');
      const highVulns = analysis.vulnerabilities.filter(v => v.severity === 'high');

      if (criticalVulns.length > 0) {
        recommendations.push({
          type: 'vulnerability',
          priority: 'critical',
          message: `${criticalVulns.length} critical security vulnerabilities found`,
          suggestion: 'Address critical security vulnerabilities immediately'
        });
      }

      if (highVulns.length > 0) {
        recommendations.push({
          type: 'vulnerability',
          priority: 'high',
          message: `${highVulns.length} high-severity security vulnerabilities found`,
          suggestion: 'Address high-severity security vulnerabilities as soon as possible'
        });
      }
    }

    // Authentication recommendations
    if (analysis.authentication.security === 'low') {
      recommendations.push({
        type: 'authentication',
        priority: 'high',
        message: 'Weak authentication security detected',
        suggestion: 'Implement strong authentication mechanisms'
      });
    }

    // Authorization recommendations
    if (analysis.authorization.security === 'low') {
      recommendations.push({
        type: 'authorization',
        priority: 'medium',
        message: 'Weak authorization security detected',
        suggestion: 'Implement proper authorization mechanisms'
      });
    }

    // Data protection recommendations
    if (analysis.dataProtection.security === 'low') {
      recommendations.push({
        type: 'data-protection',
        priority: 'medium',
        message: 'Weak data protection detected',
        suggestion: 'Implement data encryption, hashing, and validation'
      });
    }

    // Security configuration recommendations
    if (analysis.configuration.security === 'low') {
      recommendations.push({
        type: 'configuration',
        priority: 'medium',
        message: 'Weak security configuration detected',
        suggestion: 'Implement security headers, CORS, and rate limiting'
      });
    }

    return recommendations;
  }
}
