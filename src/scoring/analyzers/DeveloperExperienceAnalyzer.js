/**
 * DeveloperExperienceAnalyzer - Analyzes tooling and workflow setup
 *
 * Evaluates:
 * - Development tooling and automation (4pts)
 * - Documentation quality and completeness (3pts)
 * - Package.json scripts and workflow (2pts)
 * - Version control and collaboration setup (1pt)
 * Total: 10pts
 */

import { BaseAnalyzer } from './BaseAnalyzer.js';

/**


 * DeveloperExperienceAnalyzer class implementation


 *


 * Provides functionality for developerexperienceanalyzer operations


 */


/**


 * DeveloperExperienceAnalyzer class implementation


 *


 * Provides functionality for developerexperienceanalyzer operations


 */


export class DeveloperExperienceAnalyzer extends BaseAnalyzer {
  constructor(config) {
    super(config);
    this.categoryName = 'Developer Experience';
    this.description = 'Development tooling, documentation, scripts, and workflow setup';
  }  /**
   * Runs the specified task
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Runs the specified task
   * @returns {Promise} Promise that resolves with the result
   */


  async runAnalysis() {
    this.results.score = 0;
    this.results.issues = [];
    this.results.suggestions = [];

    await this.analyzeDevelopmentTooling(); // 4pts
    await this.analyzeDocumentationQuality(); // 3pts
    await this.analyzePackageScripts(); // 2pts
    await this.analyzeVersionControlSetup(); // 1pt
  }  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */


  async analyzeDevelopmentTooling() {
    let score = 0;
    const maxScore = 4;

    const packageJson = await this.readPackageJson();    /**
   * Performs the specified operation
   * @param {any} !packageJson
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !packageJson
   * @returns {any} The operation result
   */

    if (!packageJson) {
      this.addIssue('No package.json found', 'Cannot analyze development dependencies');
      return;
    }

    const devDeps = packageJson.devDependencies || {};
    const deps = packageJson.dependencies || {};
    const allDeps = { ...deps, ...devDeps };

    // Check for code quality tools
    const lintingTools = ['eslint', '@eslint/js', 'tslint', 'jshint'];
    const formattingTools = ['prettier', 'standardjs', 'beautify'];
    const hasLinting = lintingTools.some(tool => allDeps[tool]);
    const hasFormatting = formattingTools.some(tool => allDeps[tool]);    /**
   * Performs the specified operation
   * @param {boolean} hasLinting
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {boolean} hasLinting
   * @returns {any} The operation result
   */


    if (hasLinting) {
      score += 1;
      this.addScore(1, 1, 'Code linting tools configured');
    }

    else {
      this.addIssue('No linting tools found', 'Add ESLint or similar for code quality');
    }    /**
   * Performs the specified operation
   * @param {boolean} hasFormatting
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {boolean} hasFormatting
   * @returns {any} The operation result
   */


    if (hasFormatting) {
      score += 1;
      this.addScore(1, 1, 'Code formatting tools configured');
    }

    else {
      this.addIssue('No formatting tools found', 'Add Prettier for consistent code formatting');
    }

    // Check for build tools and bundlers
    const buildTools = [
      'webpack', 'rollup', 'vite', 'parcel', 'esbuild', 'swc',
      'babel', '@babel/core', 'typescript', 'ts-node'
    ];
    const hasBuildTools = buildTools.some(tool => allDeps[tool]);    /**
   * Performs the specified operation
   * @param {boolean} hasBuildTools
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {boolean} hasBuildTools
   * @returns {any} The operation result
   */


    if (hasBuildTools) {
      score += 1;
      this.addScore(1, 1, 'Build tooling detected');
    }

    // Check for development convenience tools
    const devTools = [
      'nodemon', 'concurrently', 'cross-env', 'dotenv',
      'husky', 'lint-staged', 'commitizen', 'conventional-commits'
    ];
    const hasDevTools = devTools.some(tool => allDeps[tool]);    /**
   * Performs the specified operation
   * @param {boolean} hasDevTools
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {boolean} hasDevTools
   * @returns {any} The operation result
   */


    if (hasDevTools) {
      score += 1;
      this.addScore(1, 1, 'Development convenience tools found');
    }

    else {
      this.addIssue('Limited development tooling', 'Consider adding nodemon, husky, or other dev tools');
    }

    this.setDetail('hasLinting', hasLinting);
    this.setDetail('hasFormatting', hasFormatting);
    this.setDetail('hasBuildTools', hasBuildTools);
    this.setDetail('hasDevTools', hasDevTools);
  }  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */


  async analyzeDocumentationQuality() {
    let score = 0;
    const maxScore = 3;

    // Check for README
    let readmeScore = 0;
    const hasReadme = await this.fileExists('README.md');    /**
   * Performs the specified operation
   * @param {boolean} hasReadme
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {boolean} hasReadme
   * @returns {any} The operation result
   */


    if (hasReadme) {
      try {
        const readmeContent = await this.readFile('README.md');
        const readmeLength = readmeContent.length;        /**
   * Performs the specified operation
   * @param {any} readmeLength > 2000
   * @returns {string} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} readmeLength > 2000
   * @returns {string} The operation result
   */


        if (readmeLength > 2000) {
          readmeScore = 2;
          this.addScore(2, 2, 'Comprehensive README documentation');
        }

        else if (readmeLength > 500) {
          readmeScore = 1;
          this.addScore(1, 2, 'Basic README documentation');
        }

        else {
          readmeScore = 0.5;
          this.addScore(0.5, 2, 'Minimal README found');
          this.addIssue('README is very short', 'Expand README with installation, usage, and examples');
        }

        // Check for common README sections
        const commonSections = [
          'install', 'usage', 'example', 'api', 'contribut',
          'license', 'getting started', 'requirements'
        ];
        const sectionCount = commonSections.filter(section =>
          readmeContent.toLowerCase().includes(section)
        ).length;        /**
   * Performs the specified operation
   * @param {number} sectionCount > - Optional parameter
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {number} sectionCount > - Optional parameter
   * @returns {any} The operation result
   */


        if (sectionCount >= 4) {
          readmeScore += 0.5;
          this.addScore(0.5, 0.5, 'README has good section coverage');
        }

      }

      catch (error) {
        this.addIssue('Could not read README', 'Ensure README.md is accessible');
      }
    }

    else {
      this.addIssue('No README.md found', 'Create comprehensive project documentation');
    }

    score += Math.min(readmeScore, 2);

    // Check for additional documentation
    const docFiles = [
      'CONTRIBUTING.md', 'CHANGELOG.md', 'API.md', 'USAGE.md',
      'docs/', 'documentation/', '.github/'
    ];

    let additionalDocs = 0;    /**
   * Performs the specified operation
   * @param {string} const docPath of docFiles
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {string} const docPath of docFiles
   * @returns {any} The operation result
   */

    for (const docPath of docFiles) {
      if (await this.fileExists(docPath)) {
        additionalDocs++;
      }
    }    /**
   * Performs the specified operation
   * @param {any} additionalDocs > 0
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} additionalDocs > 0
   * @returns {any} The operation result
   */


    if (additionalDocs > 0) {
      const docScore = Math.min(additionalDocs / 3, 1);
      score += docScore;
      this.addScore(docScore, 1, `Additional documentation found (${additionalDocs} items)`);
    }

    else {
      this.addIssue('No additional documentation', 'Consider adding CONTRIBUTING.md or API docs');
    }

    this.setDetail('readmeLength', hasReadme ? 'exists' : 'missing');
    this.setDetail('additionalDocs', additionalDocs);
  }  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */


  async analyzePackageScripts() {
    let score = 0;
    const maxScore = 2;

    const packageJson = await this.readPackageJson();    /**
   * Performs the specified operation
   * @param {any} !packageJson || !packageJson.scripts
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !packageJson || !packageJson.scripts
   * @returns {any} The operation result
   */

    if (!packageJson || !packageJson.scripts) {
      this.addIssue('No package.json scripts found', 'Add useful npm scripts for development');
      return;
    }

    const scripts = packageJson.scripts;
    const scriptNames = Object.keys(scripts);

    // Check for essential scripts
    const essentialScripts = ['test', 'start', 'build'];
    const hasEssentialScripts = essentialScripts.filter(script => scripts[script]);    /**
   * Performs the specified operation
   * @param {boolean} hasEssentialScripts.length > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {boolean} hasEssentialScripts.length > - Optional parameter
   * @returns {any} The operation result
   */


    if (hasEssentialScripts.length >= 3) {
      score += 1;
      this.addScore(1, 1, 'Essential scripts present (test, start, build)');
    }

    else if (hasEssentialScripts.length >= 2) {
      score += 0.5;
      this.addScore(0.5, 1, `Some essential scripts present (${hasEssentialScripts.join(', ')})`);
    }

    else {
      this.addIssue('Missing essential scripts', 'Add test, start, and build scripts');
    }

    // Check for development convenience scripts
    const devScripts = [
      'dev', 'develop', 'watch', 'serve',
      'lint', 'format', 'type-check', 'typecheck',
      'clean', 'prebuild', 'postbuild'
    ];
    const hasDevScripts = devScripts.filter(script => scripts[script]);    /**
   * Performs the specified operation
   * @param {boolean} hasDevScripts.length > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {boolean} hasDevScripts.length > - Optional parameter
   * @returns {any} The operation result
   */


    if (hasDevScripts.length >= 3) {
      score += 1;
      this.addScore(1, 1, `Good development script coverage (${hasDevScripts.length} scripts)`);
    }

    else if (hasDevScripts.length >= 1) {
      score += 0.5;
      this.addScore(0.5, 1, `Some development scripts present (${hasDevScripts.join(', ')})`);
    }

    else {
      this.addIssue('Limited development scripts', 'Add dev, lint, format scripts for better workflow');
    }

    this.setDetail('scriptCount', scriptNames.length);
    this.setDetail('essentialScripts', hasEssentialScripts);
    this.setDetail('devScripts', hasDevScripts);
  }  /**
   * Sets configuration
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Sets configuration
   * @returns {Promise} Promise that resolves with the result
   */


  async analyzeVersionControlSetup() {
    let score = 0;
    const maxScore = 1;

    // Check for .gitignore
    const hasGitignore = await this.fileExists('.gitignore');    /**
   * Performs the specified operation
   * @param {boolean} hasGitignore
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {boolean} hasGitignore
   * @returns {any} The operation result
   */

    if (hasGitignore) {
      try {
        const gitignoreContent = await this.readFile('.gitignore');
        const commonEntries = [
          'node_modules', '.env', 'dist', 'build',
          '.DS_Store', '*.log', 'coverage'
        ];

        const entryCount = commonEntries.filter(entry =>
          gitignoreContent.includes(entry)
        ).length;        /**
   * Performs the specified operation
   * @param {number} entryCount > - Optional parameter
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {number} entryCount > - Optional parameter
   * @returns {any} The operation result
   */


        if (entryCount >= 4) {
          score += 0.5;
          this.addScore(0.5, 0.5, 'Comprehensive .gitignore configuration');
        }

        else if (entryCount >= 2) {
          score += 0.25;
          this.addScore(0.25, 0.5, 'Basic .gitignore configuration');
        }

        else {
          this.addIssue('Incomplete .gitignore', 'Add common ignore patterns (node_modules, .env, etc.)');
        }
      }

      catch (error) {
        this.addIssue('Could not read .gitignore', 'Ensure .gitignore is properly configured');
      }
    }

    else {
      this.addIssue('No .gitignore found', 'Create .gitignore to exclude unnecessary files');
    }

    // Check for Git hooks or workflow files
    const workflowFiles = [
      '.github/workflows/', '.github/PULL_REQUEST_TEMPLATE.md',
      '.github/ISSUE_TEMPLATE/', '.husky/', 'pre-commit',
      '.gitlab-ci.yml', 'azure-pipelines.yml', 'Jenkinsfile'
    ];

    let workflowSetup = 0;    /**
   * Performs the specified operation
   * @param {string} const workflowPath of workflowFiles
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {string} const workflowPath of workflowFiles
   * @returns {any} The operation result
   */

    for (const workflowPath of workflowFiles) {
      if (await this.fileExists(workflowPath)) {
        workflowSetup++;
      }
    }    /**
   * Performs the specified operation
   * @param {any} workflowSetup > 0
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} workflowSetup > 0
   * @returns {any} The operation result
   */


    if (workflowSetup > 0) {
      score += 0.5;
      this.addScore(0.5, 0.5, `CI/CD or Git workflow setup detected (${workflowSetup} items)`);
    }

    else {
      this.addIssue('No workflow automation detected', 'Consider adding GitHub Actions or Git hooks');
    }

    this.setDetail('hasGitignore', hasGitignore);
    this.setDetail('workflowSetup', workflowSetup);
  }
}