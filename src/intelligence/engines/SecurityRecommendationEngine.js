/**
 * Security Recommendation Engine
 * Generates security-focused recommendations
 */

export class SecurityRecommendationEngine {
  constructor(options = {}) {
    this.options = options;
    this.securityPatterns = [
      'password', 'token', 'secret', 'key', 'auth', 'credential',
      'api_key', 'session', 'cookie', 'jwt', 'oauth'
    ];
  }

  /**
   * Generate security recommendations
   * @param {Object} context - Code context
   * @returns {Promise<Array>} Security recommendations
   */
  async generateRecommendations(context) {
    const recommendations = [];

    // Check for hardcoded secrets
    recommendations.push(...this.checkHardcodedSecrets(context));

    // Check for insecure authentication
    recommendations.push(...this.checkAuthentication(context));

    // Check for input validation
    recommendations.push(...this.checkInputValidation(context));

    // Check for secure communication
    recommendations.push(...this.checkSecureCommunication(context));

    // Check for error handling
    recommendations.push(...this.checkErrorHandling(context));

    return recommendations.filter(rec => rec !== null);
  }

  /**
   * Check for hardcoded secrets and credentials
   * @param {Object} context - Code context
   * @returns {Array} Recommendations
   */
  checkHardcodedSecrets(context) {
    const recommendations = [];
    const content = context.lines.join('\n').toLowerCase();

    // Check for potential hardcoded secrets
    const secretPatterns = [
      /(?:password|pwd|pass)\s*[:=]\s*['"][^'"]{8,}['"]/i,
      /(?:api[_-]?key|token)\s*[:=]\s*['"][a-zA-Z0-9]{16,}['"]/i,
      /(?:secret|private[_-]?key)\s*[:=]\s*['"][^'"]{20,}['"]/i
    ];

    secretPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        recommendations.push({
          type: 'security',
          category: 'secrets',
          priority: 'critical',
          confidence: 0.8,
          title: 'Hardcoded Secret Detected',
          description: 'Avoid hardcoding secrets, passwords, or API keys in source code',
          suggestion: 'Use environment variables or secure configuration management',
          impact: 'High security risk - credentials could be exposed',
          fixExamples: [
            'Use process.env.API_KEY instead of hardcoded values',
            'Implement secure key management (AWS Secrets Manager, Azure Key Vault)',
            'Use .env files with proper .gitignore configuration'
          ]
        });
      }
    });

    return recommendations;
  }

  /**
   * Check authentication implementation
   * @param {Object} context - Code context
   * @returns {Array} Recommendations
   */
  checkAuthentication(context) {
    const recommendations = [];
    const content = context.lines.join('\n');

    // Check for weak password policies
    if (content.includes('password') && !content.includes('bcrypt') && !content.includes('hash')) {
      recommendations.push({
        type: 'security',
        category: 'authentication',
        priority: 'high',
        confidence: 0.7,
        title: 'Weak Password Storage',
        description: 'Passwords should be properly hashed using strong algorithms',
        suggestion: 'Use bcrypt or similar strong hashing algorithms',
        fixExamples: [
          'const hashedPassword = await bcrypt.hash(password, 10);',
          'Implement password complexity requirements',
          'Add password strength validation'
        ]
      });
    }

    // Check for JWT security
    if (content.includes('jwt') && !content.includes('verify')) {
      recommendations.push({
        type: 'security',
        category: 'authentication',
        priority: 'high',
        confidence: 0.6,
        title: 'JWT Verification Missing',
        description: 'JWT tokens should be properly verified',
        suggestion: 'Always verify JWT signatures and expiration',
        fixExamples: [
          'jwt.verify(token, secretKey, { algorithms: ["HS256"] });',
          'Check token expiration and claims',
          'Implement proper error handling for invalid tokens'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Check input validation
   * @param {Object} context - Code context
   * @returns {Array} Recommendations
   */
  checkInputValidation(context) {
    const recommendations = [];
    const content = context.lines.join('\n');

    // Check for SQL injection vulnerabilities
    if (content.includes('SELECT') || content.includes('INSERT')) {
      if (!content.includes('prepared') && !content.includes('parameterized')) {
        recommendations.push({
          type: 'security',
          category: 'validation',
          priority: 'critical',
          confidence: 0.8,
          title: 'SQL Injection Risk',
          description: 'Direct SQL queries without parameterization are vulnerable',
          suggestion: 'Use parameterized queries or ORM with prepared statements',
          fixExamples: [
            'Use prepared statements: db.query("SELECT * FROM users WHERE id = ?", [userId])',
            'Use ORM query builders instead of raw SQL',
            'Validate and sanitize all user inputs'
          ]
        });
      }
    }

    // Check for XSS vulnerabilities
    if (context.detectedPatterns.includes('jsx') && !content.includes('dangerouslySetInnerHTML')) {
      if (content.includes('innerHTML') || content.includes('html')) {
        recommendations.push({
          type: 'security',
          category: 'validation',
          priority: 'high',
          confidence: 0.7,
          title: 'XSS Vulnerability Risk',
          description: 'Direct HTML insertion can lead to XSS attacks',
          suggestion: 'Sanitize user input and use safe React patterns',
          fixExamples: [
            'Use React\'s built-in XSS protection instead of innerHTML',
            'Sanitize user input with libraries like DOMPurify',
            'Validate and escape user-generated content'
          ]
        });
      }
    }

    return recommendations;
  }

  /**
   * Check secure communication
   * @param {Object} context - Code context
   * @returns {Array} Recommendations
   */
  checkSecureCommunication(context) {
    const recommendations = [];
    const content = content.lines.join('\n');

    // Check for HTTP usage
    if (content.includes('http://')) {
      recommendations.push({
        type: 'security',
        category: 'communication',
        priority: 'medium',
        confidence: 0.6,
        title: 'Insecure HTTP Communication',
        description: 'HTTP connections are not encrypted and can be intercepted',
        suggestion: 'Use HTTPS for all external communications',
        fixExamples: [
          'Replace http:// URLs with https://',
          'Implement certificate pinning for critical APIs',
          'Use secure WebSocket connections (wss://)'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Check error handling for security
   * @param {Object} context - Code context
   * @returns {Array} Recommendations
   */
  checkErrorHandling(context) {
    const recommendations = [];
    const content = context.lines.join('\n');

    // Check for information disclosure in errors
    if (content.includes('error') && content.includes('stack')) {
      recommendations.push({
        type: 'security',
        category: 'errors',
        priority: 'medium',
        confidence: 0.5,
        title: 'Information Disclosure in Errors',
        description: 'Stack traces and detailed errors can reveal sensitive information',
        suggestion: 'Log detailed errors internally but return generic messages to users',
        fixExamples: [
          'Log full errors to server logs only',
          'Return generic error messages to clients',
          'Implement proper error sanitization'
        ]
      });
    }

    return recommendations;
  }
}