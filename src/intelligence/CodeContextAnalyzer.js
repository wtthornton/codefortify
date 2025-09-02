/**
 * Code Context Analyzer
 * Analyzes file context to provide intelligent recommendations
 */

import path from 'path';

export class CodeContextAnalyzer {
  /**
   * Analyze file context and extract relevant information
   * @param {string} filePath - Path to the file
   * @param {string} fileContent - Content of the file
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Context analysis result
   */
  async analyze(filePath, fileContent, options = {}) {
    const context = {
      filePath,
      fileName: path.basename(filePath),
      fileExtension: path.extname(filePath),
      fileType: this.determineFileType(filePath),
      lines: fileContent.split('\n'),
      complexity: this.calculateComplexity(fileContent),
      dependencies: this.extractDependencies(fileContent),
      detectedPatterns: this.detectPatterns(fileContent, options.framework),
      functions: this.extractFunctions(fileContent),
      classes: this.extractClasses(fileContent),
      exports: this.extractExports(fileContent),
      imports: this.extractImports(fileContent)
    };

    return context;
  }

  /**
   * Determine the type of file based on its path and name
   * @param {string} filePath - File path
   * @returns {string} File type
   */
  determineFileType(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    const basename = path.basename(filePath).toLowerCase();

    if (basename.includes('test') || basename.includes('spec')) {return 'test';}
    if (basename.includes('config')) {return 'config';}
    if (extension === '.jsx' || extension === '.tsx') {return 'component';}
    if (extension === '.js' || extension === '.ts') {return 'module';}
    if (extension === '.css' || extension === '.scss') {return 'styles';}

    return 'unknown';
  }

  /**
   * Calculate complexity metrics for the code
   * @param {string} code - Code to analyze
   * @returns {Object} Complexity metrics
   */
  calculateComplexity(code) {
    const lines = code.split('\n').length;
    const functions = (code.match(/function|=>/g) || []).length;
    const conditions = (code.match(/if|while|for|switch/g) || []).length;

    return {
      lines,
      functions,
      conditions,
      score: Math.min((lines / 20) + (functions / 5) + (conditions / 3), 10)
    };
  }

  /**
   * Extract dependencies from the code
   * @param {string} code - Code to analyze
   * @returns {Array<string>} List of dependencies
   */
  extractDependencies(code) {
    const importRegex = /import.*from ['"]([^'"]+)['"]/g;
    const requireRegex = /require\\(['"]([^'"]+)['"]\\)/g;
    const dependencies = new Set();

    let match;
    while ((match = importRegex.exec(code)) !== null) {
      dependencies.add(match[1]);
    }

    while ((match = requireRegex.exec(code)) !== null) {
      dependencies.add(match[1]);
    }

    return Array.from(dependencies);
  }

  /**
   * Detect code patterns based on framework and code content
   * @param {string} code - Code to analyze
   * @param {Object} framework - Framework information
   * @returns {Array<string>} Detected patterns
   */
  detectPatterns(code, framework = {}) {
    const patterns = [];

    // React patterns
    if (framework.name === 'react') {
      if (code.includes('useState')) {patterns.push('react-hooks');}
      if (code.includes('useEffect')) {patterns.push('react-effects');}
      if (code.includes('React.memo')) {patterns.push('react-optimization');}
      if (code.includes('jsx')) {patterns.push('jsx');}
    }

    // General patterns
    if (code.includes('async') || code.includes('await')) {patterns.push('async-await');}
    if (code.includes('Promise')) {patterns.push('promises');}
    if (code.includes('class')) {patterns.push('classes');}
    if (code.includes('=>')) {patterns.push('arrow-functions');}

    return patterns;
  }

  /**
   * Extract function names from the code
   * @param {string} code - Code to analyze
   * @returns {Array<string>} Function names
   */
  extractFunctions(code) {
    const functionRegex = /(?:function\\s+(\\w+)|const\\s+(\\w+)\\s*=|\\s+(\\w+)\\s*:)/g;
    const functions = [];

    let match;
    while ((match = functionRegex.exec(code)) !== null) {
      functions.push(match[1] || match[2] || match[3]);
    }

    return functions;
  }

  /**
   * Extract class names from the code
   * @param {string} code - Code to analyze
   * @returns {Array<string>} Class names
   */
  extractClasses(code) {
    const classRegex = /class\\s+(\\w+)/g;
    const classes = [];

    let match;
    while ((match = classRegex.exec(code)) !== null) {
      classes.push(match[1]);
    }

    return classes;
  }

  /**
   * Extract exports from the code
   * @param {string} code - Code to analyze
   * @returns {Array<string>} Exported identifiers
   */
  extractExports(code) {
    const exportRegex = /export\\s+(?:default\\s+)?(\\w+)|export\\s*{([^}]+)}/g;
    const exports = [];

    let match;
    while ((match = exportRegex.exec(code)) !== null) {
      if (match[1]) {
        exports.push(match[1]);
      } else if (match[2]) {
        exports.push(...match[2].split(',').map(e => e.trim()));
      }
    }

    return exports;
  }

  /**
   * Extract imports from the code
   * @param {string} code - Code to analyze
   * @returns {Array<Object>} Import information
   */
  extractImports(code) {
    const importRegex = /import\\s+(?:{([^}]+)}|([^\\s,]+))\\s+from\\s+['"]([^'"]+)['"]/g;
    const imports = [];

    let match;
    while ((match = importRegex.exec(code)) !== null) {
      imports.push({
        named: match[1] ? match[1].split(',').map(i => i.trim()) : null,
        default: match[2] || null,
        source: match[3]
      });
    }

    return imports;
  }
}